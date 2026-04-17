"""OAuth service for handling OAuth authentication."""

import secrets
import uuid
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.oauth_connection import OAuthConnection
from app.models.user import User


class OAuthError(Exception):
    """OAuth error with message."""

    def __init__(self, message: str, code: str = "oauth_error"):
        self.message = message
        self.code = code
        super().__init__(message)


class OAuthService:
    """Service for OAuth authentication."""

    PROVIDERS = {
        "github": {
            "auth_url": "https://github.com/login/oauth/authorize",
            "token_url": "https://github.com/login/oauth/access_token",
            "user_url": "https://api.github.com/user",
            "email_url": "https://api.github.com/user/emails",
            "scopes": ["user:email", "read:user"],
        },
        "google": {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "user_url": "https://www.googleapis.com/oauth2/v2/userinfo",
            "scopes": ["openid", "email", "profile"],
        },
    }

    def __init__(self, db: AsyncSession, redis_client=None):
        self.db = db
        self.redis = redis_client
        self.settings = get_settings()

    def _get_client_credentials(self, provider: str) -> tuple[str, str]:
        """Get client credentials for a provider."""
        if provider == "github":
            return self.settings.github_client_id, self.settings.github_client_secret
        elif provider == "google":
            return self.settings.google_client_id, self.settings.google_client_secret
        else:
            raise OAuthError(f"Unknown provider: {provider}", "unknown_provider")

    def get_oauth_url(self, provider: str, redirect_uri: str) -> tuple[str, str]:
        """Get OAuth authorization URL and state.

        Args:
            provider: OAuth provider (github, google)
            redirect_uri: Callback URL

        Returns:
            Tuple of (authorization_url, state)
        """
        if provider not in self.PROVIDERS:
            raise OAuthError(f"Unknown provider: {provider}", "unknown_provider")

        client_id, _ = self._get_client_credentials(provider)
        config = self.PROVIDERS[provider]

        # Generate state
        state = secrets.token_urlsafe(32)

        # Build authorization URL
        scopes = " ".join(config["scopes"])

        if provider == "github":
            auth_url = (
                f"{config['auth_url']}"
                f"?client_id={client_id}"
                f"&redirect_uri={redirect_uri}"
                f"&scope={scopes}"
                f"&state={state}"
            )
        elif provider == "google":
            auth_url = (
                f"{config['auth_url']}"
                f"?client_id={client_id}"
                f"&redirect_uri={redirect_uri}"
                f"&scope={scopes}"
                f"&state={state}"
                f"&response_type=code"
                f"&access_type=offline"
            )
        else:
            raise OAuthError(f"Unknown provider: {provider}", "unknown_provider")

        return auth_url, state

    async def exchange_code(
        self,
        provider: str,
        code: str,
        redirect_uri: str,
    ) -> dict[str, Any]:
        """Exchange authorization code for access token.

        Args:
            provider: OAuth provider
            code: Authorization code
            redirect_uri: Callback URL

        Returns:
            Token response from provider
        """
        if provider not in self.PROVIDERS:
            raise OAuthError(f"Unknown provider: {provider}", "unknown_provider")

        client_id, client_secret = self._get_client_credentials(provider)
        config = self.PROVIDERS[provider]

        async with httpx.AsyncClient() as client:
            if provider == "github":
                response = await client.post(
                    config["token_url"],
                    headers={"Accept": "application/json"},
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "redirect_uri": redirect_uri,
                    },
                )
            elif provider == "google":
                response = await client.post(
                    config["token_url"],
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code",
                    },
                )
            else:
                raise OAuthError(f"Unknown provider: {provider}", "unknown_provider")

            if response.status_code != 200:
                raise OAuthError(
                    f"Token exchange failed: {response.text}",
                    "token_exchange_failed",
                )

            return response.json()

    async def get_user_info(
        self,
        provider: str,
        access_token: str,
    ) -> dict[str, Any]:
        """Get user info from OAuth provider.

        Args:
            provider: OAuth provider
            access_token: Access token

        Returns:
            User info from provider
        """
        if provider not in self.PROVIDERS:
            raise OAuthError(f"Unknown provider: {provider}", "unknown_provider")

        config = self.PROVIDERS[provider]

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get(config["user_url"], headers=headers)

            if response.status_code != 200:
                raise OAuthError(
                    f"Failed to get user info: {response.text}",
                    "user_info_failed",
                )

            user_data = response.json()

            # For GitHub, also fetch email if not public
            if provider == "github" and not user_data.get("email"):
                email_response = await client.get(
                    config["email_url"],
                    headers=headers,
                )
                if email_response.status_code == 200:
                    emails = email_response.json()
                    # Find primary email
                    for email in emails:
                        if email.get("primary") and email.get("verified"):
                            user_data["email"] = email["email"]
                            break

            return user_data

    async def find_or_create_user(
        self,
        provider: str,
        provider_user_id: str,
        email: str | None,
        name: str | None,
        avatar_url: str | None,
    ) -> User:
        """Find or create a user from OAuth data.

        Args:
            provider: OAuth provider
            provider_user_id: Provider's user ID
            email: User's email
            name: User's display name
            avatar_url: User's avatar URL

        Returns:
            User object
        """
        # First, check for existing OAuth connection
        result = await self.db.execute(
            select(OAuthConnection).where(
                OAuthConnection.provider == provider,
                OAuthConnection.provider_user_id == provider_user_id,
            )
        )
        connection = result.scalar_one_or_none()

        if connection:
            # Existing connection, return user
            result = await self.db.execute(
                select(User).where(User.id == connection.user_id)
            )
            user = result.scalar_one_or_none()
            if user:
                # Update last login
                user.last_login = datetime.utcnow()
                await self.db.commit()
                return user

        # Check if user exists with this email
        if email:
            result = await self.db.execute(
                select(User).where(User.email == email)
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                # Link OAuth to existing user
                connection = OAuthConnection(
                    user_id=existing_user.id,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    provider_email=email,
                    provider_metadata={"name": name, "avatar_url": avatar_url},
                    created_at=datetime.utcnow(),
                )
                self.db.add(connection)
                existing_user.last_login = datetime.utcnow()
                await self.db.commit()
                return existing_user

        # Create new user
        username = None
        if name:
            # Create username from name (simplified)
            username = name.lower().replace(" ", "_")[:50]
            # Check if username exists
            result = await self.db.execute(
                select(User).where(User.username == username)
            )
            if result.scalar_one_or_none():
                username = f"{username}_{secrets.token_hex(4)}"

        user = User(
            email=email,
            username=username,
            avatar_url=avatar_url,
            role="user",
            is_active=True,
            is_verified=True,  # OAuth users are pre-verified
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
        )

        self.db.add(user)
        await self.db.flush()  # Get user ID

        # Create OAuth connection
        connection = OAuthConnection(
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=email,
            provider_metadata={"name": name, "avatar_url": avatar_url},
            created_at=datetime.utcnow(),
        )
        self.db.add(connection)
        await self.db.commit()

        return user

    async def connect_oauth(
        self,
        user_id: uuid.UUID,
        provider: str,
        provider_user_id: str,
        email: str | None,
        provider_metadata: dict[str, Any],
    ) -> OAuthConnection:
        """Connect an OAuth provider to an existing user.

        Args:
            user_id: User ID
            provider: OAuth provider
            provider_user_id: Provider's user ID
            email: Provider email
            provider_metadata: Additional provider data

        Returns:
            OAuthConnection object
        """
        # Check if connection already exists
        result = await self.db.execute(
            select(OAuthConnection).where(
                OAuthConnection.provider == provider,
                OAuthConnection.provider_user_id == provider_user_id,
            )
        )
        if result.scalar_one_or_none():
            raise OAuthError("OAuth account already connected", "already_connected")

        connection = OAuthConnection(
            user_id=user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=email,
            provider_metadata=provider_metadata,
            created_at=datetime.utcnow(),
        )

        self.db.add(connection)
        await self.db.commit()
        await self.db.refresh(connection)

        return connection

    async def disconnect_oauth(
        self,
        user_id: uuid.UUID,
        provider: str,
    ) -> bool:
        """Disconnect an OAuth provider from a user.

        Args:
            user_id: User ID
            provider: OAuth provider

        Returns:
            True if disconnected successfully
        """
        result = await self.db.execute(
            select(OAuthConnection).where(
                OAuthConnection.user_id == user_id,
                OAuthConnection.provider == provider,
            )
        )
        connection = result.scalar_one_or_none()

        if not connection:
            return False

        # Check if user has a password set
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        # Check if this is the only auth method
        result = await self.db.execute(
            select(OAuthConnection).where(OAuthConnection.user_id == user_id)
        )
        connections = result.scalars().all()

        if len(connections) <= 1 and not user.password_hash:
            raise OAuthError(
                "Cannot disconnect: no other authentication method available",
                "last_auth_method",
            )

        await self.db.delete(connection)
        await self.db.commit()

        return True
