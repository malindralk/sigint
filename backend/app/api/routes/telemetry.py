# MALINDRA PHASE 5
# backend/app/api/routes/telemetry.py
# Privacy-first telemetry: cookieless session IDs, consent-based event logging.
# A/B test variant tracking, funnel analytics, conversion events.

from __future__ import annotations

import hashlib
import json
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

ROOT = Path(__file__).parent.parent.parent.parent.parent
TELEMETRY_DIR = ROOT / "data" / "telemetry"
AB_DIR = ROOT / "data" / "ab-testing"
TELEMETRY_DIR.mkdir(parents=True, exist_ok=True)
AB_DIR.mkdir(parents=True, exist_ok=True)

# Rolling daily event log (JSONL)
EVENT_LOG = TELEMETRY_DIR / "events.jsonl"
# A/B variant assignments
VARIANT_LOG = AB_DIR / "assignments.jsonl"
CONVERSION_LOG = TELEMETRY_DIR / "conversions.jsonl"

# ── A/B test experiments ──────────────────────────────────────────────────────

EXPERIMENTS: dict[str, dict[str, Any]] = {
    "homepage_cta": {
        "name": "Homepage CTA Copy",
        "variants": ["control", "variant_a", "variant_b"],
        "weights": [0.5, 0.25, 0.25],
        "active": True,
        "goal": "subscribe_click",
    },
    "signal_depth_paywall": {
        "name": "Signal Depth Paywall Placement",
        "variants": ["inline", "bottom_sheet"],
        "weights": [0.5, 0.5],
        "active": True,
        "goal": "upgrade_click",
    },
    "newsletter_timing": {
        "name": "Newsletter Form Timing",
        "variants": ["immediate", "scroll_50", "exit_intent"],
        "weights": [0.33, 0.33, 0.34],
        "active": True,
        "goal": "newsletter_submit",
    },
}

# ── Models ────────────────────────────────────────────────────────────────────


class TelemetryEvent(BaseModel):
    event: str
    path: str | None = None
    referrer: str | None = None
    session_id: str | None = None
    variant: str | None = None
    experiment: str | None = None
    duration_ms: int | None = None
    scroll_depth: float | None = None
    properties: dict[str, Any] | None = None


class ConversionEvent(BaseModel):
    goal: str
    experiment: str | None = None
    variant: str | None = None
    session_id: str | None = None
    value_usd: float | None = None


class ABVariantRequest(BaseModel):
    experiment: str
    session_id: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cookieless_session(ip: str, ua: str, salt: str = "malindra-v5") -> str:
    """
    Generate a privacy-safe daily session ID.
    Hashes IP + UA + UTC date + salt — resets every 24 hours, never stored as cookie.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    raw = f"{ip}|{ua}|{today}|{salt}"
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def _append_jsonl(path: Path, entry: dict) -> None:
    try:
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:12]


def _pick_variant(experiment: str, session_id: str) -> str:
    """Deterministic variant assignment based on experiment + session hash."""
    exp = EXPERIMENTS.get(experiment)
    if not exp or not exp["active"]:
        return "control"
    variants = exp["variants"]
    weights = exp["weights"]
    # Deterministic bucket via hash
    h = int(hashlib.sha256(f"{experiment}|{session_id}".encode()).hexdigest()[:8], 16)
    r = (h % 10000) / 10000.0
    cumulative = 0.0
    for v, w in zip(variants, weights):
        cumulative += w
        if r < cumulative:
            return v
    return variants[-1]


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("/event")
async def track_event(
    body: TelemetryEvent,
    request: Request,
    x_consent: str | None = Header(None, alias="x-consent"),
) -> dict[str, str]:
    """
    Log a telemetry event. Requires X-Consent: analytics header.
    No cookies. No PII storage. IP is hashed.
    """
    # Consent gate
    if x_consent != "analytics":
        return {"status": "skipped", "reason": "no_consent"}

    ip = request.client.host if request.client else "0.0.0.0"
    ua = request.headers.get("user-agent", "")
    session_id = body.session_id or _cookieless_session(ip, ua)

    entry = {
        "ts": _now_iso(),
        "event": body.event,
        "session_id": session_id,
        "path": body.path,
        "referrer": body.referrer,
        "variant": body.variant,
        "experiment": body.experiment,
        "duration_ms": body.duration_ms,
        "scroll_depth": body.scroll_depth,
        "ip_hash": _hash_ip(ip),
        "properties": body.properties or {},
    }
    _append_jsonl(EVENT_LOG, entry)
    return {"status": "recorded", "session_id": session_id}


@router.post("/conversion")
async def track_conversion(
    body: ConversionEvent,
    request: Request,
    x_consent: str | None = Header(None, alias="x-consent"),
) -> dict[str, str]:
    """Log a conversion/goal completion event."""
    if x_consent != "analytics":
        return {"status": "skipped", "reason": "no_consent"}

    ip = request.client.host if request.client else "0.0.0.0"
    ua = request.headers.get("user-agent", "")
    session_id = body.session_id or _cookieless_session(ip, ua)

    entry = {
        "ts": _now_iso(),
        "goal": body.goal,
        "experiment": body.experiment,
        "variant": body.variant,
        "session_id": session_id,
        "value_usd": body.value_usd,
        "ip_hash": _hash_ip(ip),
    }
    _append_jsonl(CONVERSION_LOG, entry)
    return {"status": "recorded", "session_id": session_id}


@router.post("/ab/assign")
async def assign_variant(
    body: ABVariantRequest,
    request: Request,
) -> dict[str, Any]:
    """
    Return deterministic A/B variant assignment for a session.
    Used at build time for static variant generation and at runtime for dynamic assignment.
    """
    if body.experiment not in EXPERIMENTS:
        raise HTTPException(status_code=404, detail=f"Experiment '{body.experiment}' not found")

    ip = request.client.host if request.client else "0.0.0.0"
    ua = request.headers.get("user-agent", "")
    session_id = body.session_id or _cookieless_session(ip, ua)
    variant = _pick_variant(body.experiment, session_id)

    exp = EXPERIMENTS[body.experiment]
    entry = {
        "ts": _now_iso(),
        "experiment": body.experiment,
        "session_id": session_id,
        "variant": variant,
        "ip_hash": _hash_ip(ip),
    }
    _append_jsonl(VARIANT_LOG, entry)

    return {
        "experiment": body.experiment,
        "variant": variant,
        "session_id": session_id,
        "goal": exp["goal"],
    }


@router.get("/ab/experiments")
async def list_experiments() -> dict[str, Any]:
    """List all A/B test configurations."""
    return {"experiments": EXPERIMENTS}


@router.get("/summary")
async def telemetry_summary(
    x_monitor_token: str | None = Header(None, alias="x-monitor-token"),
) -> dict[str, Any]:
    """Return aggregated telemetry summary. Requires X-Monitor-Token."""
    import os
    import hmac

    expected = os.getenv("MONITOR_TOKEN", "")
    if expected and (not x_monitor_token or not hmac.compare_digest(x_monitor_token, expected)):
        raise HTTPException(status_code=401, detail="Invalid monitor token")

    def _count_events(path: Path) -> int:
        if not path.exists():
            return 0
        try:
            return sum(1 for _ in path.open(encoding="utf-8"))
        except Exception:
            return 0

    def _top_events(path: Path, n: int = 10) -> dict[str, int]:
        counts: dict[str, int] = {}
        if not path.exists():
            return counts
        try:
            for line in path.open(encoding="utf-8"):
                try:
                    e = json.loads(line)
                    key = e.get("event", e.get("goal", "unknown"))
                    counts[key] = counts.get(key, 0) + 1
                except Exception:
                    pass
        except Exception:
            pass
        return dict(sorted(counts.items(), key=lambda x: -x[1])[:n])

    def _variant_stats(path: Path) -> dict[str, dict[str, int]]:
        stats: dict[str, dict[str, int]] = {}
        if not path.exists():
            return stats
        try:
            for line in path.open(encoding="utf-8"):
                try:
                    e = json.loads(line)
                    exp = e.get("experiment", "")
                    var = e.get("variant", "")
                    if exp:
                        stats.setdefault(exp, {})
                        stats[exp][var] = stats[exp].get(var, 0) + 1
                except Exception:
                    pass
        except Exception:
            pass
        return stats

    return {
        "total_events": _count_events(EVENT_LOG),
        "total_conversions": _count_events(CONVERSION_LOG),
        "total_ab_assignments": _count_events(VARIANT_LOG),
        "top_events": _top_events(EVENT_LOG),
        "top_goals": _top_events(CONVERSION_LOG),
        "variant_distribution": _variant_stats(VARIANT_LOG),
        "generated_at": _now_iso(),
    }
