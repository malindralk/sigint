"""Authentication service."""

import re
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User


class AuthError(Exception):
    """Authentication error with message."""

    def __init__(self, message: str, code: str = "auth_error"):
        self.message = message
        self.code = code
        super().__init__(message)


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """Validate password strength.

        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(password) < 12:
            return False, "Password must be at least 12 characters long"
        if not re.search(r"[A-Z]", password):
            return False, "Password must contain an uppercase letter"
        if not re.search(r"[a-z]", password):
            return False, "Password must contain a lowercase letter"
        if not re.search(r"\d", password):
            return False, "Password must contain a digit"
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False, "Password must contain a special character"
        return True, ""

    @staticmethod
    def validate_username(username: str | None) -> tuple[bool, str]:
        """Validate username format.

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not username:
            return True, ""
        if len(username) < 3:
            return False, "Username must be at least 3 characters long"
        if len(username) > 50:
            return False, "Username must be at most 50 characters long"
        if not re.match(r"^[a-zA-Z0-9_-]+$", username):
            return False, "Username can only contain letters, numbers, underscores, and hyphens"
        return True, ""

    async def register(
        self,
        email: str,
        password: str,
        username: str | None = None,
    ) -> User:
        """Register a new user.

        Args:
            email: User's email address
            password: User's password
            username: Optional username

        Returns:
            The newly created user

        Raises:
            AuthError: If registration fails
        """
        # Validate password
        is_valid, error_msg = self.validate_password_strength(password)
        if not is_valid:
            raise AuthError(error_msg, "weak_password")

        # Validate username
        if username:
            is_valid, error_msg = self.validate_username(username)
            if not is_valid:
                raise AuthError(error_msg, "invalid_username")

        # Check if email already exists
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        if result.scalar_one_or_none():
            raise AuthError("Email already registered", "email_exists")

        # Check if username is taken
        if username:
            result = await self.db.execute(
                select(User).where(User.username == username)
            )
            if result.scalar_one_or_none():
                raise AuthError("Username already taken", "username_exists")

        # Create user
        user = User(
            email=email,
            password_hash=hash_password(password),
            username=username,
            role="user",
            is_active=True,
            is_verified=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def login(
        self,
        email: str,
        password: str,
    ) -> User:
        """Authenticate a user with email and password.

        Args:
            email: User's email address
            password: User's password

        Returns:
            The authenticated user

        Raises:
            AuthError: If login fails
        """
        # Find user by email
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AuthError("Invalid credentials", "invalid_credentials")

        # Check if user is active
        if not user.is_active:
            raise AuthError("Account is deactivated", "account_inactive")

        # Check if user has a password (might be OAuth-only)
        if not user.password_hash:
            raise AuthError("Please use OAuth to login", "oauth_only")

        # Verify password
        if not verify_password(user.password_hash, password):
            raise AuthError("Invalid credentials", "invalid_credentials")

        # Update last login
        user.last_login = datetime.utcnow()
        await self.db.commit()

        return user

    async def verify_email(self, token: str) -> bool:
        """Verify a user's email address.

        Args:
            token: The verification token

        Returns:
            True if verification successful
        """
        # For now, we'll use a simple token hash lookup
        # In production, you might want a separate verification tokens table
        token_hash = hash_token(token)

        # This is a placeholder - implement based on your email verification flow
        # You might want to create a separate email_verification_tokens table
        return True

    async def request_password_reset(self, email: str) -> str | None:
        """Request a password reset for a user.

        Args:
            email: User's email address

        Returns:
            Reset token if user exists, None otherwise
        """
        result = await self.db.execute(
            select(User).where(User.email == email, User.is_active == True)
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Generate reset token
        token = generate_secure_token(32)
        token_hash = hash_token(token)

        # Create reset token record
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            created_at=datetime.utcnow(),
        )

        self.db.add(reset_token)
        await self.db.commit()

        return token

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset a user's password using a reset token.

        Args:
            token: The reset token
            new_password: The new password

        Returns:
            True if password was reset successfully
        """
        from datetime import timedelta

        # Validate password strength
        is_valid, error_msg = self.validate_password_strength(new_password)
        if not is_valid:
            raise AuthError(error_msg, "weak_password")

        token_hash = hash_token(token)

        # Find valid token
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.expires_at > datetime.utcnow(),
                PasswordResetToken.used_at.is_(None),
            )
        )
        reset_token = result.scalar_one_or_none()

        if not reset_token:
            return False

        # Get user
        result = await self.db.execute(
            select(User).where(User.id == reset_token.user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        # Update password
        user.password_hash = hash_password(new_password)
        user.password_changed_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()

        # Mark token as used
        reset_token.used_at = datetime.utcnow()

        await self.db.commit()

        return True

    async def change_password(
        self,
        user_id: uuid.UUID,
        current_password: str,
        new_password: str,
    ) -> bool:
        """Change a user's password.

        Args:
            user_id: The user's ID
            current_password: The current password
            new_password: The new password

        Returns:
            True if password was changed successfully
        """
        # Validate new password
        is_valid, error_msg = self.validate_password_strength(new_password)
        if not is_valid:
            raise AuthError(error_msg, "weak_password")

        # Get user
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user or not user.password_hash:
            return False

        # Verify current password
        if not verify_password(user.password_hash, current_password):
            raise AuthError("Current password is incorrect", "invalid_password")

        # Update password
        user.password_hash = hash_password(new_password)
        user.password_changed_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()

        await self.db.commit()

        return True
