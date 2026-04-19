"""
FastAPI editorial workflow — draft → review → published.
MALINDRA PHASE 3

POST /api/editorial/draft    — save markdown + frontmatter to content/drafts/
POST /api/editorial/review   — move to content/review/ with reviewer metadata
POST /api/editorial/publish  — move to content/published/, trigger rebuild webhook
GET  /api/editorial/list     — list articles in each stage
GET  /api/editorial/content/{stage}/{slug} — read content at stage
"""

import json
import logging
import re
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from app.core.config import get_settings

router = APIRouter(prefix="/editorial", tags=["editorial"])
logger = logging.getLogger(__name__)
settings = get_settings()

CONTENT_BASE = Path("content")
DRAFTS_DIR = CONTENT_BASE / "drafts"
REVIEW_DIR = CONTENT_BASE / "review"
PUBLISHED_DIR = CONTENT_BASE / "published"
BUILD_LOG = Path("data/build-logs/build-log.json")

for d in [DRAFTS_DIR, REVIEW_DIR, PUBLISHED_DIR, BUILD_LOG.parent]:
    d.mkdir(parents=True, exist_ok=True)

Stage = Literal["draft", "review", "published"]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_slug(slug: str) -> str:
    return re.sub(r'[^a-z0-9\-]', '', slug.lower().replace(' ', '-'))[:120]


def _stage_dir(stage: Stage) -> Path:
    return {
        "draft": DRAFTS_DIR,
        "review": REVIEW_DIR,
        "published": PUBLISHED_DIR,
    }[stage]


def _build_frontmatter(meta: dict) -> str:
    lines = ["---"]
    for k, v in meta.items():
        if isinstance(v, list):
            lines.append(f"{k}: [{', '.join(repr(i) for i in v)}]")
        else:
            lines.append(f"{k}: {repr(v)}")
    lines.append("---\n")
    return "\n".join(lines)


def _load_build_log() -> list[dict]:
    if BUILD_LOG.exists():
        try:
            return json.loads(BUILD_LOG.read_text())
        except Exception:
            pass
    return []


def _append_build_log(entry: dict) -> None:
    log = _load_build_log()
    log.append(entry)
    log = log[-200:]  # Keep last 200 entries
    BUILD_LOG.write_text(json.dumps(log, indent=2, default=str))

# ── Models ────────────────────────────────────────────────────────────────────

class DraftRequest(BaseModel):
    slug: str
    title: str
    category: str
    body: str
    tags: Optional[list[str]] = []
    entities: Optional[list[str]] = []
    description: Optional[str] = ""
    author: Optional[str] = "editorial"

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        safe = _safe_slug(v)
        if len(safe) < 1:
            raise ValueError("Slug required")
        return safe

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Content body too short")
        return v


class ReviewRequest(BaseModel):
    slug: str
    reviewer: str
    notes: Optional[str] = ""
    approved: bool = False


class PublishRequest(BaseModel):
    slug: str
    publisher: str
    trigger_rebuild: bool = True


class EditorialResponse(BaseModel):
    status: str
    slug: str
    stage: Stage
    path: str
    message: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/draft", response_model=EditorialResponse)
async def save_draft(body: DraftRequest) -> EditorialResponse:
    """Save or overwrite a draft article."""
    slug = _safe_slug(body.slug)
    meta = {
        "title": body.title,
        "category": body.category,
        "description": body.description or "",
        "tags": body.tags or [],
        "entities": body.entities or [],
        "author": body.author or "editorial",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "status": "draft",
        "draft_id": str(uuid.uuid4())[:8],
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    content = _build_frontmatter(meta) + body.body
    out_path = DRAFTS_DIR / f"{slug}.md"
    out_path.write_text(content, encoding="utf-8")

    logger.info("Draft saved: %s by %s", slug, body.author)
    _append_build_log({
        "action": "draft_saved",
        "slug": slug,
        "author": body.author,
        "timestamp": meta["updatedAt"],
    })

    return EditorialResponse(
        status="saved",
        slug=slug,
        stage="draft",
        path=str(out_path),
        message=f"Draft saved to content/drafts/{slug}.md",
    )


@router.post("/review", response_model=EditorialResponse)
async def submit_for_review(body: ReviewRequest) -> ReviewRequest:
    """Move draft to review stage with reviewer metadata."""
    slug = _safe_slug(body.slug)
    draft_path = DRAFTS_DIR / f"{slug}.md"

    if not draft_path.exists():
        raise HTTPException(status_code=404, detail=f"Draft not found: {slug}")

    content = draft_path.read_text(encoding="utf-8")

    # Inject review metadata into frontmatter
    review_meta = (
        f"\n# Review Metadata\n"
        f"<!-- reviewer: {body.reviewer} -->\n"
        f"<!-- review_notes: {body.notes or ''} -->\n"
        f"<!-- approved: {body.approved} -->\n"
        f"<!-- review_timestamp: {datetime.now(timezone.utc).isoformat()} -->\n"
    )
    content = content.rstrip() + "\n" + review_meta

    review_path = REVIEW_DIR / f"{slug}.md"
    review_path.write_text(content, encoding="utf-8")
    draft_path.unlink(missing_ok=True)

    logger.info("Draft moved to review: %s by %s (approved=%s)", slug, body.reviewer, body.approved)
    _append_build_log({
        "action": "moved_to_review",
        "slug": slug,
        "reviewer": body.reviewer,
        "approved": body.approved,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return EditorialResponse(
        status="in_review",
        slug=slug,
        stage="review",
        path=str(review_path),
        message=f"Moved to content/review/{slug}.md",
    )


@router.post("/publish", response_model=EditorialResponse)
async def publish_article(body: PublishRequest) -> EditorialResponse:
    """Move reviewed article to published and optionally trigger rebuild."""
    slug = _safe_slug(body.slug)
    review_path = REVIEW_DIR / f"{slug}.md"

    if not review_path.exists():
        # Also allow publishing directly from draft (editorial override)
        draft_path = DRAFTS_DIR / f"{slug}.md"
        if draft_path.exists():
            review_path = draft_path
        else:
            raise HTTPException(status_code=404, detail=f"Article not found in review or draft: {slug}")

    content = review_path.read_text(encoding="utf-8")
    published_path = PUBLISHED_DIR / f"{slug}.md"
    published_path.write_text(content, encoding="utf-8")
    review_path.unlink(missing_ok=True)

    ts = datetime.now(timezone.utc).isoformat()
    _append_build_log({
        "action": "published",
        "slug": slug,
        "publisher": body.publisher,
        "timestamp": ts,
        "rebuild_triggered": body.trigger_rebuild,
    })

    rebuild_status = "not_triggered"
    if body.trigger_rebuild:
        rebuild_status = await _trigger_rebuild(slug)

    logger.info("Article published: %s by %s (rebuild=%s)", slug, body.publisher, rebuild_status)

    return EditorialResponse(
        status="published",
        slug=slug,
        stage="published",
        path=str(published_path),
        message=f"Published to content/published/{slug}.md. Rebuild: {rebuild_status}",
    )


@router.get("/list")
async def list_editorial() -> dict[str, Any]:
    """List articles at each editorial stage."""
    def _list_stage(directory: Path) -> list[dict]:
        if not directory.exists():
            return []
        items = []
        for f in sorted(directory.glob("*.md")):
            items.append({
                "slug": f.stem,
                "filename": f.name,
                "size": f.stat().st_size,
                "modifiedAt": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(),
            })
        return items

    return {
        "drafts": _list_stage(DRAFTS_DIR),
        "review": _list_stage(REVIEW_DIR),
        "published": _list_stage(PUBLISHED_DIR),
        "buildLog": _load_build_log()[-10:],
    }


@router.get("/content/{stage}/{slug}")
async def get_content(stage: Stage, slug: str) -> dict[str, Any]:
    """Read content at a specific stage."""
    slug = _safe_slug(slug)
    path = _stage_dir(stage) / f"{slug}.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Not found: {stage}/{slug}")
    content = path.read_text(encoding="utf-8")
    return {
        "slug": slug,
        "stage": stage,
        "content": content,
        "size": len(content),
        "modifiedAt": datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat(),
    }


# ── Rebuild trigger ───────────────────────────────────────────────────────────

async def _trigger_rebuild(slug: str) -> str:
    """
    Trigger a rebuild webhook. Reads REBUILD_WEBHOOK_URL from env.
    Supports Vercel, Cloudflare Pages, or GitHub Actions dispatch.
    """
    import os
    import httpx

    webhook_url = os.environ.get("REBUILD_WEBHOOK_URL", "")
    if not webhook_url:
        return "no_webhook_configured"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(webhook_url, json={
                "ref": "main",
                "event_type": "content_published",
                "client_payload": {"slug": slug},
            })
            if resp.status_code in (200, 201, 204):
                return "triggered"
            return f"webhook_error:{resp.status_code}"
    except Exception as e:
        logger.warning("Rebuild webhook failed: %s", e)
        return f"webhook_exception:{type(e).__name__}"
