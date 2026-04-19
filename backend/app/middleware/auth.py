# MALINDRA PHASE 4
# backend/app/middleware/auth.py
# API key authentication + Token Bucket rate limiting middleware.
# Validates X-API-Key header.
# Logs access to ./data/audit/access.log (JSONL).

import hashlib
import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

ROOT = Path(__file__).parent.parent.parent.parent
ENTERPRISE_DIR = ROOT / "data" / "enterprise"
AUDIT_DIR = ROOT / "data" / "audit"
AUDIT_DIR.mkdir(parents=True, exist_ok=True)
ACCESS_LOG = AUDIT_DIR / "access.log"

# Routes that require API key auth (prefix-matched)
PROTECTED_PREFIXES = [
    "/api/enterprise/export",
    "/api/enterprise/usage",
]

# Routes exempt from all auth checks
EXEMPT_PREFIXES = [
    "/api/enterprise/keys",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
]

# Token Bucket parameters
BUCKET_CAPACITY = 100       # max burst
BUCKET_REFILL_RATE = 10     # tokens per second
_buckets: dict[str, dict] = defaultdict(lambda: {"tokens": BUCKET_CAPACITY, "last_refill": time.time()})


def _key_hash(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def _load_keys() -> dict[str, dict]:
    keys_file = ENTERPRISE_DIR / "api_keys.json"
    if keys_file.exists():
        try:
            return json.loads(keys_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _check_rate_limit(key_hash: str) -> bool:
    """Token bucket check. Returns True if request is allowed."""
    now = time.time()
    bucket = _buckets[key_hash]
    elapsed = now - bucket["last_refill"]
    refill = elapsed * BUCKET_REFILL_RATE
    bucket["tokens"] = min(BUCKET_CAPACITY, bucket["tokens"] + refill)
    bucket["last_refill"] = now
    if bucket["tokens"] >= 1:
        bucket["tokens"] -= 1
        return True
    return False


def _log_access(
    key_id: str,
    path: str,
    method: str,
    status: int,
    ip_hash: str,
) -> None:
    entry = json.dumps({
        "ts": datetime.now(timezone.utc).isoformat(),
        "key_id": key_id,
        "path": path,
        "method": method,
        "status": status,
        "ip_hash": ip_hash,
    }, ensure_ascii=False)
    try:
        with ACCESS_LOG.open("a", encoding="utf-8") as f:
            f.write(entry + "\n")
    except Exception:
        pass


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """Validate X-API-Key on protected routes + Token Bucket rate limiting."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # Pass through exempt routes immediately
        if any(path.startswith(p) for p in EXEMPT_PREFIXES):
            return await call_next(request)

        # Only enforce on protected prefixes
        if not any(path.startswith(p) for p in PROTECTED_PREFIXES):
            return await call_next(request)

        api_key = request.headers.get("X-API-Key", "")
        if not api_key:
            return JSONResponse(
                status_code=401,
                content={"detail": "X-API-Key header required"},
            )

        key_hash = _key_hash(api_key)
        keys = _load_keys()

        if key_hash not in keys:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid API key"},
            )

        key_meta = keys[key_hash]
        if not key_meta.get("active", True):
            return JSONResponse(
                status_code=403,
                content={"detail": "API key is disabled"},
            )

        # Rate limiting
        if not _check_rate_limit(key_hash):
            ip = request.client.host if request.client else "unknown"
            ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:12]
            _log_access(key_meta.get("key_id", "?"), path, request.method, 429, ip_hash)
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please wait before retrying."},
                headers={"Retry-After": "1"},
            )

        # Attach key metadata to request state for downstream use
        request.state.enterprise_key = key_meta

        response = await call_next(request)

        # Audit log
        ip = request.client.host if request.client else "unknown"
        ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:12]
        _log_access(key_meta.get("key_id", "?"), path, request.method, response.status_code, ip_hash)

        return response
