"""Rate limiting middleware and utilities."""

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

# Rate limits by endpoint type (requests, window_seconds)
RATE_LIMITS = {
    "auth": {"requests": 5, "window": 60},      # 5 req/min for auth
    "api": {"requests": 100, "window": 60},     # 100 req/min for API
    "search": {"requests": 30, "window": 60},   # 30 req/min for search
}


async def get_redis_client(request: Request):
    """Get Redis client from app state."""
    return request.app.state.redis


async def rate_limit(request: Request, endpoint_type: str = "api") -> None:
    """Apply rate limiting to a request.

    Args:
        request: The incoming request
        endpoint_type: Type of endpoint (auth, api, search)

    Raises:
        HTTPException: If rate limit is exceeded
    """
    redis_client = await get_redis_client(request)
    if not redis_client:
        # Redis not available, skip rate limiting
        return

    # Get client IP - trust X-Real-IP set by Nginx, never trust X-Forwarded-For
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        ip = real_ip.strip()
    else:
        ip = request.client.host if request.client else "unknown"

    key = f"ratelimit:{ip}:{endpoint_type}"

    try:
        # Increment counter
        current = await redis_client.incr(key)

        # Set expiry on first request
        if current == 1:
            await redis_client.expire(key, RATE_LIMITS[endpoint_type]["window"])

        # Check limit
        if current > RATE_LIMITS[endpoint_type]["requests"]:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception:
        # Redis error, skip rate limiting
        pass


class RateLimitMiddleware:
    """Middleware to apply rate limiting based on path."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        path = request.url.path

        # Determine rate limit type based on path
        endpoint_type = "api"
        if "/auth/" in path:
            endpoint_type = "auth"
        elif "/search" in path:
            endpoint_type = "search"

        try:
            await rate_limit(request, endpoint_type)
            await self.app(scope, receive, send)
        except HTTPException as e:
            response = JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail},
            )
            await response(scope, receive, send)


def get_rate_limit_dependency(endpoint_type: str = "api"):
    """Create a dependency for rate limiting.

    Usage:
        @router.post("/login")
        async def login(request: Request, _=Depends(get_rate_limit_dependency("auth"))):
            ...
    """
    async def _rate_limit(request: Request):
        await rate_limit(request, endpoint_type)
    return _rate_limit
