"""Session management service."""

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
    generate_secure_token,
    hash_token,
    verify_refresh_token,
)
from app.models.session import Session
from app.models.user import User


class SessionService:
    """Service for managing user sessions."""

    def __init__(self, db: AsyncSession, redis_client=None):
        self.db = db
        self.redis = redis_client

    async def create_session(
        self,
        user: User,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        """Create a new session for a user.

        Returns:
            Dict with access_token, refresh_token, and session data
        """
        # Generate tokens
        access_token, access_expire = create_access_token(user.id, user.role)
        refresh_token, refresh_expire = create_refresh_token(user.id)

        # Hash tokens for storage
        access_token_hash = hash_token(access_token)
        refresh_token_hash = hash_token(refresh_token)

        # Create session record
        session = Session(
            user_id=user.id,
            token_hash=access_token_hash,
            refresh_token_hash=refresh_token_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=refresh_expire,
            created_at=datetime.now(timezone.utc),
            last_activity=datetime.now(timezone.utc),
        )

        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)

        # Cache session in Redis
        if self.redis:
            await self._cache_session(access_token_hash, user, access_expire)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "session_id": str(session.id),
        }

    async def _cache_session(
        self,
        token_hash: str,
        user: User,
        expires: datetime,
    ) -> None:
        """Cache session data in Redis."""
        if not self.redis:
            return

        ttl = int((expires - datetime.now(timezone.utc)).total_seconds())
        if ttl > 0:
            session_data = {
                "user_id": str(user.id),
                "role": user.role,
            }
            await self.redis.setex(
                f"session:{token_hash}",
                ttl,
                json.dumps(session_data),
            )

    async def validate_session(self, token: str) -> User | None:
        """Validate a session token and return the user.

        Args:
            token: The access token to validate

        Returns:
            User if valid, None otherwise
        """
        from app.models.user import User  # Avoid circular import

        token_hash = hash_token(token)

        # Check Redis cache first
        if self.redis:
            cached = await self.redis.get(f"session:{token_hash}")
            if cached:
                session_data = json.loads(cached)
                user_id = uuid.UUID(session_data["user_id"])
                # Get user from database
                result = await self.db.execute(
                    select(User).where(User.id == user_id, User.is_active == True)
                )
                user = result.scalar_one_or_none()
                if user:
                    # Update last activity
                    await self._update_last_activity(token_hash)
                    return user

        # Check database
        result = await self.db.execute(
            select(Session).where(
                Session.token_hash == token_hash,
                Session.expires_at > datetime.now(timezone.utc),
            )
        )
        session = result.scalar_one_or_none()

        if session:
            # Get user
            result = await self.db.execute(
                select(User).where(User.id == session.user_id, User.is_active == True)
            )
            user = result.scalar_one_or_none()

            if user:
                # Update last activity
                session.last_activity = datetime.now(timezone.utc)
                await self.db.commit()

                # Cache session
                if self.redis:
                    await self._cache_session(
                        token_hash,
                        user,
                        session.expires_at,
                    )

                return user

        return None

    async def validate_refresh_token_session(self, refresh_token: str) -> User | None:
        """Validate a refresh token and return the user.

        Unlike validate_session (which checks token_hash for access tokens),
        this checks refresh_token_hash — used by the nginx auth_request verify endpoint.

        Args:
            refresh_token: The refresh token from the HTTP-only cookie

        Returns:
            User if valid, None otherwise
        """
        token_hash = hash_token(refresh_token)

        result = await self.db.execute(
            select(Session).where(
                Session.refresh_token_hash == token_hash,
                Session.expires_at > datetime.now(timezone.utc),
            )
        )
        session = result.scalar_one_or_none()

        if session:
            result = await self.db.execute(
                select(User).where(User.id == session.user_id, User.is_active == True)
            )
            return result.scalar_one_or_none()

        return None

    async def _update_last_activity(self, token_hash: str) -> None:
        """Update last activity timestamp (throttled)."""
        # Only update every 5 minutes to reduce DB writes
        if self.redis:
            last_update_key = f"session_activity:{token_hash}"
            if not await self.redis.exists(last_update_key):
                result = await self.db.execute(
                    select(Session).where(Session.token_hash == token_hash)
                )
                session = result.scalar_one_or_none()
                if session:
                    session.last_activity = datetime.now(timezone.utc)
                    await self.db.commit()
                await self.redis.setex(last_update_key, 300, "1")

    async def refresh_session(self, refresh_token: str) -> dict[str, Any] | None:
        """Refresh an access token using a refresh token.

        Args:
            refresh_token: The refresh token

        Returns:
            New tokens if valid, None otherwise
        """
        from app.models.user import User  # Avoid circular import

        # Verify refresh token
        payload = verify_refresh_token(refresh_token)
        if not payload:
            return None

        refresh_token_hash = hash_token(refresh_token)

        # Check if token is blacklisted
        if self.redis:
            blacklisted = await self.redis.get(f"blacklist:{refresh_token_hash}")
            if blacklisted:
                return None

        # Find session
        result = await self.db.execute(
            select(Session).where(
                Session.refresh_token_hash == refresh_token_hash,
                Session.expires_at > datetime.now(timezone.utc),
            )
        )
        session = result.scalar_one_or_none()

        if not session:
            return None

        # Get user
        result = await self.db.execute(
            select(User).where(User.id == session.user_id, User.is_active == True)
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Generate new tokens
        access_token, access_expire = create_access_token(user.id, user.role)
        new_refresh_token, new_refresh_expire = create_refresh_token(user.id)

        access_token_hash = hash_token(access_token)
        new_refresh_token_hash = hash_token(new_refresh_token)

        # Blacklist old refresh token
        if self.redis:
            ttl = int((session.expires_at - datetime.now(timezone.utc)).total_seconds())
            if ttl > 0:
                await self.redis.setex(
                    f"blacklist:{refresh_token_hash}",
                    ttl,
                    "revoked",
                )

        # Update session
        old_access_hash = session.token_hash
        session.token_hash = access_token_hash
        session.refresh_token_hash = new_refresh_token_hash
        session.expires_at = new_refresh_expire
        session.last_activity = datetime.now(timezone.utc)
        await self.db.commit()

        # Update cache
        if self.redis:
            await self.redis.delete(f"session:{old_access_hash}")
            await self._cache_session(access_token_hash, user, access_expire)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def invalidate_session(self, session_id: uuid.UUID) -> bool:
        """Invalidate a specific session.

        Args:
            session_id: The session ID to invalidate

        Returns:
            True if session was found and invalidated
        """
        result = await self.db.execute(
            select(Session).where(Session.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return False

        # Remove from cache
        if self.redis:
            await self.redis.delete(f"session:{session.token_hash}")
            ttl = int((session.expires_at - datetime.now(timezone.utc)).total_seconds())
            if ttl > 0:
                await self.redis.setex(
                    f"blacklist:{session.refresh_token_hash}",
                    ttl,
                    "revoked",
                )

        # Delete from database
        await self.db.delete(session)
        await self.db.commit()

        return True

    async def invalidate_all_sessions(self, user_id: uuid.UUID, except_session_id: uuid.UUID | None = None) -> int:
        """Invalidate all sessions for a user.

        Args:
            user_id: The user ID
            except_session_id: Optional session ID to keep

        Returns:
            Number of sessions invalidated
        """
        result = await self.db.execute(
            select(Session).where(Session.user_id == user_id)
        )
        sessions = result.scalars().all()

        count = 0
        for session in sessions:
            if except_session_id and session.id == except_session_id:
                continue

            # Remove from cache
            if self.redis:
                await self.redis.delete(f"session:{session.token_hash}")
                ttl = int((session.expires_at - datetime.now(timezone.utc)).total_seconds())
                if ttl > 0:
                    await self.redis.setex(
                        f"blacklist:{session.refresh_token_hash}",
                        ttl,
                        "revoked",
                    )

            await self.db.delete(session)
            count += 1

        await self.db.commit()
        return count

    async def get_active_sessions(self, user_id: uuid.UUID) -> list[Session]:
        """Get all active sessions for a user.

        Args:
            user_id: The user ID

        Returns:
            List of active sessions
        """
        result = await self.db.execute(
            select(Session).where(
                Session.user_id == user_id,
                Session.expires_at > datetime.now(timezone.utc),
            )
        )
        return list(result.scalars().all())
