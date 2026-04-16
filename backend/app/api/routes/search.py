"""Semantic search endpoints."""

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import EmbeddingSvc

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    threshold: float = 0.5


class SearchResult(BaseModel):
    chunk_text: str
    chunk_index: int
    slug: str
    title: str | None
    category: str
    similarity: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    count: int


@router.post("", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    embedding_svc: EmbeddingSvc,
) -> SearchResponse:
    """Perform semantic search across all articles.

    Uses vector similarity to find relevant content chunks.
    """
    results = await embedding_svc.search_similar(
        query=request.query,
        limit=request.limit,
        threshold=request.threshold,
    )

    return SearchResponse(
        query=request.query,
        results=[SearchResult(**r) for r in results],
        count=len(results),
    )


@router.get("")
async def quick_search(
    q: str,
    embedding_svc: EmbeddingSvc,
    limit: int = 5,
) -> SearchResponse:
    """Quick search endpoint via GET request."""
    results = await embedding_svc.search_similar(
        query=q,
        limit=limit,
        threshold=0.5,
    )

    return SearchResponse(
        query=q,
        results=[SearchResult(**r) for r in results],
        count=len(results),
    )
