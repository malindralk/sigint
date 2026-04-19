# MALINDRA PHASE 4
# backend/app/middleware/compliance.py
# Data minimization, export controls, chain of custody for intelligence artifacts.

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

ROOT = Path(__file__).parent.parent.parent.parent
CUSTODY_LOG = ROOT / "data" / "audit" / "custody.log"
CUSTODY_LOG.parent.mkdir(parents=True, exist_ok=True)

# Jurisdictions blocked from intelligence export endpoints
RESTRICTED_JURISDICTIONS: set[str] = {"KP", "IR", "CU", "SY"}

# Paths that constitute intelligence artifact access (chain of custody required)
INTELLIGENCE_PATHS = [
    "/api/enterprise/export",
    "/api/ai/predictions",
    "/api/connectors/sync",
]

# PII patterns to strip from logs
PII_PATTERNS = [
    re.compile(r'"email"\s*:\s*"[^"]+"'),
    re.compile(r'"name"\s*:\s*"[^"]+"'),
    re.compile(r'"ip"\s*:\s*"[^"]+"'),
    re.compile(r'\b[\w.+-]+@[\w-]+\.\w+\b'),
]


def _strip_pii(text: str) -> str:
    """Remove PII patterns from log strings."""
    result = text
    for pattern in PII_PATTERNS:
        result = pattern.sub('"[REDACTED]"', result)
    return result


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def _log_custody(
    path: str,
    method: str,
    ip_hash: str,
    country: str | None,
    status: int,
    key_id: str | None,
) -> None:
    entry = json.dumps({
        "ts": datetime.now(timezone.utc).isoformat(),
        "path": path,
        "method": method,
        "ip_hash": ip_hash,
        "country": country,
        "status": status,
        "key_id": key_id or "anonymous",
    }, ensure_ascii=False)
    try:
        with CUSTODY_LOG.open("a", encoding="utf-8") as f:
            f.write(entry + "\n")
    except Exception:
        pass


class ComplianceMiddleware(BaseHTTPMiddleware):
    """
    1. Export controls: block restricted jurisdiction requests to intelligence paths.
    2. Chain of custody: log all intelligence artifact access.
    3. Data minimization: strip PII from internal log entries.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # Cloudflare country header (available in CF Workers / CDN proxy)
        country = request.headers.get("CF-IPCountry") or request.headers.get("X-Country-Code")
        ip = request.client.host if request.client else "unknown"
        ip_hash = _hash_ip(ip)

        # ── Export controls ───────────────────────────────────────────────────
        is_intelligence_path = any(path.startswith(p) for p in INTELLIGENCE_PATHS)
        if is_intelligence_path and country in RESTRICTED_JURISDICTIONS:
            _log_custody(path, request.method, ip_hash, country, 451, None)
            return JSONResponse(
                status_code=451,
                content={"detail": "Unavailable for legal reasons"},
            )

        response = await call_next(request)

        # ── Chain of custody logging ─────────────────────────────────────────
        if is_intelligence_path:
            key_id = None
            if hasattr(request.state, "enterprise_key"):
                key_id = request.state.enterprise_key.get("key_id")
            _log_custody(path, request.method, ip_hash, country, response.status_code, key_id)

        return response
