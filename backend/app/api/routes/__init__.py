"""Routes package initialization."""

from fastapi import APIRouter

from app.api.routes import admin, articles, auth, search

api_router = APIRouter()
api_router.include_router(articles.router)
api_router.include_router(search.router)
api_router.include_router(auth.router)
api_router.include_router(admin.router)

__all__ = ["api_router"]
