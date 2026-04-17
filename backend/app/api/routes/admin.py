"""Admin API routes."""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db, require_roles
from app.models.article import Article
from app.models.settings import SiteSettings
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


# Request/Response schemas
class UserUpdateRequest(BaseModel):
    role: str | None = None
    is_active: bool | None = None


class ArticleCreateRequest(BaseModel):
    slug: str
    category: str
    title: str
    description: str | None = None
    content: str
    frontmatter: dict = {}
    is_published: bool = True


class ArticleUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    content: str | None = None
    frontmatter: dict | None = None
    is_published: bool | None = None


class SettingsUpdateRequest(BaseModel):
    settings: dict[str, Any]


def require_admin():
    """Require admin role."""
    return require_roles("admin")


def require_editor():
    """Require editor or admin role."""
    return require_roles("editor", "admin")


# User management routes
@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: str | None = None,
    search: str | None = None,
):
    """List all users with pagination and filters."""
    query = select(User)

    # Apply filters
    if role:
        query = query.where(User.role == role)

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (User.email.ilike(search_filter)) |
            (User.username.ilike(search_filter))
        )

    # Get total count
    count_result = await db.execute(select(User).where())
    total = len(count_result.scalars().all())

    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
            }
            for user in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    """Get detailed information about a user."""
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Count sessions
    from app.models.session import Session
    session_result = await db.execute(
        select(Session).where(Session.user_id == user.id)
    )
    session_count = len(session_result.scalars().all())

    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "session_count": session_count,
        "oauth_connections": [
            {
                "provider": conn.provider,
                "provider_email": conn.provider_email,
            }
            for conn in user.oauth_connections
        ],
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    """Update a user's role or status."""
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent self-demotion if last admin
    if user.id == current_user.id and request.role and request.role != "admin":
        # Check if this is the last admin
        admin_result = await db.execute(
            select(User).where(User.role == "admin", User.is_active == True)
        )
        admins = admin_result.scalars().all()
        if len(admins) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last admin",
            )

    # Update fields
    if request.role is not None:
        if request.role not in ("user", "editor", "admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role",
            )
        user.role = request.role

    if request.is_active is not None:
        # Prevent deactivating yourself
        if user.id == current_user.id and not request.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account",
            )
        user.is_active = request.is_active

    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    """Soft delete a user (deactivate)."""
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    # Soft delete
    user.is_active = False
    user.updated_at = datetime.utcnow()

    # Invalidate all sessions
    from app.models.session import Session
    await db.execute(
        select(Session).where(Session.user_id == user.id)
    )

    await db.commit()

    return {"message": "User deactivated"}


# Article management routes
@router.post("/articles", status_code=status.HTTP_201_CREATED)
async def create_article(
    request: ArticleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_editor()),
):
    """Create a new article."""
    # Check if slug already exists
    result = await db.execute(
        select(Article).where(Article.slug == request.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Article with this slug already exists",
        )

    article = Article(
        slug=request.slug,
        category=request.category,
        title=request.title,
        description=request.description,
        content=request.content,
        frontmatter=request.frontmatter,
        author_id=current_user.id,
        is_published=request.is_published,
        published_at=datetime.utcnow() if request.is_published else None,
        created_at=datetime.utcnow(),
        synced_at=datetime.utcnow(),
    )

    db.add(article)
    await db.commit()
    await db.refresh(article)

    return {
        "id": str(article.id),
        "slug": article.slug,
        "category": article.category,
        "title": article.title,
        "author_id": str(article.author_id) if article.author_id else None,
        "created_at": article.created_at.isoformat() if article.created_at else None,
    }


@router.patch("/articles/{article_id}")
async def update_article(
    article_id: str,
    request: ArticleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_editor()),
):
    """Update an existing article."""
    result = await db.execute(
        select(Article).where(Article.id == uuid.UUID(article_id))
    )
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    # Check permissions - editors can only edit their own articles
    # admins can edit any article
    if current_user.role != "admin" and article.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own articles",
        )

    # Update fields
    if request.title is not None:
        article.title = request.title
    if request.description is not None:
        article.description = request.description
    if request.content is not None:
        article.content = request.content
    if request.frontmatter is not None:
        article.frontmatter = request.frontmatter
    if request.is_published is not None:
        article.is_published = request.is_published
        if request.is_published and not article.published_at:
            article.published_at = datetime.utcnow()

    article.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(article)

    return {
        "id": str(article.id),
        "slug": article.slug,
        "title": article.title,
        "updated_at": article.updated_at.isoformat() if article.updated_at else None,
    }


@router.delete("/articles/{article_id}")
async def delete_article(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_editor()),
):
    """Delete an article."""
    result = await db.execute(
        select(Article).where(Article.id == uuid.UUID(article_id))
    )
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    # Check permissions
    if current_user.role != "admin" and article.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own articles",
        )

    await db.delete(article)
    await db.commit()

    return {"message": "Article deleted"}


# Settings routes
@router.get("/settings")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    """Get all site settings."""
    result = await db.execute(select(SiteSettings))
    settings = result.scalars().all()

    return {
        "settings": {
            setting.key: setting.value
            for setting in settings
        },
    }


@router.patch("/settings")
async def update_settings(
    request: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    """Update site settings."""
    for key, value in request.settings.items():
        result = await db.execute(
            select(SiteSettings).where(SiteSettings.key == key)
        )
        setting = result.scalar_one_or_none()

        if setting:
            setting.value = str(value)
            setting.updated_at = datetime.utcnow()
            setting.updated_by = current_user.id
        else:
            # Create new setting
            setting = SiteSettings(
                key=key,
                value=str(value),
                updated_at=datetime.utcnow(),
                updated_by=current_user.id,
            )
            db.add(setting)

    await db.commit()

    # Return updated settings
    result = await db.execute(select(SiteSettings))
    settings = result.scalars().all()

    return {
        "message": "Settings updated",
        "settings": {
            setting.key: setting.value
            for setting in settings
        },
    }
