# MALINDRA PHASE 4
# backend/app/api/routes/enterprise.py
# Enterprise access: API key management, usage quotas, data export.
# POST /api/enterprise/keys    → generate API key + usage quota
# GET  /api/enterprise/usage   → request counts, quota remaining, last access
# GET  /api/enterprise/export  → CSV/JSON export of accessible data

import csv
import hashlib
import io
import json
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/enterprise", tags=["enterprise"])

ROOT = Path(__file__).parent.parent.parent.parent.parent
ENTERPRISE_DIR = ROOT / "data" / "enterprise"
ENTERPRISE_DIR.mkdir(parents=True, exist_ok=True)
KEYS_FILE = ENTERPRISE_DIR / "api_keys.json"
USAGE_FILE = ENTERPRISE_DIR / "usage.json"

DEFAULT_QUOTA = 10_000  # requests per month


# ── Storage helpers ───────────────────────────────────────────────────────────

def _load_keys() -> dict[str, dict]:
    if KEYS_FILE.exists():
        try:
            return json.loads(KEYS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_keys(keys: dict) -> None:
    KEYS_FILE.write_text(json.dumps(keys, indent=2, ensure_ascii=False), encoding="utf-8")


def _load_usage() -> dict[str, dict]:
    if USAGE_FILE.exists():
        try:
            return json.loads(USAGE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_usage(usage: dict) -> None:
    USAGE_FILE.write_text(json.dumps(usage, indent=2, ensure_ascii=False), encoding="utf-8")


def _key_hash(key: str) -> str:
    """SHA-256 hash of API key for storage (never store raw key post-creation)."""
    return hashlib.sha256(key.encode()).hexdigest()


# ── Pydantic models ───────────────────────────────────────────────────────────

class KeyCreateRequest(BaseModel):
    name: str
    email: EmailStr
    organization: str
    role: str = "analyst"
    quota: int = DEFAULT_QUOTA
    tier: str = "standard"  # standard | premium | institutional


class KeyResponse(BaseModel):
    key: str          # raw key — shown only on creation
    key_id: str
    name: str
    email: str
    organization: str
    tier: str
    quota: int
    created_at: str
    expires_at: str | None = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/keys", response_model=KeyResponse)
async def create_api_key(request: KeyCreateRequest):
    """Generate a new API key with usage quota."""
    raw_key = f"mlk_{secrets.token_urlsafe(32)}"
    key_id = secrets.token_hex(8)
    key_hash = _key_hash(raw_key)
    now = datetime.now(timezone.utc).isoformat()

    keys = _load_keys()
    keys[key_hash] = {
        "key_id": key_id,
        "name": request.name,
        "email": request.email,
        "organization": request.organization,
        "role": request.role,
        "tier": request.tier,
        "quota": request.quota,
        "created_at": now,
        "expires_at": None,
        "active": True,
    }
    _save_keys(keys)

    # Initialize usage record
    usage = _load_usage()
    usage[key_hash] = {
        "key_id": key_id,
        "requests_this_month": 0,
        "total_requests": 0,
        "last_access": None,
        "month": datetime.now(timezone.utc).strftime("%Y-%m"),
    }
    _save_usage(usage)

    return KeyResponse(
        key=raw_key,
        key_id=key_id,
        name=request.name,
        email=request.email,
        organization=request.organization,
        tier=request.tier,
        quota=request.quota,
        created_at=now,
    )


@router.get("/usage")
async def get_usage(x_api_key: str = Header(...)):
    """Return request counts, quota remaining, and last access for this key."""
    key_hash = _key_hash(x_api_key)
    keys = _load_keys()
    if key_hash not in keys:
        raise HTTPException(status_code=401, detail="Invalid API key")

    key_meta = keys[key_hash]
    if not key_meta.get("active", True):
        raise HTTPException(status_code=403, detail="API key is disabled")

    usage = _load_usage()
    usage_record = usage.get(key_hash, {})

    # Reset monthly counter if month changed
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    if usage_record.get("month") != current_month:
        usage_record["requests_this_month"] = 0
        usage_record["month"] = current_month
        usage[key_hash] = usage_record
        _save_usage(usage)

    quota = key_meta.get("quota", DEFAULT_QUOTA)
    used = usage_record.get("requests_this_month", 0)

    return {
        "key_id": key_meta["key_id"],
        "organization": key_meta["organization"],
        "tier": key_meta["tier"],
        "quota": quota,
        "used_this_month": used,
        "remaining": max(0, quota - used),
        "last_access": usage_record.get("last_access"),
        "total_requests": usage_record.get("total_requests", 0),
    }


@router.get("/export")
async def export_data(
    x_api_key: str = Header(...),
    format: str = Query("json", pattern="^(json|csv)$"),
    dataset: str = Query("predictions", pattern="^(predictions|articles|votes)$"),
):
    """Export accessible dataset in JSON or CSV format."""
    key_hash = _key_hash(x_api_key)
    keys = _load_keys()
    if key_hash not in keys:
        raise HTTPException(status_code=401, detail="Invalid API key")

    key_meta = keys[key_hash]
    if not key_meta.get("active", True):
        raise HTTPException(status_code=403, detail="API key is disabled")

    # Track usage
    usage = _load_usage()
    rec = usage.get(key_hash, {"requests_this_month": 0, "total_requests": 0, "month": ""})
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    if rec.get("month") != current_month:
        rec["requests_this_month"] = 0
        rec["month"] = current_month
    rec["requests_this_month"] = rec.get("requests_this_month", 0) + 1
    rec["total_requests"] = rec.get("total_requests", 0) + 1
    rec["last_access"] = datetime.now(timezone.utc).isoformat()
    usage[key_hash] = rec
    _save_usage(usage)

    # Load dataset
    data_dir_map = {
        "predictions": ROOT / "data" / "predictions",
        "articles": ROOT / "data" / "enriched",
        "votes": ROOT / "data" / "votes",
    }
    data_dir = data_dir_map[dataset]
    records = []
    if data_dir.exists():
        for f in sorted(data_dir.glob("*.json")):
            if f.name == "index.json":
                continue
            try:
                records.append(json.loads(f.read_text(encoding="utf-8")))
            except Exception:
                pass

    if format == "json":
        content = json.dumps({"dataset": dataset, "count": len(records), "items": records}, ensure_ascii=False)
        return StreamingResponse(
            io.BytesIO(content.encode("utf-8")),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="malindra_{dataset}.json"'},
        )

    # CSV export
    if not records:
        raise HTTPException(status_code=404, detail="No data available")
    flat_keys = list(records[0].keys()) if records else []
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=flat_keys, extrasaction="ignore")
    writer.writeheader()
    for r in records:
        writer.writerow({k: str(r.get(k, "")) for k in flat_keys})
    csv_bytes = output.getvalue().encode("utf-8")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="malindra_{dataset}.csv"'},
    )
