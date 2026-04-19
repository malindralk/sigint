"""
FastAPI engagement route: feedback, comments, topic voting.
MALINDRA PHASE 3

POST /api/engagement/feedback    — article feedback (rating + text)
POST /api/engagement/comment     — submit a comment (stored, rendered at next build)
GET  /api/engagement/comments/{slug} — comments for a slug (build-time pull)
POST /api/engagement/vote        — topic vote
GET  /api/engagement/votes       — aggregated votes (build-time cache)
"""

import json
import logging
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator

router = APIRouter(prefix="/engagement", tags=["engagement"])
logger = logging.getLogger(__name__)

DATA_DIR = Path("data/engagement")
VOTES_FILE = Path("data/votes/votes.json")
DATA_DIR.mkdir(parents=True, exist_ok=True)
VOTES_FILE.parent.mkdir(parents=True, exist_ok=True)

VALID_TOPICS = frozenset(["debt", "digital", "tourism", "geopolitics", "energy"])
VALID_RATINGS = frozenset([1, 2, 3, 4, 5])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _sanitize(text: str, max_len: int = 2000) -> str:
    """Strip tags and limit length."""
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()[:max_len]

def _load_json(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            return json.loads(path.read_text())
        except Exception:
            pass
    return default

def _save_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, default=str))

def _get_slug_file(slug: str, kind: str) -> Path:
    safe = re.sub(r'[^a-z0-9\-]', '', slug.lower().replace(' ', '-'))[:80]
    return DATA_DIR / f"{kind}-{safe}.json"

# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    slug: str
    rating: int
    comment: Optional[str] = None
    locale: Optional[str] = "en"

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if v not in VALID_RATINGS:
            raise ValueError("Rating must be 1–5")
        return v

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not re.match(r'^[a-z0-9\-]{1,120}$', v):
            raise ValueError("Invalid slug format")
        return v


class FeedbackResponse(BaseModel):
    status: str
    id: str


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(body: FeedbackRequest, request: Request) -> FeedbackResponse:
    feedback_id = str(uuid.uuid4())[:8]
    path = _get_slug_file(body.slug, "feedback")
    entries = _load_json(path, [])

    entries.append({
        "id": feedback_id,
        "slug": body.slug,
        "rating": body.rating,
        "comment": _sanitize(body.comment or "", 500),
        "locale": body.locale,
        "ip_hash": str(hash(request.client.host))[-6:] if request.client else "anon",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })

    _save_json(path, entries)
    logger.info("Feedback %s for %s: rating=%d", feedback_id, body.slug, body.rating)
    return FeedbackResponse(status="recorded", id=feedback_id)

# ── Comments ──────────────────────────────────────────────────────────────────

class CommentRequest(BaseModel):
    slug: str
    author: str
    body: str
    locale: Optional[str] = "en"

    @field_validator("author")
    @classmethod
    def validate_author(cls, v: str) -> str:
        v = _sanitize(v, 60)
        if len(v) < 1:
            raise ValueError("Author name required")
        return v

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        v = _sanitize(v, 2000)
        if len(v) < 2:
            raise ValueError("Comment body too short")
        return v

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not re.match(r'^[a-z0-9\-]{1,120}$', v):
            raise ValueError("Invalid slug format")
        return v


class CommentResponse(BaseModel):
    status: str
    id: str
    message: str


@router.post("/comment", response_model=CommentResponse)
async def submit_comment(body: CommentRequest) -> CommentResponse:
    comment_id = str(uuid.uuid4())[:8]
    path = _get_slug_file(body.slug, "comments")
    comments = _load_json(path, [])

    comments.append({
        "id": comment_id,
        "slug": body.slug,
        "author": body.author,
        "body": body.body,
        "locale": body.locale,
        "approved": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })

    _save_json(path, comments)
    logger.info("Comment %s for %s by %s", comment_id, body.slug, body.author)
    return CommentResponse(
        status="pending",
        id=comment_id,
        message="Comment received. It will appear after editorial review.",
    )


@router.get("/comments/{slug}")
async def get_comments(slug: str) -> dict[str, Any]:
    """Return approved comments for a slug (used at build time)."""
    if not re.match(r'^[a-z0-9\-]{1,120}$', slug):
        raise HTTPException(status_code=400, detail="Invalid slug")
    path = _get_slug_file(slug, "comments")
    all_comments = _load_json(path, [])
    approved = [c for c in all_comments if c.get("approved", False)]
    return {"slug": slug, "comments": approved, "count": len(approved)}

# ── Topic voting ──────────────────────────────────────────────────────────────

class VoteRequest(BaseModel):
    topics: list[str]
    locale: Optional[str] = "en"

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, v: list[str]) -> list[str]:
        sanitized = [t.lower().strip() for t in v if isinstance(t, str)]
        invalid = [t for t in sanitized if t not in VALID_TOPICS]
        if invalid:
            raise ValueError(f"Invalid topics: {invalid}")
        return sanitized


class VoteResponse(BaseModel):
    status: str
    voted: list[str]
    totals: dict[str, int]


@router.post("/vote", response_model=VoteResponse)
async def submit_vote(body: VoteRequest, request: Request) -> VoteResponse:
    votes = _load_json(VOTES_FILE, {t: 0 for t in VALID_TOPICS})

    for topic in body.topics:
        votes[topic] = votes.get(topic, 0) + 1

    _save_json(VOTES_FILE, votes)
    logger.info("Vote recorded: %s", body.topics)
    return VoteResponse(status="recorded", voted=body.topics, totals=votes)


@router.get("/votes")
async def get_votes() -> dict[str, Any]:
    """Aggregated topic votes — polled at build time to update data/votes/votes.json."""
    votes = _load_json(VOTES_FILE, {t: 0 for t in VALID_TOPICS})
    total = sum(votes.values())
    percentages = {k: round(v / total * 100, 1) if total > 0 else 0 for k, v in votes.items()}
    return {"votes": votes, "percentages": percentages, "total": total}
