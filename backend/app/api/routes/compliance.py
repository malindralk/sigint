# MALINDRA PHASE 4
# backend/app/api/routes/compliance.py
# GDPR compliance, audit trail, data retention management.
# GET  /api/compliance/audit      → access logs, retention status
# POST /api/compliance/consent    → GDPR consent logging
# POST /api/compliance/retention  → trigger data deletion after retention period

import hashlib
import json
import os
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/compliance", tags=["compliance"])

ROOT = Path(__file__).parent.parent.parent.parent.parent
AUDIT_DIR = ROOT / "data" / "audit"
AUDIT_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_LOG = AUDIT_DIR / "audit.log"
CONSENT_LOG = ROOT / "data" / "engagement" / "consent-log.jsonl"
ACCESS_LOG = AUDIT_DIR / "access.log"

COMPLIANCE_TOKEN = os.environ.get("EXPORT_TOKEN", "")
RETENTION_DAYS = {
    "analytics": 90,
    "leads": 365,
    "consent": 1095,  # 3 years
    "engagement": 180,
}

RESTRICTED_JURISDICTIONS: set[str] = {"KP", "IR", "CU", "SY"}  # North Korea, Iran, Cuba, Syria


# ── Pydantic models ───────────────────────────────────────────────────────────

class ConsentRecord(BaseModel):
    decision: str  # "granted" | "declined" | "withdrawn"
    version: str = "v1"
    locale: str = "en"
    timestamp: str | None = None
    ip_hash: str | None = None


class RetentionRequest(BaseModel):
    dataset: str  # analytics | leads | engagement
    older_than_days: int | None = None  # None = use default for dataset


# ── Helpers ───────────────────────────────────────────────────────────────────

def _append_audit(entry: dict) -> None:
    try:
        with AUDIT_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


def _count_log_entries(path: Path) -> int:
    if not path.exists():
        return 0
    try:
        return sum(1 for line in path.open(encoding="utf-8") if line.strip())
    except Exception:
        return 0


def _get_retention_status() -> dict[str, dict]:
    status = {}
    for dataset, days in RETENTION_DAYS.items():
        data_dir = ROOT / "data" / dataset
        status[dataset] = {
            "retention_days": days,
            "path_exists": data_dir.exists(),
            "cutoff": (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(),
        }
    return status


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/audit")
async def get_audit(
    x_export_token: str = Header(default=""),
    limit: int = 100,
):
    """Return access logs and data retention status."""
    if COMPLIANCE_TOKEN and x_export_token != COMPLIANCE_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid compliance token")

    # Read recent audit log entries
    audit_entries = []
    if AUDIT_LOG.exists():
        try:
            lines = AUDIT_LOG.read_text(encoding="utf-8").strip().split("\n")
            for line in reversed(lines[-limit:]):
                if line.strip():
                    try:
                        audit_entries.append(json.loads(line))
                    except Exception:
                        pass
        except Exception:
            pass

    # Read recent access log entries
    access_entries = []
    if ACCESS_LOG.exists():
        try:
            lines = ACCESS_LOG.read_text(encoding="utf-8").strip().split("\n")
            for line in reversed(lines[-min(limit, 50):]):
                if line.strip():
                    try:
                        access_entries.append(json.loads(line))
                    except Exception:
                        pass
        except Exception:
            pass

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "audit_entries": audit_entries,
        "access_entries": access_entries,
        "retention_status": _get_retention_status(),
        "consent_log_entries": _count_log_entries(CONSENT_LOG),
        "audit_log_entries": _count_log_entries(AUDIT_LOG),
    }


@router.post("/consent")
async def log_consent(record: ConsentRecord):
    """Log GDPR consent decision with audit trail."""
    if record.decision not in ("granted", "declined", "withdrawn"):
        raise HTTPException(status_code=400, detail="decision must be: granted | declined | withdrawn")

    entry = {
        "ts": record.timestamp or datetime.now(timezone.utc).isoformat(),
        "decision": record.decision,
        "version": record.version,
        "locale": record.locale,
        "ip_hash": record.ip_hash,
    }

    CONSENT_LOG.parent.mkdir(parents=True, exist_ok=True)
    try:
        with CONSENT_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass

    _append_audit({
        "ts": entry["ts"],
        "action": "consent_logged",
        "decision": record.decision,
        "locale": record.locale,
    })

    return {"status": "logged", "decision": record.decision}


@router.post("/retention")
async def trigger_retention(
    request: RetentionRequest,
    x_export_token: str = Header(default=""),
):
    """Delete data older than retention period for a dataset."""
    if COMPLIANCE_TOKEN and x_export_token != COMPLIANCE_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid compliance token")

    if request.dataset not in RETENTION_DAYS:
        raise HTTPException(
            status_code=400,
            detail=f"dataset must be one of: {list(RETENTION_DAYS.keys())}",
        )

    days = request.older_than_days or RETENTION_DAYS[request.dataset]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    data_dir = ROOT / "data" / request.dataset

    if not data_dir.exists():
        return {"status": "skipped", "reason": "dataset directory not found", "dataset": request.dataset}

    deleted = 0
    errors = 0

    # JSONL files: filter lines by timestamp
    for jsonl_file in data_dir.glob("*.jsonl"):
        try:
            lines = jsonl_file.read_text(encoding="utf-8").strip().split("\n")
            kept = []
            for line in lines:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    ts_str = entry.get("ts") or entry.get("timestamp") or ""
                    if ts_str:
                        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                        if ts >= cutoff:
                            kept.append(line)
                        else:
                            deleted += 1
                    else:
                        kept.append(line)  # keep entries without timestamp
                except Exception:
                    kept.append(line)
            jsonl_file.write_text("\n".join(kept) + "\n" if kept else "", encoding="utf-8")
        except Exception:
            errors += 1

    _append_audit({
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": "retention_executed",
        "dataset": request.dataset,
        "cutoff": cutoff.isoformat(),
        "deleted_entries": deleted,
        "errors": errors,
    })

    return {
        "status": "complete",
        "dataset": request.dataset,
        "cutoff": cutoff.isoformat(),
        "deleted_entries": deleted,
        "errors": errors,
    }
