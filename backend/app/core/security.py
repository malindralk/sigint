"""Security utilities for password hashing and JWT tokens."""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt

from app.core.config import get_settings

# Argon2id configuration
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

# Token expiration settings
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    """Hash a password using Argon2id."""
    return ph.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Verify a password against its hash."""
    try:
        ph.verify(password_hash, password)
        return True
    except VerifyMismatchError:
        return False


def hash_token(token: str) -> str:
    """Hash a token for storage using SHA-256."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)


def create_access_token(user_id: uuid.UUID, role: str) -> tuple[str, datetime]:
    """Create a JWT access token.

    Returns:
        Tuple of (token, expiration_datetime)
    """
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": secrets.token_hex(16),
        "type": "access",
    }

    token = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token, expire


def create_refresh_token(user_id: uuid.UUID) -> tuple[str, datetime]:
    """Create a JWT refresh token.

    Returns:
        Tuple of (token, expiration_datetime)
    """
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": secrets.token_hex(16),
        "type": "refresh",
    }

    token = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token, expire


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT token.

    Returns:
        Decoded token payload or None if invalid.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> dict[str, Any] | None:
    """Verify an access token and return its payload.

    Returns:
        Token payload if valid and is an access token, None otherwise.
    """
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None


def verify_refresh_token(token: str) -> dict[str, Any] | None:
    """Verify a refresh token and return its payload.

    Returns:
        Token payload if valid and is a refresh token, None otherwise.
    """
    payload = decode_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None
