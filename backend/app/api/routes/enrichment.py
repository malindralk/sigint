"""
Enrichment endpoints for build-time data enrichment pipeline.
MALINDRA PHASE 2

Provides source listing and manual trigger endpoint for editorial use.
Enrichment execution happens via scripts/enrich-data.mjs at build time.
"""

import json
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/enrichment", tags=["enrichment"])

DATA_EXTERNAL = Path(__file__).parents[4] / "data" / "external"
DATA_ENRICHED = Path(__file__).parents[4] / "data" / "enriched"

SOURCES = [
    {
        "name": "cbsl",
        "label": "Central Bank of Sri Lanka",
        "url": "https://www.cbsl.gov.lk/en/statistics/external-sector-statistics",
        "tags": ["Debt Restructuring", "Finance", "Sri Lanka"],
    },
    {
        "name": "cse",
        "label": "Colombo Stock Exchange",
        "url": "https://www.cse.lk/pages/market-data/market-data.component.html",
        "tags": ["Finance", "Sri Lanka"],
    },
    {
        "name": "sltda",
        "label": "Sri Lanka Tourism Development Authority",
        "url": "https://www.sltda.lk/en/statistics",
        "tags": ["Tourism", "Sri Lanka"],
    },
    {
        "name": "lki",
        "label": "Lakshman Kadirgamar Institute",
        "url": "https://www.lki.lk/publications/",
        "tags": ["Geopolitics", "Indian Ocean"],
    },
]


def _latest_cache(source_name: str) -> dict | None:
    """Return the latest cached fetch record for a source."""
    source_dir = DATA_EXTERNAL / source_name
    if not source_dir.exists():
        return None
    files = sorted(source_dir.glob("*.json"), reverse=True)
    if not files:
        return None
    try:
        return json.loads(files[0].read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


@router.get("/sources")
def list_sources() -> dict:
    """
    Return all configured enrichment sources with their cache status.
    """
    result = []
    for source in SOURCES:
        cache = _latest_cache(source["name"])
        result.append(
            {
                **source,
                "cached": cache is not None,
                "lastFetched": cache.get("fetchedAt") if cache else None,
                "available": cache.get("data", {}).get("available", False) if cache else False,
            }
        )
    return {"sources": result, "total": len(result)}


@router.get("/article/{slug}")
def get_article_enrichment(slug: str) -> dict:
    """
    Return the enrichment stub for a specific article slug.
    Returns 404 if not found — enrichment is optional at build time.
    """
    enriched_path = DATA_ENRICHED / f"{slug}.json"
    if not enriched_path.exists():
        raise HTTPException(status_code=404, detail=f"No enrichment found for '{slug}'")
    try:
        return json.loads(enriched_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise HTTPException(status_code=500, detail="Failed to read enrichment data") from exc


@router.post("/trigger")
def trigger_enrichment() -> dict:
    """
    Manual trigger endpoint for editorial use.
    Logs a queued signal; actual execution runs via scripts/enrich-data.mjs.
    In production: wire to a task queue (Celery/RQ) to run the script.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Enrichment trigger requested at %s", datetime.now(tz=timezone.utc).isoformat())

    return {
        "status": "queued",
        "message": "Run `node scripts/enrich-data.mjs` to execute enrichment.",
        "triggeredAt": datetime.now(tz=timezone.utc).isoformat(),
    }
