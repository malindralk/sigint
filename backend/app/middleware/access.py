# MALINDRA PHASE 5
# backend/app/middleware/access.py
# Tiered access control middleware.
# Maps X-Access-Token → subscription tier → content gate enforcement.

from __future__ import annotations

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

ROOT = Path(__file__).parent.parent.parent.parent.parent
SUB_DIR = ROOT / "data" / "subscriptions"
AUDIT_DIR = ROOT / "data" / "audit"
AUDIT_DIR.mkdir(parents=True, exist_ok=True)
ACCESS_LOG = AUDIT_DIR / "tier_access.log"

# Routes gated by tier requirement
TIER_GATES: dict[str, str] = {
    "/api/ai/predict": "signal",
    "/api/ai/regenerate": "sovereign",
    "/api/connectors/sync": "sovereign",
    "/api/connectors/multilateral": "sovereign",
    "/api/enterprise/export": "enterprise",
    "/api/subscriptions/stats": "enterprise",
}

# Tier hierarchy for comparison
TIER_ORDER = ["free", "signal", "sovereign", "enterprise"]

# Token bucket per access token hash (rate limit)
_BUCKETS: dict[str, dict] = defaultdict(lambda: {"tokens": 30.0, "last": time.monotonic()})
_BUCKET_CAPACITY = 30.0
_BUCKET_RATE = 2.0  # tokens per second


def _tier_rank(tier: str) -> int:
    try:
        return TIER_ORDER.index(tier)
    except ValueError:
        return 0


def _resolve_tier(access_token: str) -> tuple[str, str]:
    """Returns (tier, status) for the given access token."""
    token_hash = hashlib.sha256(access_token.encode()).hexdigest()[:32]
    # Scan subscriptions for matching token
    if not SUB_DIR.exists():
        return "free", "none"
    for sub_file in SUB_DIR.glob("*.json"):
        if sub_file.name == "index.json":
            continue
        try:
            record = json.loads(sub_file.read_text(encoding="utf-8"))
            stored = record.get("access_token", "")
            stored_hash = hashlib.sha256(stored.encode()).hexdigest()[:32]
            if stored_hash == token_hash:
                tier = record.get("tier", "free")
                sub_status = record.get("status", "inactive")
                active = sub_status in ("active", "trialing")
                return (tier if active else "free"), sub_status
        except Exception:
            continue
    return "free", "not_found"


def _check_bucket(token_hash: str) -> bool:
    now = time.monotonic()
    bucket = _BUCKETS[token_hash]
    elapsed = now - bucket["last"]
    bucket["tokens"] = min(_BUCKET_CAPACITY, bucket["tokens"] + elapsed * _BUCKET_RATE)
    bucket["last"] = now
    if bucket["tokens"] >= 1.0:
        bucket["tokens"] -= 1.0
        return True
    return False


def _log(entry: dict) -> None:
    try:
        with ACCESS_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


class TieredAccessMiddleware(BaseHTTPMiddleware):
    """
    Enforce subscription tier gates on protected API paths.
    Reads X-Access-Token header, resolves tier, enforces minimum tier requirement.
    Sets request.state.subscription_tier for downstream handlers.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # Find matching gate (prefix match, longest first)
        required_tier: str | None = None
        for prefix in sorted(TIER_GATES.keys(), key=len, reverse=True):
            if path.startswith(prefix):
                required_tier = TIER_GATES[prefix]
                break

        # No gate → pass through with free tier context
        if required_tier is None:
            request.state.subscription_tier = "free"
            return await call_next(request)

        access_token = request.headers.get("X-Access-Token", "")
        if not access_token:
            return JSONResponse(
                status_code=401,
                content={
                    "detail": "X-Access-Token header required for this endpoint",
                    "required_tier": required_tier,
                    "upgrade_url": "/subscribe",
                },
            )

        tier, sub_status = _resolve_tier(access_token)
        token_hash = hashlib.sha256(access_token.encode()).hexdigest()[:16]

        # Rate limit check
        if not _check_bucket(token_hash):
            _log({
                "ts": datetime.now(timezone.utc).isoformat(),
                "event": "rate_limited",
                "path": path,
                "tier": tier,
                "token_prefix": token_hash[:8],
            })
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded", "retry_after": 1},
                headers={"Retry-After": "1"},
            )

        # Tier check
        if _tier_rank(tier) < _tier_rank(required_tier):
            _log({
                "ts": datetime.now(timezone.utc).isoformat(),
                "event": "tier_denied",
                "path": path,
                "resolved_tier": tier,
                "required_tier": required_tier,
                "token_prefix": token_hash[:8],
            })
            return JSONResponse(
                status_code=403,
                content={
                    "detail": f"This endpoint requires '{required_tier}' tier or higher.",
                    "your_tier": tier,
                    "required_tier": required_tier,
                    "upgrade_url": "/subscribe",
                },
            )

        # Grant access
        request.state.subscription_tier = tier
        request.state.subscription_status = sub_status
        response = await call_next(request)

        _log({
            "ts": datetime.now(timezone.utc).isoformat(),
            "event": "tier_granted",
            "path": path,
            "tier": tier,
            "status_code": response.status_code,
            "token_prefix": token_hash[:8],
        })
        return response
