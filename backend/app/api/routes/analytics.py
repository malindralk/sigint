"""
FastAPI analytics proxy — receives events batched from frontend.
MALINDRA PHASE 3

POST /api/analytics/event — receive analytics events from frontend proxy
GET  /api/analytics/summary — summary stats (dev only)

Stores to SQLite via JSON logs. Wire to ClickHouse/PostHog in production.
"""

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)

ANALYTICS_LOG = Path("data/analytics/events.jsonl")
ANALYTICS_LOG.parent.mkdir(parents=True, exist_ok=True)

MAX_EVENTS_PER_BATCH = 50
MAX_PROP_LEN = 200


class AnalyticsEventPayload(BaseModel):
    name: str
    url: str
    referrer: Optional[str] = None
    props: Optional[dict[str, Any]] = None
    timestamp: Optional[int] = None


class AnalyticsBatch(BaseModel):
    events: list[AnalyticsEventPayload]


def _sanitize_url(url: str) -> str:
    # Only keep path — strip query params with PII
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.path[:200]
    except Exception:
        return url[:200]


def _sanitize_props(props: dict | None) -> dict:
    if not props:
        return {}
    return {
        str(k)[:50]: str(v)[:MAX_PROP_LEN]
        for k, v in list(props.items())[:20]
    }


@router.post("/event")
async def receive_events(batch: AnalyticsBatch, request: Request) -> dict[str, Any]:
    """Receive batched analytics events from frontend proxy."""
    events = batch.events[:MAX_EVENTS_PER_BATCH]
    received_at = datetime.now(timezone.utc).isoformat()
    country = request.headers.get("CF-IPCountry", "XX")  # Cloudflare header

    with ANALYTICS_LOG.open("a", encoding="utf-8") as f:
        for event in events:
            record = {
                "name": re.sub(r'[^a-z0-9_\-\.]', '', event.name.lower())[:50],
                "url": _sanitize_url(event.url),
                "referrer": _sanitize_url(event.referrer or ""),
                "props": _sanitize_props(event.props),
                "country": country,
                "receivedAt": received_at,
                "clientTimestamp": event.timestamp,
            }
            f.write(json.dumps(record) + "\n")

    return {"status": "received", "count": len(events)}


@router.get("/summary")
async def analytics_summary() -> dict[str, Any]:
    """Basic event summary — dev use only."""
    if not ANALYTICS_LOG.exists():
        return {"total": 0, "pageviews": 0, "events": {}}

    total = 0
    pageviews = 0
    event_counts: dict[str, int] = {}

    with ANALYTICS_LOG.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                total += 1
                name = record.get("name", "unknown")
                if name == "pageview":
                    pageviews += 1
                event_counts[name] = event_counts.get(name, 0) + 1
            except Exception:
                pass

    return {
        "total": total,
        "pageviews": pageviews,
        "events": event_counts,
    }
