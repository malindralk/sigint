# MALINDRA PHASE 5
# backend/app/api/routes/subscriptions.py
# Enterprise subscription & tiered access.
# Stripe webhook handler, plan management, tier verification.

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

ROOT = Path(__file__).parent.parent.parent.parent.parent
SUB_DIR = ROOT / "data" / "subscriptions"
SUB_DIR.mkdir(parents=True, exist_ok=True)

# ── Subscription tiers ────────────────────────────────────────────────────────

TIERS: dict[str, dict[str, Any]] = {
    "free": {
        "label": "Free",
        "monthly_usd": 0,
        "api_calls": 500,
        "data_exports": False,
        "scenario_engine": False,
        "multilateral_data": False,
        "white_label": False,
        "signal_depth": "summary",
        "support": "community",
    },
    "signal": {
        "label": "Signal",
        "monthly_usd": 29,
        "api_calls": 5_000,
        "data_exports": True,
        "scenario_engine": True,
        "multilateral_data": False,
        "white_label": False,
        "signal_depth": "full",
        "support": "email",
    },
    "sovereign": {
        "label": "Sovereign",
        "monthly_usd": 149,
        "api_calls": 50_000,
        "data_exports": True,
        "scenario_engine": True,
        "multilateral_data": True,
        "white_label": False,
        "signal_depth": "full+raw",
        "support": "priority",
    },
    "enterprise": {
        "label": "Enterprise",
        "monthly_usd": 0,  # custom pricing
        "api_calls": 500_000,
        "data_exports": True,
        "scenario_engine": True,
        "multilateral_data": True,
        "white_label": True,
        "signal_depth": "full+raw+inference",
        "support": "dedicated",
    },
}

# Stripe price IDs → tier mapping (set in env)
STRIPE_PRICE_MAP: dict[str, str] = {
    "price_signal_monthly": "signal",
    "price_sovereign_monthly": "sovereign",
    "price_enterprise_annual": "enterprise",
}


# ── Models ────────────────────────────────────────────────────────────────────


class CheckoutRequest(BaseModel):
    email: EmailStr
    tier: str
    success_url: str
    cancel_url: str


class SubscriptionRecord(BaseModel):
    subscription_id: str
    email: str
    tier: str
    status: str  # active | cancelled | past_due | trialing
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    current_period_end: str | None = None
    created_at: str
    updated_at: str


class VerifyRequest(BaseModel):
    email: EmailStr
    access_token: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _subs_index() -> dict[str, Any]:
    idx_path = SUB_DIR / "index.json"
    if idx_path.exists():
        try:
            return json.loads(idx_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_index(data: dict[str, Any]) -> None:
    idx_path = SUB_DIR / "index.json"
    idx_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def _get_subscription(email_hash: str) -> dict[str, Any] | None:
    sub_path = SUB_DIR / f"{email_hash}.json"
    if sub_path.exists():
        try:
            return json.loads(sub_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return None


def _save_subscription(email_hash: str, record: dict[str, Any]) -> None:
    sub_path = SUB_DIR / f"{email_hash}.json"
    sub_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    # Update index
    idx = _subs_index()
    idx[email_hash] = {
        "tier": record["tier"],
        "status": record["status"],
        "updated_at": record["updated_at"],
    }
    _save_index(idx)


def _email_hash(email: str) -> str:
    return hashlib.sha256(email.lower().strip().encode()).hexdigest()[:32]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/plans")
async def list_plans() -> dict[str, Any]:
    """Return all subscription plans with features."""
    return {
        "plans": TIERS,
        "default_tier": "free",
        "currency": "USD",
    }


@router.post("/checkout")
async def create_checkout(body: CheckoutRequest) -> dict[str, Any]:
    """
    Initiate Stripe checkout session.
    In environments without STRIPE_SECRET_KEY, returns a pending record
    with a manual payment URL placeholder.
    """
    import os

    stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
    tier = body.tier

    if tier not in TIERS:
        raise HTTPException(status_code=400, detail=f"Unknown tier: {tier}")

    if tier == "free":
        # Auto-activate free tier
        email_hash = _email_hash(body.email)
        now = _now_iso()
        record: dict[str, Any] = {
            "subscription_id": f"free_{email_hash[:12]}",
            "email_hash": email_hash,
            "tier": "free",
            "status": "active",
            "stripe_customer_id": None,
            "stripe_subscription_id": None,
            "current_period_end": None,
            "access_token": secrets.token_urlsafe(32),
            "created_at": now,
            "updated_at": now,
        }
        _save_subscription(email_hash, record)
        return {
            "checkout_url": body.success_url,
            "subscription_id": record["subscription_id"],
            "tier": "free",
            "access_token": record["access_token"],
        }

    if not stripe_key:
        # Fallback: manual activation flow
        email_hash = _email_hash(body.email)
        now = _now_iso()
        token = secrets.token_urlsafe(32)
        record = {
            "subscription_id": f"pending_{token[:12]}",
            "email_hash": email_hash,
            "tier": tier,
            "status": "pending",
            "stripe_customer_id": None,
            "stripe_subscription_id": None,
            "current_period_end": None,
            "access_token": token,
            "created_at": now,
            "updated_at": now,
        }
        _save_subscription(email_hash, record)
        return {
            "checkout_url": f"{body.cancel_url}?pending=true&tier={tier}",
            "subscription_id": record["subscription_id"],
            "tier": tier,
            "status": "pending",
            "message": "STRIPE_SECRET_KEY not configured. Manual activation required.",
        }

    # Stripe integration
    try:
        import stripe  # type: ignore

        stripe.api_key = stripe_key

        # Find matching price ID
        price_id = next(
            (pid for pid, t in STRIPE_PRICE_MAP.items() if t == tier),
            f"price_{tier}_monthly",
        )

        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            customer_email=body.email,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=body.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=body.cancel_url,
            metadata={"malindra_tier": tier, "email_hash": _email_hash(body.email)},
        )
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "tier": tier,
        }
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Stripe library not installed. Run: pip install stripe",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc}") from exc


@router.post("/verify")
async def verify_subscription(body: VerifyRequest) -> dict[str, Any]:
    """Verify subscription status and return tier permissions."""
    email_hash = _email_hash(body.email)
    record = _get_subscription(email_hash)

    if not record:
        return {
            "tier": "free",
            "status": "none",
            "permissions": TIERS["free"],
            "message": "No subscription found. Free tier applied.",
        }

    tier = record.get("tier", "free")
    sub_status = record.get("status", "inactive")

    # Validate access token if provided
    if body.access_token:
        stored_token = record.get("access_token", "")
        if not hmac.compare_digest(body.access_token, stored_token):
            raise HTTPException(status_code=403, detail="Invalid access token")

    active = sub_status in ("active", "trialing")
    resolved_tier = tier if active else "free"

    return {
        "tier": resolved_tier,
        "status": sub_status,
        "permissions": TIERS.get(resolved_tier, TIERS["free"]),
        "subscription_id": record.get("subscription_id"),
        "current_period_end": record.get("current_period_end"),
    }


@router.post("/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
) -> dict[str, Any]:
    """Handle Stripe webhook events for subscription lifecycle management."""
    import os

    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    payload = await request.body()

    if webhook_secret and stripe_signature:
        try:
            import stripe  # type: ignore

            stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
            event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {exc}") from exc
    else:
        # Dev mode: parse without verification
        try:
            event = json.loads(payload)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    event_type = event.get("type", "")
    data_obj = event.get("data", {}).get("object", {})
    now = _now_iso()

    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        email_hash = (data_obj.get("metadata") or {}).get("email_hash", "")
        tier = (data_obj.get("metadata") or {}).get("malindra_tier", "signal")
        stripe_sub_id = data_obj.get("id", "")
        stripe_cust = data_obj.get("customer", "")
        period_end_ts = data_obj.get("current_period_end")
        period_end = (
            datetime.fromtimestamp(period_end_ts, tz=timezone.utc).isoformat()
            if period_end_ts
            else None
        )
        stripe_status = data_obj.get("status", "active")

        if email_hash:
            existing = _get_subscription(email_hash) or {}
            record = {
                **existing,
                "subscription_id": existing.get("subscription_id", f"stripe_{stripe_sub_id[:12]}"),
                "email_hash": email_hash,
                "tier": tier,
                "status": stripe_status,
                "stripe_customer_id": stripe_cust,
                "stripe_subscription_id": stripe_sub_id,
                "current_period_end": period_end,
                "access_token": existing.get("access_token", secrets.token_urlsafe(32)),
                "created_at": existing.get("created_at", now),
                "updated_at": now,
            }
            _save_subscription(email_hash, record)

    elif event_type == "customer.subscription.deleted":
        email_hash = (data_obj.get("metadata") or {}).get("email_hash", "")
        if email_hash:
            existing = _get_subscription(email_hash) or {}
            existing.update({"status": "cancelled", "updated_at": now})
            _save_subscription(email_hash, existing)

    elif event_type == "invoice.payment_failed":
        email_hash = ""
        sub_id = data_obj.get("subscription", "")
        # Find by stripe subscription id
        idx = _subs_index()
        for eh in idx:
            rec = _get_subscription(eh)
            if rec and rec.get("stripe_subscription_id") == sub_id:
                email_hash = eh
                break
        if email_hash:
            existing = _get_subscription(email_hash) or {}
            existing.update({"status": "past_due", "updated_at": now})
            _save_subscription(email_hash, existing)

    # Log webhook event
    webhook_log = SUB_DIR / "webhook_events.jsonl"
    try:
        entry = json.dumps({
            "ts": now,
            "type": event_type,
            "id": event.get("id", ""),
        }, ensure_ascii=False)
        with webhook_log.open("a", encoding="utf-8") as f:
            f.write(entry + "\n")
    except Exception:
        pass

    return {"received": True, "type": event_type}


@router.get("/stats", include_in_schema=False)
async def subscription_stats(
    x_monitor_token: str | None = Header(None, alias="x-monitor-token"),
) -> dict[str, Any]:
    """Internal stats for monitoring. Requires X-Monitor-Token."""
    import os

    expected = os.getenv("MONITOR_TOKEN", "")
    if expected and (not x_monitor_token or not hmac.compare_digest(x_monitor_token, expected)):
        raise HTTPException(status_code=401, detail="Invalid monitor token")

    idx = _subs_index()
    counts: dict[str, int] = {}
    status_counts: dict[str, int] = {}

    for _, meta in idx.items():
        tier = meta.get("tier", "free")
        s = meta.get("status", "unknown")
        counts[tier] = counts.get(tier, 0) + 1
        status_counts[s] = status_counts.get(s, 0) + 1

    return {
        "total_subscriptions": len(idx),
        "by_tier": counts,
        "by_status": status_counts,
        "generated_at": _now_iso(),
    }
