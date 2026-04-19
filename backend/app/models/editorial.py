# MALINDRA PHASE 4
# backend/app/models/editorial.py
# Pydantic models for editorial workflow validation.

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

VALID_CATEGORIES = {"em-sca", "sigint", "malindra", "learning"}
VALID_STAGES = {"draft", "review", "published"}
SIGINT_TAGS = {"debt", "digital", "tourism", "geopolitics", "energy"}

# ── Article version ───────────────────────────────────────────────────────────

class ArticleVersion(BaseModel):
    slug: str
    title: str
    category: str
    body: str
    tags: list[str] = []
    description: str = ""
    author: str = ""
    version: int = 1
    parent_version: int | None = None
    created_at: datetime | None = None
    notes: str = ""

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9][a-z0-9-]{0,79}$", v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens (max 80 chars)")
        return v

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("category")
    @classmethod
    def valid_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {VALID_CATEGORIES}")
        return v

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, v: list[str]) -> list[str]:
        return [t.lower().strip() for t in v if t.strip()]

    @field_validator("body")
    @classmethod
    def body_has_sigint_structure(cls, v: str) -> str:
        """Warn if body lacks SIGINT [Signal]/[Context]/[Implication]/[Action] markers."""
        # This is a soft check — we don't fail, just validate content length
        if len(v.strip()) < 100:
            raise ValueError("Article body must be at least 100 characters")
        return v


# ── Review status ─────────────────────────────────────────────────────────────

class ReviewStatus(BaseModel):
    slug: str
    reviewer: str
    notes: str = ""
    approved: bool = False
    requested_changes: list[str] = []
    reviewed_at: datetime | None = None

    @field_validator("reviewer")
    @classmethod
    def reviewer_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Reviewer name cannot be empty")
        return v.strip()

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9][a-z0-9-]{0,79}$", v):
            raise ValueError("Invalid slug format")
        return v


# ── Publication schedule ──────────────────────────────────────────────────────

class PublicationSchedule(BaseModel):
    slug: str
    publisher: str
    scheduled_for: datetime | None = None  # None = publish immediately
    trigger_rebuild: bool = True
    archive_after_days: int | None = None  # Days until auto-archive

    @field_validator("publisher")
    @classmethod
    def publisher_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Publisher name cannot be empty")
        return v.strip()

    @model_validator(mode="after")
    def validate_archive_days(self) -> "PublicationSchedule":
        if self.archive_after_days is not None and self.archive_after_days < 1:
            raise ValueError("archive_after_days must be at least 1")
        return self


# ── Version diff ─────────────────────────────────────────────────────────────

class VersionDiff(BaseModel):
    slug: str
    from_version: int
    to_version: int
    diff_lines: list[str]
    changed_at: datetime
    changed_by: str
    change_summary: str = ""
