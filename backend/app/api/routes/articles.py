"""Article CRUD endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import ContentSync, CurrentUser, DBSession, EmbeddingSvc, require_roles
from app.models.article import Article
from app.models.user import User

router = APIRouter(prefix="/articles", tags=["articles"])


class ArticleResponse(BaseModel):
    id: str
    slug: str
    category: str
    title: str | None
    description: str | None
    content: str
    metadata: dict[str, Any]
    synced_at: str
    author_id: str | None
    is_published: bool

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    id: str
    slug: str
    category: str
    title: str | None
    description: str | None
    is_published: bool

    class Config:
        from_attributes = True


class SyncResponse(BaseModel):
    status: str
    stats: dict[str, int]


@router.get("", response_model=list[ArticleListResponse])
async def list_articles(
    db: DBSession,
    category: str | None = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    include_unpublished: bool = False,
    current_user: User | None = Depends(require_roles("editor", "admin")),
) -> list[ArticleListResponse]:
    """List all articles, optionally filtered by category.

    Only editors and admins can see unpublished articles.
    """
    query = select(Article)

    if category:
        query = query.where(Article.category == category)

    # Filter unpublished articles for non-editors
    if not current_user or current_user.role == "user":
        query = query.where(Article.is_published == True)
    elif not include_unpublished:
        query = query.where(Article.is_published == True)

    query = query.order_by(Article.slug).limit(limit).offset(offset)
    result = await db.execute(query)
    articles = result.scalars().all()

    return [
        ArticleListResponse(
            id=str(a.id),
            slug=a.slug,
            category=a.category,
            title=a.title,
            description=a.description[:200] + "..." if a.description and len(a.description) > 200 else a.description,
            is_published=a.is_published,
        )
        for a in articles
    ]


@router.get("/{slug}", response_model=ArticleResponse)
async def get_article(
    slug: str,
    db: DBSession,
    current_user: User | None = Depends(require_roles("editor", "admin")),
) -> ArticleResponse:
    """Get a single article by slug.

    Only editors and admins can see unpublished articles.
    """
    result = await db.execute(select(Article).where(Article.slug == slug))
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Check if user can view unpublished articles
    if not article.is_published:
        if not current_user or current_user.role not in ("editor", "admin"):
            raise HTTPException(status_code=404, detail="Article not found")

    return ArticleResponse(
        id=str(article.id),
        slug=article.slug,
        category=article.category,
        title=article.title,
        description=article.description,
        content=article.content,
        metadata=article.frontmatter or {},
        synced_at=article.synced_at.isoformat() if article.synced_at else "",
        author_id=str(article.author_id) if article.author_id else None,
        is_published=article.is_published,
    )


@router.post("/sync", response_model=SyncResponse)
async def sync_content(
    sync: ContentSync,
    embedding_svc: EmbeddingSvc,
    current_user: User = Depends(require_roles("editor", "admin")),
    generate_embeddings: bool = True,
) -> SyncResponse:
    """Sync content from git submodule to database.

    Requires editor or admin role.
    Optionally generate embeddings for semantic search.
    """
    # Sync content
    stats = await sync.sync_all()

    # Generate embeddings if requested
    if generate_embeddings:
        emb_stats = await embedding_svc.generate_for_all_articles()
        stats["embeddings"] = emb_stats["embeddings"]

    return SyncResponse(status="success", stats=stats)


@router.post("/embeddings/generate", response_model=SyncResponse)
async def generate_embeddings(
    embedding_svc: EmbeddingSvc,
    current_user: User = Depends(require_roles("editor", "admin")),
    slug: str | None = None,
) -> SyncResponse:
    """Generate embeddings for articles.

    Requires editor or admin role.
    If slug is provided, only generate for that article.
    Otherwise, generate for all articles.
    """
    if slug:
        # TODO: Implement single article embedding
        raise HTTPException(status_code=501, detail="Single article embedding not yet implemented")

    stats = await embedding_svc.generate_for_all_articles()
    return SyncResponse(status="success", stats=stats)
