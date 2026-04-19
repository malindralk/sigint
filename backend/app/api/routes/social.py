"""
FastAPI social content packages route.
MALINDRA PHASE 3

GET  /api/social/packages            — list available packages per article
POST /api/social/request             — trigger async package generation (queue-ready)
GET  /api/social/packages/{slug}     — manifest for a specific article
"""

import json
import logging
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/social", tags=["social"])
logger = logging.getLogger(__name__)

SOCIAL_DIR = Path("public/social")
CONTENT_DIR = Path("content")


def _read_manifest(slug: str) -> dict[str, Any] | None:
    path = SOCIAL_DIR / slug / "manifest.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


class PackageRequestBody(BaseModel):
    slug: str
    regenerate: bool = False
    formats: Optional[list[str]] = None  # ["thread", "carousel", "brief"]


class PackageRequestResponse(BaseModel):
    status: str
    slug: str
    queued: bool
    message: str


async def _generate_package(slug: str) -> None:
    """Background task: run generate-social-assets for a single slug."""
    import asyncio
    import os
    logger.info("Background social package generation for: %s", slug)
    try:
        proc = await asyncio.create_subprocess_exec(
            "node",
            "scripts/generate-social-assets.mjs",
            env={**os.environ, "SOCIAL_SLUG_FILTER": slug},
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        if proc.returncode != 0:
            logger.warning("Social generation failed for %s: %s", slug, stderr.decode())
        else:
            logger.info("Social generation complete for %s", slug)
    except asyncio.TimeoutError:
        logger.error("Social generation timed out for %s", slug)
    except Exception as e:
        logger.error("Social generation error for %s: %s", slug, e)


@router.get("/packages")
async def list_packages() -> dict[str, Any]:
    """Return all available social packages with manifest data."""
    index_path = SOCIAL_DIR / "index.json"
    if index_path.exists():
        try:
            return json.loads(index_path.read_text())
        except Exception:
            pass

    # Build on-the-fly from existing manifest files
    packages = []
    if SOCIAL_DIR.exists():
        for slug_dir in sorted(SOCIAL_DIR.iterdir()):
            if not slug_dir.is_dir():
                continue
            manifest = _read_manifest(slug_dir.name)
            if manifest:
                packages.append({
                    "slug": slug_dir.name,
                    "title": manifest.get("title", slug_dir.name),
                    "date": manifest.get("date", ""),
                    "hasCarousel": manifest.get("assets", {}).get("carousel") is not None,
                })

    return {"packages": packages, "generatedAt": None, "count": len(packages)}


@router.get("/packages/{slug}")
async def get_package(slug: str) -> dict[str, Any]:
    """Return manifest for a specific article's social package."""
    manifest = _read_manifest(slug)
    if not manifest:
        raise HTTPException(status_code=404, detail=f"No social package found for slug: {slug}")
    return manifest


@router.post("/request", response_model=PackageRequestResponse)
async def request_package(
    body: PackageRequestBody,
    background_tasks: BackgroundTasks,
) -> PackageRequestResponse:
    """
    Trigger async generation of social package for a slug.
    If package already exists and regenerate=False, returns existing status.
    """
    existing = _read_manifest(body.slug)
    if existing and not body.regenerate:
        return PackageRequestResponse(
            status="exists",
            slug=body.slug,
            queued=False,
            message="Package already generated. Pass regenerate=true to force rebuild.",
        )

    background_tasks.add_task(_generate_package, body.slug)
    return PackageRequestResponse(
        status="queued",
        slug=body.slug,
        queued=True,
        message="Social package generation queued. Check /api/social/packages/{slug} for status.",
    )
