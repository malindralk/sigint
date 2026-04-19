"""Authentication API routes."""

import logging
import uuid
from typing import Any

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    AuthSvc,
    CurrentUser,
    EmailSvc,
    OAuthSvc,
    SessionSvc,
    get_current_active_user,
    get_db,
)
from app.core.config import get_settings
from app.core.rate_limit import get_rate_limit_dependency
from app.models.session import Session
from app.models.user import User
from app.services.auth import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


# Request/Response schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=128)
    username: str | None = Field(None, min_length=3, max_length=50)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=12, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict[str, Any]


class UserResponse(BaseModel):
    id: str
    email: str | None
    username: str | None
    role: str
    avatar_url: str | None
    is_verified: bool
    created_at: str
    oauth_connections: list[dict[str, Any]]


class SessionResponse(BaseModel):
    id: str
    ip_address: str | None
    user_agent: str | None
    created_at: str
    last_activity: str
    is_current: bool


# Cookie settings
def get_refresh_cookie_settings():
    settings = get_settings()
    return {
        "key": "refresh_token",
        "httponly": True,
        "secure": settings.is_production,
        "samesite": "lax",
        "path": "/",  # Critical: without this, cookie path defaults to the request path
        "max_age": 7 * 24 * 60 * 60,  # 7 days
    }


@router.get("/verify")
async def verify_session(
    session_service: SessionSvc,
    refresh_token: str | None = Cookie(None),
):
    """Verify session via refresh token cookie. Used by Nginx auth_request."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session",
        )
    user = await session_service.validate_refresh_token_session(refresh_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    return Response(status_code=200)


@router.post(
    "/register",
    response_model=dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: RegisterRequest,
    response: Response,
    auth_service: AuthSvc,
    email_service: EmailSvc,
    rate_limit: None = Depends(get_rate_limit_dependency("auth")),
):
    """Register a new user."""
    try:
        user = await auth_service.register(
            email=request.email,
            password=request.password,
            username=request.username,
        )

        # TODO: Generate and send verification email
        # For now, auto-verify in development
        settings = get_settings()
        if settings.is_development:
            user.is_verified = True
            await auth_service.db.commit()

        return {
            "message": "Registration successful. Please check your email to verify your account.",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
            },
        }
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    request: LoginRequest,
    response: Response,
    http_request: Request,
    auth_service: AuthSvc,
    session_service: SessionSvc,
    rate_limit: None = Depends(get_rate_limit_dependency("auth")),
):
    """Login with email and password."""
    try:
        user = await auth_service.login(
            email=request.email,
            password=request.password,
        )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in",
            )

        # Get client info
        ip_address = http_request.client.host if http_request.client else None
        user_agent = http_request.headers.get("user-agent")

        # Create session
        session_data = await session_service.create_session(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Set refresh token cookie
        cookie_settings = get_refresh_cookie_settings()
        response.set_cookie(
            value=session_data["refresh_token"],
            **cookie_settings,
        )

        return {
            "access_token": session_data["access_token"],
            "token_type": "bearer",
            "expires_in": session_data["expires_in"],
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "avatar_url": user.avatar_url,
            },
        }
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
        )


@router.post("/logout")
async def logout(
    response: Response,
    current_user: CurrentUser,
    session_service: SessionSvc,
    refresh_token: str | None = Cookie(None),
):
    """Logout and invalidate session."""
    # Clear refresh token cookie (must match path used when setting)
    response.delete_cookie(key="refresh_token", path="/")

    # If we have a refresh token, invalidate the session
    if refresh_token:
        # Find session by refresh token
        from app.core.security import hash_token

        token_hash = hash_token(refresh_token)
        result = await session_service.db.execute(
            select(Session).where(Session.refresh_token_hash == token_hash)
        )
        session = result.scalar_one_or_none()

        if session:
            await session_service.invalidate_session(session.id)

    return {"message": "Logged out successfully"}


@router.post(
    "/refresh",
    response_model=dict[str, Any],
)
async def refresh_token(
    response: Response,
    session_service: SessionSvc,
    refresh_token: str | None = Cookie(None),
):
    """Refresh access token using refresh token cookie."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )

    # Refresh session
    new_tokens = await session_service.refresh_session(refresh_token)

    if not new_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Set new refresh token cookie
    cookie_settings = get_refresh_cookie_settings()
    response.set_cookie(
        value=new_tokens["refresh_token"],
        **cookie_settings,
    )

    return {
        "access_token": new_tokens["access_token"],
        "token_type": "bearer",
        "expires_in": new_tokens["expires_in"],
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    """Get current user information."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "oauth_connections": [
            {
                "provider": conn.provider,
                "provider_email": conn.provider_email,
            }
            for conn in current_user.oauth_connections
        ],
    }


@router.post("/password/reset-request")
async def request_password_reset(
    request: PasswordResetRequest,
    auth_service: AuthSvc,
    email_service: EmailSvc,
    rate_limit: None = Depends(get_rate_limit_dependency("auth")),
):
    """Request a password reset email."""
    token = await auth_service.request_password_reset(request.email)

    if token:
        # Send email (don't await to avoid timing attacks)
        await email_service.send_password_reset_email(request.email, token)

    # Always return success to prevent email enumeration
    return {
        "message": "If the email exists, a reset link has been sent.",
    }


@router.post("/password/reset")
async def reset_password(
    request: PasswordResetConfirm,
    auth_service: AuthSvc,
    session_service: SessionSvc,
):
    """Reset password using reset token."""
    try:
        success = await auth_service.reset_password(
            token=request.token,
            new_password=request.new_password,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        # Invalidate all sessions for the user
        # We need to find the user first
        # This is a simplified version - in production, you might want to
        # store user_id in the token or lookup via token hash

        return {
            "message": "Password reset successful. Please login with your new password.",
        }
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    current_user: CurrentUser,
    session_service: SessionSvc,
    refresh_token: str | None = Cookie(None),
):
    """List all active sessions for current user."""
    sessions = await session_service.get_active_sessions(current_user.id)

    # Get current session hash
    current_session_hash = None
    if refresh_token:
        from app.core.security import hash_token

        current_session_hash = hash_token(refresh_token)

    return [
        {
            "id": str(session.id),
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "last_activity": session.last_activity.isoformat() if session.last_activity else None,
            "is_current": session.refresh_token_hash == current_session_hash,
        }
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
async def invalidate_session(
    session_id: str,
    current_user: CurrentUser,
    session_service: SessionSvc,
    refresh_token: str | None = Cookie(None),
):
    """Invalidate a specific session."""
    # Get current session hash
    current_session_hash = None
    if refresh_token:
        from app.core.security import hash_token

        current_session_hash = hash_token(refresh_token)

    # Find the session
    result = await session_service.db.execute(
        select(Session).where(
            Session.id == uuid.UUID(session_id),
            Session.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Prevent invalidating current session
    if session.refresh_token_hash == current_session_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot invalidate current session. Use logout instead.",
        )

    success = await session_service.invalidate_session(session.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invalidate session",
        )

    return {"message": "Session invalidated"}


# OAuth routes
@router.get("/oauth/{provider}")
async def oauth_login(
    provider: str,
    request: Request,
    oauth_service: OAuthSvc,
    redirect: str = "/",
):
    """Initiate OAuth login flow."""
    settings = get_settings()
    redirect_uri = f"{settings.frontend_url}/api/auth/oauth/{provider}/callback"

    auth_url, state = oauth_service.get_oauth_url(provider, redirect_uri)

    # Store state in Redis
    if oauth_service.redis:
        await oauth_service.redis.setex(
            f"oauth_state:{state}",
            600,  # 10 minutes
            redirect,
        )

    return RedirectResponse(auth_url)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
    response: Response,
    code: str,
    state: str,
    oauth_service: OAuthSvc,
    session_service: SessionSvc,
):
    """Handle OAuth callback."""
    settings = get_settings()

    # Verify state
    if oauth_service.redis:
        stored_redirect = await oauth_service.redis.get(f"oauth_state:{state}")
        if not stored_redirect:
            return RedirectResponse(
                f"{settings.frontend_url}/callback?error=invalid_state"
            )
        redirect_path = stored_redirect if isinstance(stored_redirect, str) else stored_redirect.decode()
        await oauth_service.redis.delete(f"oauth_state:{state}")
    else:
        redirect_path = "/"

    try:
        # Exchange code for token
        redirect_uri = f"{settings.frontend_url}/api/auth/oauth/{provider}/callback"
        token_data = await oauth_service.exchange_code(provider, code, redirect_uri)
        access_token = token_data.get("access_token")

        if not access_token:
            return RedirectResponse(
                f"{settings.frontend_url}/callback?error=token_exchange_failed"
            )

        # Get user info
        user_info = await oauth_service.get_user_info(provider, access_token)

        # Find or create user
        user = await oauth_service.find_or_create_user(
            provider=provider,
            provider_user_id=str(user_info.get("id")),
            email=user_info.get("email"),
            name=user_info.get("name") or user_info.get("login"),
            avatar_url=user_info.get("avatar_url") or user_info.get("picture"),
        )

        # Create session
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        session_data = await session_service.create_session(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Set refresh token cookie and redirect
        cookie_settings = get_refresh_cookie_settings()
        from urllib.parse import urlencode
        callback_params = {"success": "true"}
        if redirect_path and redirect_path != "/":
            callback_params["redirect"] = redirect_path
        response = RedirectResponse(
            f"{settings.frontend_url}/callback?{urlencode(callback_params)}"
        )
        response.set_cookie(
            value=session_data["refresh_token"],
            **cookie_settings,
        )

        return response

    except Exception as e:
        logger.exception("OAuth callback failed for provider=%s: %s", provider, e)
        return RedirectResponse(
            f"{settings.frontend_url}/callback?error={str(e)}"
        )


@router.delete("/oauth/{provider}")
async def disconnect_oauth(
    provider: str,
    current_user: CurrentUser,
    oauth_service: OAuthSvc,
):
    """Disconnect an OAuth provider from the current user."""
    try:
        success = await oauth_service.disconnect_oauth(current_user.id, provider)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="OAuth connection not found",
            )

        return {"message": f"{provider} disconnected successfully"}
    except Exception as e:
        if "last_auth_method" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot disconnect: no other authentication method available",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
