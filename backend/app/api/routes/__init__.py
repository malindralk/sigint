"""Routes package initialization."""

from fastapi import APIRouter

from app.api.routes import articles, search

api_router = APIRouter()
api_router.include_router(articles.router)
api_router.include_router(search.router)

__all__ = ["api_router"]
