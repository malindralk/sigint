"""
FastAPI consent audit log route.
MALINDRA PHASE 3

POST /api/consent/log — log GDPR consent decision for audit trail
GET  /api/consent/stats — aggregate counts (admin)
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/consent", tags=["consent"])
logger = logging.getLogger(__name__)

CONSENT_LOG = Path("data/engagement/consent-log.jsonl")
CONSENT_LOG.parent.mkdir(parents=True, exist_ok=True)


class ConsentLogRequest(BaseModel):
    decision: Literal["granted", "declined", "withdrawn"]
    version: str = "v1"
    locale: Optional[str] = "en"
    timestamp: Optional[str] = None


@router.post("/log")
async def log_consent(body: ConsentLogRequest, request: Request) -> dict:
    """Append consent decision to audit log."""
    record = {
        "decision": body.decision,
        "version": body.version,
        "locale": body.locale,
        "userTimestamp": body.timestamp,
        "serverTimestamp": datetime.now(timezone.utc).isoformat(),
        "ip_hash": str(hash(request.client.host))[-6:] if request.client else "anon",
    }

    with CONSENT_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    return {"status": "logged"}


@router.get("/stats")
async def consent_stats() -> dict:
    """Aggregate consent counts."""
    counts: dict[str, int] = {"granted": 0, "declined": 0, "withdrawn": 0}

    if CONSENT_LOG.exists():
        with CONSENT_LOG.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    d = record.get("decision", "")
                    if d in counts:
                        counts[d] += 1
                except Exception:
                    pass

    total = sum(counts.values())
    return {
        "counts": counts,
        "total": total,
        "consentRate": round(counts["granted"] / total * 100, 1) if total > 0 else 0,
    }
