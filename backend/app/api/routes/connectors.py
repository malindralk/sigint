# MALINDRA PHASE 4
# backend/app/api/routes/connectors.py
# FastAPI routes for multilateral data pipeline connector management.
# GET  /api/connectors/status  → connector health, last sync, error logs
# POST /api/connectors/sync    → trigger manual sync for editorial use

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/connectors", tags=["connectors"])
logger = logging.getLogger(__name__)

ROOT = Path(__file__).parent.parent.parent.parent.parent
EXTERNAL_DIR = ROOT / "data" / "external"
STATUS_FILE = ROOT / "data" / "external" / "connector_status.json"


class SyncRequest(BaseModel):
    connectors: list[str] = ["regional_finance", "trade_logistics", "policy_feeds"]


def _load_status() -> dict:
    if STATUS_FILE.exists():
        try:
            return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"synced_at": None, "connectors": {}, "errors": []}


def _save_status(status: dict) -> None:
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False), encoding="utf-8")


def _run_sync(connector_names: list[str]) -> dict:
    """Execute connector sync in background. Returns status dict."""
    results: dict = {
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "connectors": {},
        "errors": [],
    }

    # Import connectors lazily to avoid startup cost
    try:
        from backend.connectors.regional_finance import RegionalFinanceConnector
        from backend.connectors.trade_logistics import TradeLogisticsConnector
        from backend.connectors.policy_feeds import PolicyFeedsConnector
    except ImportError:
        # Try relative import path
        try:
            import sys
            sys.path.insert(0, str(ROOT / "backend"))
            from connectors.regional_finance import RegionalFinanceConnector  # type: ignore
            from connectors.trade_logistics import TradeLogisticsConnector  # type: ignore
            from connectors.policy_feeds import PolicyFeedsConnector  # type: ignore
        except ImportError as e:
            results["errors"].append(f"Import failed: {e}")
            _save_status(results)
            return results

    connector_map = {
        "regional_finance": RegionalFinanceConnector,
        "trade_logistics": TradeLogisticsConnector,
        "policy_feeds": PolicyFeedsConnector,
    }

    for name in connector_names:
        cls = connector_map.get(name)
        if not cls:
            results["errors"].append(f"Unknown connector: {name}")
            continue
        try:
            conn = cls()
            result = conn.sync_all()
            results["connectors"][name] = {
                "status": "ok",
                "result": result,
            }
        except Exception as e:
            logger.exception(f"Connector sync failed: {name}")
            results["connectors"][name] = {"status": "error", "error": str(e)}
            results["errors"].append(f"{name}: {e}")

    _save_status(results)
    return results


def _get_last_sync_info(connector_name: str) -> dict:
    """Get last sync info for a specific connector from cache files."""
    cache_dirs = {
        "regional_finance": EXTERNAL_DIR / "cbsl",
        "trade_logistics": EXTERNAL_DIR / "trade",
        "policy_feeds": EXTERNAL_DIR / "lki",
    }
    cache_dir = cache_dirs.get(connector_name, EXTERNAL_DIR)
    if not cache_dir.exists():
        return {"last_sync": None, "file_count": 0}

    files = list(cache_dir.glob("*.json"))
    if not files:
        return {"last_sync": None, "file_count": 0}

    latest = max(files, key=lambda f: f.stat().st_mtime)
    return {
        "last_sync": datetime.fromtimestamp(latest.stat().st_mtime, tz=timezone.utc).isoformat(),
        "file_count": len(files),
    }


@router.get("/status")
async def get_connector_status():
    """Return connector health, last sync times, and error logs."""
    saved = _load_status()
    connectors = ["regional_finance", "trade_logistics", "policy_feeds"]
    status = {}
    for name in connectors:
        sync_info = _get_last_sync_info(name)
        prior = saved.get("connectors", {}).get(name, {})
        status[name] = {
            "last_sync": sync_info["last_sync"],
            "file_count": sync_info["file_count"],
            "last_status": prior.get("status", "unknown"),
            "last_error": prior.get("error"),
        }
    return {
        "synced_at": saved.get("synced_at"),
        "connectors": status,
        "errors": saved.get("errors", []),
    }


@router.post("/sync")
async def trigger_sync(request: SyncRequest, background_tasks: BackgroundTasks):
    """Trigger manual sync for selected connectors."""
    for name in request.connectors:
        if name not in ["regional_finance", "trade_logistics", "policy_feeds"]:
            raise HTTPException(status_code=400, detail=f"Unknown connector: {name}")
    background_tasks.add_task(_run_sync, request.connectors)
    return {
        "status": "queued",
        "connectors": request.connectors,
        "message": "Sync queued as background task.",
    }
