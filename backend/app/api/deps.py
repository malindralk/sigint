"""API dependencies for dependency injection."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.content_sync import ContentSyncService
from app.services.embedding import EmbeddingService

# Database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db)]


def get_content_sync(db: DBSession) -> ContentSyncService:
    """Get content sync service instance."""
    return ContentSyncService(db)


def get_embedding_service(db: DBSession) -> EmbeddingService:
    """Get embedding service instance."""
    return EmbeddingService(db)


ContentSync = Annotated[ContentSyncService, Depends(get_content_sync)]
EmbeddingSvc = Annotated[EmbeddingService, Depends(get_embedding_service)]
