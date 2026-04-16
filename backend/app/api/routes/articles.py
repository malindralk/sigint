"""Article CRUD endpoints."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import ContentSync, DBSession, EmbeddingSvc
from app.models.article import Article
from sqlalchemy import select

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

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    id: str
    slug: str
    category: str
    title: str | None
    description: str | None

    class Config:
        from_attributes = True


class SyncResponse(BaseModel):
    status: str
    stats: dict[str, int]


@router.get("", response_model=list[ArticleListResponse])
async def list_articles(
    db: DBSession,
    category: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[ArticleListResponse]:
    """List all articles, optionally filtered by category."""
    query = select(Article)

    if category:
        query = query.where(Article.category == category)

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
        )
        for a in articles
    ]


@router.get("/{slug}", response_model=ArticleResponse)
async def get_article(slug: str, db: DBSession) -> ArticleResponse:
    """Get a single article by slug."""
    result = await db.execute(select(Article).where(Article.slug == slug))
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return ArticleResponse(
        id=str(article.id),
        slug=article.slug,
        category=article.category,
        title=article.title,
        description=article.description,
        content=article.content,
        metadata=article.metadata or {},
        synced_at=article.synced_at.isoformat(),
    )


@router.post("/sync", response_model=SyncResponse)
async def sync_content(
    sync: ContentSync,
    embedding_svc: EmbeddingSvc,
    generate_embeddings: bool = True,
) -> SyncResponse:
    """Sync content from git submodule to database.

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
    slug: str | None = None,
) -> SyncResponse:
    """Generate embeddings for articles.

    If slug is provided, only generate for that article.
    Otherwise, generate for all articles.
    """
    if slug:
        # TODO: Implement single article embedding
        raise HTTPException(status_code=501, detail="Single article embedding not yet implemented")

    stats = await embedding_svc.generate_for_all_articles()
    return SyncResponse(status="success", stats=stats)
