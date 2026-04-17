"""Role-Based Access Control (RBAC) utilities."""

from functools import wraps
from typing import Callable

from fastapi import Depends, HTTPException

from app.api.deps import get_current_user
from app.models.user import User

# Permission definitions
PERMISSIONS = {
    "user": ["article:read"],
    "editor": ["article:read", "article:create", "article:edit", "article:delete"],
    "admin": ["*"],  # All permissions
}


def has_permission(role: str, permission: str) -> bool:
    """Check if a role has a specific permission.

    Args:
        role: The user's role
        permission: The permission to check

    Returns:
        True if the role has the permission
    """
    role_permissions = PERMISSIONS.get(role, [])
    return "*" in role_permissions or permission in role_permissions


def require_role(*roles: str):
    """Decorator to require specific roles for an endpoint.

    Usage:
        @router.get("/admin-only")
        @require_role("admin")
        async def admin_endpoint(user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, user: User = Depends(get_current_user), **kwargs):
            if user.role not in roles:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions",
                )
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator


def require_permission(permission: str):
    """Decorator to require a specific permission for an endpoint.

    Usage:
        @router.post("/articles")
        @require_permission("article:create")
        async def create_article(user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, user: User = Depends(get_current_user), **kwargs):
            if not has_permission(user.role, permission):
                raise HTTPException(
                    status_code=403,
                    detail=f"Missing required permission: {permission}",
                )
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator


class RoleHierarchy:
    """Role hierarchy for permission inheritance."""

    HIERARCHY = {
        "user": 0,
        "editor": 1,
        "admin": 2,
    }

    @classmethod
    def get_level(cls, role: str) -> int:
        """Get the hierarchy level of a role."""
        return cls.HIERARCHY.get(role, 0)

    @classmethod
    def is_at_least(cls, user_role: str, required_role: str) -> bool:
        """Check if a user role is at least the required role level."""
        return cls.get_level(user_role) >= cls.get_level(required_role)


def require_min_role(min_role: str):
    """Require a minimum role level (inclusive).

    Usage:
        @router.get("/editor-stuff")
        @require_min_role("editor")
        async def editor_endpoint(user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, user: User = Depends(get_current_user), **kwargs):
            if not RoleHierarchy.is_at_least(user.role, min_role):
                raise HTTPException(
                    status_code=403,
                    detail=f"This action requires at least {min_role} role",
                )
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator
