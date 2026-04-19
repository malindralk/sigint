# MALINDRA PHASE 5
# backend/app/api/routes/partners.py
# Monetization & partner ecosystem:
# - Affiliate link tracking (cookieless, consent-based)
# - White-label brief generation (Sovereign+ tier)
# - Partner API access tiers
# - Revenue share tracking

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, HttpUrl

router = APIRouter(prefix="/api/partners", tags=["partners"])

ROOT = Path(__file__).parent.parent.parent.parent.parent
PARTNERS_DIR = ROOT / "data" / "partners"
PARTNERS_DIR.mkdir(parents=True, exist_ok=True)
AFFILIATE_LOG = PARTNERS_DIR / "affiliate_clicks.jsonl"
BRIEF_LOG = PARTNERS_DIR / "brief_requests.jsonl"
PARTNER_REGISTRY = PARTNERS_DIR / "registry.json"

# ── Models ────────────────────────────────────────────────────────────────────


class AffiliateClickEvent(BaseModel):
    partner_code: str
    source_path: str
    destination: str
    session_id: str | None = None


class WhitelabelBriefRequest(BaseModel):
    slug: str
    partner_code: str
    format: str = "pdf"  # pdf | markdown | json
    branding: dict[str, str] | None = None  # logo_url, org_name, accent_color
    access_token: str


class PartnerRegistration(BaseModel):
    org_name: str
    contact_email: str
    tier: str = "affiliate"  # affiliate | reseller | integration
    revenue_share_pct: float = 20.0


# ── Helpers ───────────────────────────────────────────────────────────────────


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _append_jsonl(path: Path, entry: dict) -> None:
    try:
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


def _load_registry() -> dict[str, Any]:
    if PARTNER_REGISTRY.exists():
        try:
            return json.loads(PARTNER_REGISTRY.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_registry(data: dict) -> None:
    PARTNER_REGISTRY.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def _validate_partner(partner_code: str) -> dict[str, Any] | None:
    registry = _load_registry()
    code_hash = hashlib.sha256(partner_code.encode()).hexdigest()[:24]
    return registry.get(code_hash)


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:12]


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("/affiliate/click")
async def track_affiliate_click(
    body: AffiliateClickEvent,
    request: Request,
    x_consent: str | None = Header(None, alias="x-consent"),
) -> dict[str, Any]:
    """
    Log an affiliate link click. Cookieless, privacy-safe.
    Returns a redirect token for conversion attribution (session-scoped only).
    """
    if x_consent != "analytics":
        return {"status": "skipped", "reason": "no_consent"}

    partner = _validate_partner(body.partner_code)
    if not partner:
        # Still log but mark as unregistered
        partner_name = "unknown"
    else:
        partner_name = partner.get("org_name", "unknown")

    ip = request.client.host if request.client else "0.0.0.0"
    click_id = secrets.token_urlsafe(16)

    entry = {
        "ts": _now_iso(),
        "click_id": click_id,
        "partner_code_hash": hashlib.sha256(body.partner_code.encode()).hexdigest()[:16],
        "partner_name": partner_name,
        "source_path": body.source_path,
        "destination": body.destination,
        "session_id": body.session_id,
        "ip_hash": _hash_ip(ip),
    }
    _append_jsonl(AFFILIATE_LOG, entry)

    return {
        "status": "tracked",
        "click_id": click_id,
        "partner": partner_name,
    }


@router.post("/brief/generate")
async def generate_whitelabel_brief(
    body: WhitelabelBriefRequest,
    request: Request,
) -> dict[str, Any]:
    """
    Generate a white-label intelligence brief for a given article slug.
    Requires Sovereign+ tier access token.
    """
    # Validate access token tier
    from app.middleware.access import _resolve_tier, TIER_ORDER

    tier, status = _resolve_tier(body.access_token)
    if TIER_ORDER.index(tier) < TIER_ORDER.index("sovereign"):
        raise HTTPException(
            status_code=403,
            detail={
                "message": "White-label brief generation requires Sovereign or Enterprise tier.",
                "your_tier": tier,
                "required_tier": "sovereign",
                "upgrade_url": "/subscribe",
            },
        )

    # Load article data from enriched cache
    enriched_path = ROOT / "data" / "enriched" / f"{body.slug}.json"
    if not enriched_path.exists():
        raise HTTPException(status_code=404, detail=f"Article '{body.slug}' not found in enriched data")

    try:
        article = json.loads(enriched_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to load article data") from exc

    # Load signal data if available
    signal_path = ROOT / "data" / "signals" / f"{body.slug}.json"
    signal = {}
    if signal_path.exists():
        try:
            signal = json.loads(signal_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    branding = body.branding or {}
    org_name = branding.get("org_name", "Intelligence Partner")
    accent_color = branding.get("accent_color", "#c8a84b")

    # Build brief payload
    brief_id = secrets.token_urlsafe(12)
    brief: dict[str, Any] = {
        "brief_id": brief_id,
        "generated_at": _now_iso(),
        "format": body.format,
        "branding": {
            "org_name": org_name,
            "accent_color": accent_color,
            "logo_url": branding.get("logo_url", ""),
            "powered_by": "Malindra Intelligence Platform",
        },
        "content": {
            "title": article.get("title", body.slug),
            "slug": body.slug,
            "summary": article.get("summary", article.get("excerpt", "")),
            "categories": article.get("categories", []),
            "tags": article.get("tags", []),
            "sigint_blocks": article.get("sigint_blocks", {}),
            "word_count": article.get("word_count", 0),
        },
        "signals": {
            "dominant": signal.get("dominant_signal", ""),
            "strength": signal.get("signal_strength", {}),
            "trajectory": signal.get("projected_trajectory", []),
            "confidence": signal.get("confidence_interval", {}),
        } if signal else {},
        "disclaimer": (
            f"This brief was generated for {org_name} using the Malindra Intelligence Platform. "
            "It is intended for internal strategic use only and may not be redistributed without authorization."
        ),
    }

    if body.format == "markdown":
        brief["markdown"] = _render_brief_markdown(brief, org_name, accent_color)

    # Log request (no PII — only partner code hash + slug)
    ip = request.client.host if request.client else "0.0.0.0"
    _append_jsonl(BRIEF_LOG, {
        "ts": _now_iso(),
        "brief_id": brief_id,
        "slug": body.slug,
        "partner_code_hash": hashlib.sha256(body.partner_code.encode()).hexdigest()[:16],
        "format": body.format,
        "tier": tier,
        "ip_hash": _hash_ip(ip),
    })

    return brief


def _render_brief_markdown(brief: dict, org_name: str, accent_color: str) -> str:
    """Render brief as structured Markdown."""
    c = brief["content"]
    s = brief["signals"]
    lines = [
        f"# {c['title']}",
        f"*Intelligence Brief — {org_name}*",
        f"*Generated: {brief['generated_at'][:10]}*",
        "",
        "---",
        "",
        "## Summary",
        "",
        c["summary"],
        "",
    ]

    if c.get("sigint_blocks"):
        blocks = c["sigint_blocks"]
        for key in ["signal", "context", "implication", "action"]:
            val = blocks.get(key, "")
            if val:
                lines += [f"## {key.capitalize()}", "", val, ""]

    if s.get("dominant"):
        lines += [
            "## Signal Analysis",
            "",
            f"**Dominant Signal:** {s['dominant']}",
            "",
        ]
        if s.get("trajectory"):
            traj = s["trajectory"]
            lines.append(f"**Projected Trajectory (4Q):** {' → '.join(f'{v:.1%}' for v in traj)}")
            lines.append("")

    lines += [
        "---",
        "",
        f"*{brief['disclaimer']}*",
        "",
        f"*Powered by Malindra Intelligence Platform · {org_name}*",
    ]

    return "\n".join(lines)


@router.get("/programs")
async def list_partner_programs() -> dict[str, Any]:
    """List available partner programs and revenue share structures."""
    return {
        "programs": [
            {
                "id": "affiliate",
                "name": "Affiliate Partner",
                "description": "Earn revenue share on referred subscriptions",
                "revenue_share_pct": 20,
                "commission_model": "recurring",
                "requirements": "None — open to all",
                "assets": "Custom UTM links, embeddable signal widgets",
            },
            {
                "id": "reseller",
                "name": "Reseller Partner",
                "description": "White-label Malindra for your clients",
                "revenue_share_pct": 35,
                "commission_model": "recurring",
                "requirements": "Sovereign tier subscription",
                "assets": "Full white-label kit, API access, brief generation",
            },
            {
                "id": "integration",
                "name": "Integration Partner",
                "description": "Embed Malindra signals in your platform via API",
                "revenue_share_pct": 0,
                "commission_model": "api_usage",
                "requirements": "Enterprise tier, technical review",
                "assets": "Full REST API, webhook events, SLA",
            },
        ],
        "apply_url": "/partner",
        "contact": "partners@malindra.lk",
    }


@router.post("/register", include_in_schema=False)
async def register_partner(
    body: PartnerRegistration,
    x_monitor_token: str | None = Header(None, alias="x-monitor-token"),
) -> dict[str, Any]:
    """Admin-only: register a new partner. Requires X-Monitor-Token."""
    import os

    expected = os.getenv("MONITOR_TOKEN", "")
    if not expected or not x_monitor_token or not hmac.compare_digest(x_monitor_token, expected):
        raise HTTPException(status_code=401, detail="Invalid monitor token")

    code = secrets.token_urlsafe(24)
    code_hash = hashlib.sha256(code.encode()).hexdigest()[:24]
    registry = _load_registry()
    registry[code_hash] = {
        "org_name": body.org_name,
        "contact_email_hash": hashlib.sha256(body.contact_email.encode()).hexdigest()[:16],
        "tier": body.tier,
        "revenue_share_pct": body.revenue_share_pct,
        "registered_at": _now_iso(),
        "active": True,
    }
    _save_registry(registry)

    return {
        "partner_code": code,  # shown once — store securely
        "code_hash": code_hash,
        "org_name": body.org_name,
        "tier": body.tier,
        "note": "Partner code shown once. Store securely.",
    }


@router.get("/stats", include_in_schema=False)
async def partner_stats(
    x_monitor_token: str | None = Header(None, alias="x-monitor-token"),
) -> dict[str, Any]:
    """Internal partner analytics. Requires X-Monitor-Token."""
    import os

    expected = os.getenv("MONITOR_TOKEN", "")
    if not expected or not x_monitor_token or not hmac.compare_digest(x_monitor_token, expected):
        raise HTTPException(status_code=401, detail="Invalid monitor token")

    def _count(path: Path) -> int:
        if not path.exists():
            return 0
        try:
            return sum(1 for _ in path.open(encoding="utf-8"))
        except Exception:
            return 0

    registry = _load_registry()
    return {
        "registered_partners": len(registry),
        "affiliate_clicks": _count(AFFILIATE_LOG),
        "brief_requests": _count(BRIEF_LOG),
        "generated_at": _now_iso(),
    }
