# MALINDRA PHASE 4
# backend/app/api/routes/ai.py
# FastAPI routes for AI-assisted signal synthesis & predictions.
# GET  /api/ai/predictions      → pre-computed scenario JSON index
# GET  /api/ai/predictions/{slug} → single article prediction
# POST /api/ai/trigger          → queues synthesis via BackgroundTasks

import json
import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])

ROOT = Path(__file__).parent.parent.parent.parent.parent  # backend/../
PREDICTIONS_DIR = ROOT / "data" / "predictions"


class TriggerRequest(BaseModel):
    slug: str | None = None
    force: bool = False


def _run_synthesis():
    """Execute ai-synthesis.py as subprocess."""
    script = ROOT / "scripts" / "ai-synthesis.py"
    if not script.exists():
        return
    try:
        subprocess.run(
            [sys.executable, str(script)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=120,
        )
    except Exception:
        pass


@router.get("/predictions")
async def list_predictions():
    """Return index of all pre-computed predictions."""
    index_path = PREDICTIONS_DIR / "index.json"
    if not index_path.exists():
        return {
            "model_version": "v1.0",
            "total": 0,
            "entries": [],
            "generated_at": None,
        }
    try:
        return json.loads(index_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read predictions index: {e}")


@router.get("/predictions/{slug}")
async def get_prediction(slug: str):
    """Return pre-computed prediction for a single article."""
    pred_path = PREDICTIONS_DIR / f"{slug}.json"
    if not pred_path.exists():
        raise HTTPException(status_code=404, detail=f"No prediction found for slug: {slug}")
    try:
        return json.loads(pred_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read prediction: {e}")


@router.post("/trigger")
async def trigger_synthesis(request: TriggerRequest, background_tasks: BackgroundTasks):
    """Queue AI synthesis run via background task."""
    background_tasks.add_task(_run_synthesis)
    return {
        "status": "queued",
        "slug": request.slug,
        "message": "Synthesis queued as background task. Results will be available after completion.",
    }
