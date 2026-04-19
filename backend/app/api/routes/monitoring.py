# MALINDRA PHASE 4
# backend/app/api/routes/monitoring.py
# System health, build version, error rate reporting.
# POST /api/monitoring/health  → system status + build version
# GET  /api/monitoring/health  → same (GET-friendly for uptime checkers)
# GET  /api/monitoring/metrics → aggregate error rates, build info

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

ROOT = Path(__file__).parent.parent.parent.parent.parent
BUILD_INFO_PATH = ROOT / "data" / "build-logs" / "build-log.json"
ANALYTICS_FILE = ROOT / "data" / "analytics" / "events.jsonl"
ERROR_LOG_FILE = ROOT / "data" / "audit" / "access.log"

MONITOR_TOKEN = os.environ.get("MONITOR_TOKEN", "")


def _load_build_info() -> dict:
    if BUILD_INFO_PATH.exists():
        try:
            entries = json.loads(BUILD_INFO_PATH.read_text(encoding="utf-8"))
            if isinstance(entries, list) and entries:
                return entries[-1]
            if isinstance(entries, dict):
                return entries
        except Exception:
            pass
    return {}


def _count_analytics_events() -> int:
    if not ANALYTICS_FILE.exists():
        return 0
    try:
        return sum(1 for line in ANALYTICS_FILE.open(encoding="utf-8") if line.strip())
    except Exception:
        return 0


def _count_errors() -> int:
    if not ERROR_LOG_FILE.exists():
        return 0
    try:
        count = 0
        with ERROR_LOG_FILE.open(encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    if entry.get("status", 200) >= 400:
                        count += 1
                except Exception:
                    pass
        return count
    except Exception:
        return 0


def _get_data_dir_stats() -> dict:
    stats = {}
    subdirs = ["enriched", "predictions", "analytics", "leads", "engagement", "enterprise"]
    for d in subdirs:
        p = ROOT / "data" / d
        if p.exists():
            stats[d] = len(list(p.glob("*.json")))
        else:
            stats[d] = 0
    return stats


@router.get("/health")
@router.post("/health")
async def health_check(x_monitor_token: str = Header(default="")):
    """Return system health status. Compatible with UptimeRobot/Better Uptime."""
    build_info = _load_build_info()
    data_stats = _get_data_dir_stats()

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "build": {
            "last_action": build_info.get("action"),
            "last_slug": build_info.get("slug"),
            "last_timestamp": build_info.get("timestamp"),
            "rebuild_status": build_info.get("rebuild_status", "unknown"),
        },
        "data": data_stats,
    }


@router.get("/metrics")
async def get_metrics(x_monitor_token: str = Header(default="")):
    """Return aggregate metrics. Requires MONITOR_TOKEN header for full data."""
    if MONITOR_TOKEN and x_monitor_token != MONITOR_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid monitor token")

    total_events = _count_analytics_events()
    total_errors = _count_errors()

    data_stats = _get_data_dir_stats()
    build_info = _load_build_info()

    # Social package count
    social_dir = ROOT / "public" / "social"
    social_count = len([d for d in social_dir.iterdir() if d.is_dir()]) if social_dir.exists() else 0

    # Chart count
    charts_dir = ROOT / "public" / "charts"
    chart_count = len(list(charts_dir.glob("*.svg"))) if charts_dir.exists() else 0

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "analytics": {
            "total_events": total_events,
        },
        "errors": {
            "total_4xx_5xx": total_errors,
        },
        "assets": {
            "social_packages": social_count,
            "svg_charts": chart_count,
            "predictions": data_stats.get("predictions", 0),
            "enriched_articles": data_stats.get("enriched", 0),
        },
        "build": {
            "last_action": build_info.get("action"),
            "last_timestamp": build_info.get("timestamp"),
        },
    }
