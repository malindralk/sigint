"""Main FastAPI application."""

import logging
import logging.handlers
import os
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import api_router
from app.core.config import get_settings
from app.core.database import init_db
from app.middleware.auth import APIKeyAuthMiddleware
from app.middleware.compliance import ComplianceMiddleware

settings = get_settings()

# --- Logging with file rotation (10 x 50MB = 500MB max) ---
_log_fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
_log_level = logging.DEBUG if settings.debug else logging.INFO

root_logger = logging.getLogger()
root_logger.setLevel(_log_level)

# Console handler (keep existing behaviour)
_console = logging.StreamHandler()
_console.setLevel(_log_level)
_console.setFormatter(logging.Formatter(_log_fmt))
root_logger.addHandler(_console)

# File handler with rotation — writes to /app/logs inside Docker
_log_dir = os.environ.get("LOG_DIR", "/app/logs")
os.makedirs(_log_dir, exist_ok=True)
_file_handler = logging.handlers.RotatingFileHandler(
    filename=os.path.join(_log_dir, "backend.log"),
    maxBytes=50 * 1024 * 1024,   # 50 MB per file
    backupCount=9,                # 9 backups + 1 active = 10 files = 500 MB max
    encoding="utf-8",
)
_file_handler.setLevel(_log_level)
_file_handler.setFormatter(logging.Formatter(_log_fmt))
root_logger.addHandler(_file_handler)
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


# Request logging + error handling middleware
@app.middleware("http")
async def request_logging_and_error_handling(request: Request, call_next):
    """Log every HTTP request and handle exceptions."""
    import time

    start = time.perf_counter()
    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s %s %.1fms",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.exception(
            "%s %s 500 %.1fms - Unhandled exception: %s",
            request.method,
            request.url.path,
            elapsed_ms,
            e,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )


# Include API routes
app.include_router(api_router, prefix="/api")

# Phase 4: Enterprise auth + compliance middleware (added AFTER route registration)
app.add_middleware(APIKeyAuthMiddleware)
app.add_middleware(ComplianceMiddleware)


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
