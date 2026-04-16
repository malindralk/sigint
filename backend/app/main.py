"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.database import init_db

settings = get_settings()
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting SIGINT Backend...")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"Content path: {settings.content_path}")

    # Initialize database (create tables if needed for dev)
    if settings.is_development:
        logger.info("Development mode: ensuring database tables exist")
        await init_db()

    yield

    logger.info("Shutting down SIGINT Backend...")


app = FastAPI(
    title="SIGINT Wiki Backend",
    description="Backend service for content sync, embeddings, and semantic search",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.is_development else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.app_env,
        "embedding_model": settings.embedding_model,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "SIGINT Wiki Backend",
        "version": "0.1.0",
        "docs": "/docs" if settings.is_development else "disabled",
    }
