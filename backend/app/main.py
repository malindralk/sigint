"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

    # Initialize Redis connection
    try:
        app.state.redis = redis.from_url(settings.redis_url, decode_responses=True)
        await app.state.redis.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        app.state.redis = None

    # Initialize database (create tables if needed for dev)
    if settings.is_development:
        logger.info("Development mode: ensuring database tables exist")
        await init_db()

    yield

    # Cleanup
    if app.state.redis:
        await app.state.redis.close()
        logger.info("Redis connection closed")

    logger.info("Shutting down SIGINT Backend...")


app = FastAPI(
    title="SIGINT Wiki Backend",
    description="Backend service for content sync, embeddings, semantic search, and authentication",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ] if settings.is_development else [
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


# Error handling middleware
@app.middleware("http")
async def error_handling(request: Request, call_next):
    """Handle exceptions and return JSON responses."""
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception("Unhandled exception")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
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
        "version": "0.2.0",
        "docs": "/docs" if settings.is_development else "disabled",
        "features": ["content_sync", "embeddings", "search", "auth", "admin"],
    }
