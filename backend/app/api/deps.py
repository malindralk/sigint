"""API dependencies for dependency injection."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.services.auth import AuthService
from app.services.content_sync import ContentSyncService
from app.services.email import EmailService
from app.services.embedding import EmbeddingService
from app.services.oauth import OAuthService
from app.services.session import SessionService

# Security scheme for JWT tokens
security = HTTPBearer(auto_error=False)

# Database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db)]


def get_content_sync(db: DBSession) -> ContentSyncService:
    """Get content sync service instance."""
    return ContentSyncService(db)


def get_embedding_service(db: DBSession) -> EmbeddingService:
    """Get embedding service instance."""
    return EmbeddingService(db)


def get_auth_service(db: DBSession) -> AuthService:
    """Get auth service instance."""
    return AuthService(db)


def get_session_service(db: DBSession, request: Request) -> SessionService:
    """Get session service instance."""
    redis_client = getattr(request.app.state, "redis", None)
    return SessionService(db, redis_client)


def get_oauth_service(db: DBSession, request: Request) -> OAuthService:
    """Get OAuth service instance."""
    redis_client = getattr(request.app.state, "redis", None)
    return OAuthService(db, redis_client)


def get_email_service() -> EmailService:
    """Get email service instance."""
    return EmailService()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token.

    Args:
        request: FastAPI request
        credentials: HTTP Authorization credentials
        db: Database session

    Returns:
        The authenticated user

    Raises:
        HTTPException: If authentication fails
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    redis_client = getattr(request.app.state, "redis", None)
    session_service = SessionService(db, redis_client)

    user = await session_service.validate_session(token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Get the current authenticated user if available, else None.

    Args:
        request: FastAPI request
        credentials: HTTP Authorization credentials
        db: Database session

    Returns:
        The authenticated user or None if not authenticated
    """
    if not credentials:
        return None

    token = credentials.credentials
    redis_client = getattr(request.app.state, "redis", None)
    session_service = SessionService(db, redis_client)

    user = await session_service.validate_session(token)
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active user.

    Args:
        current_user: The current authenticated user

    Returns:
        The active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return current_user


def require_roles(*roles: str):
    """Create a dependency that requires specific roles.

    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(
            user: User = Depends(require_roles("admin")),
        ):
            ...
    """
    async def _check_role(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return _check_role


def require_admin():
    """Require admin role."""
    return require_roles("admin")


def require_editor():
    """Require editor or admin role."""
    return require_roles("editor", "admin")


# Annotated dependencies
ContentSync = Annotated[ContentSyncService, Depends(get_content_sync)]
EmbeddingSvc = Annotated[EmbeddingService, Depends(get_embedding_service)]
AuthSvc = Annotated[AuthService, Depends(get_auth_service)]
SessionSvc = Annotated[SessionService, Depends(get_session_service)]
OAuthSvc = Annotated[OAuthService, Depends(get_oauth_service)]
EmailSvc = Annotated[EmailService, Depends(get_email_service)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]
CurrentUserOptional = Annotated[User | None, Depends(get_current_user_optional)]
