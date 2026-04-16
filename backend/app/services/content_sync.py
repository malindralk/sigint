"""Content synchronization service.

Reads markdown files from the git submodule content directory,
parses metadata, and syncs to the database.
"""

import re
from pathlib import Path
from typing import Any

import frontmatter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.article import Article

settings = get_settings()


def parse_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    """Parse YAML frontmatter from markdown content.

    Returns (frontmatter_dict, remaining_content).
    """
    try:
        post = frontmatter.loads(content)
        return dict(post.metadata), post.content.strip()
    except Exception:
        return {}, content


def extract_title(content: str, filename: str) -> str:
    """Extract title from first H1 or generate from filename."""
    h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if h1_match:
        return h1_match.group(1).strip()

    # Generate from filename
    return filename.replace("-", " ").replace("_", " ").title()


def extract_description(content: str, max_length: int = 300) -> str:
    """Extract description from first non-header paragraph."""
    lines = content.split("\n")
    text_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            continue
        if stripped.startswith("|") or stripped.startswith("!"):
            continue
        text_lines.append(stripped)
        if len(" ".join(text_lines)) >= max_length:
            break

    desc = " ".join(text_lines)
    return desc[:max_length].rstrip() if desc else ""


def chunk_text(content: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks for embedding.

    Respects sentence boundaries where possible.
    """
    # Split by paragraphs first
    paragraphs = re.split(r"\n\n+", content)
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{para}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


class ContentSyncService:
    """Service to sync content from git submodule to database."""

    def __init__(self, db: AsyncSession, content_path: Path | None = None):
        self.db = db
        self.content_path = content_path or settings.content_path

    async def get_existing_articles(self) -> dict[str, Article]:
        """Get all existing articles indexed by slug."""
        result = await self.db.execute(select(Article))
        articles = result.scalars().all()
        return {a.slug: a for a in articles}

    def scan_content_directory(self) -> list[dict[str, Any]]:
        """Scan content directory and return file metadata."""
        files = []

        if not self.content_path.exists():
            raise FileNotFoundError(f"Content path not found: {self.content_path}")

        for category_dir in self.content_path.iterdir():
            if not category_dir.is_dir():
                continue
            if category_dir.name.startswith("."):
                continue

            category = category_dir.name

            for md_file in category_dir.glob("*.md"):
                files.append({
                    "path": md_file,
                    "category": category,
                    "slug": md_file.stem,
                    "filename": md_file.name,
                })

        return files

    async def sync_article(
        self,
        file_info: dict[str, Any],
        existing: dict[str, Article],
    ) -> Article:
        """Sync a single article file to database."""
        path: Path = file_info["path"]
        slug = file_info["slug"]
        category = file_info["category"]

        content = path.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(content)

        title = frontmatter.get("title") or extract_title(body, file_info["filename"])
        description = frontmatter.get("description") or extract_description(body)
        order = frontmatter.get("order", 0)

        metadata = {
            "order": order,
            "tags": frontmatter.get("tags", []),
            **{k: v for k, v in frontmatter.items() if k not in ("title", "description", "order")},
        }

        if slug in existing:
            article = existing[slug]
            article.category = category
            article.title = title
            article.description = description
            article.content = body
            article.metadata = metadata
            article.file_path = str(path.relative_to(self.content_path.parent))
        else:
            article = Article(
                slug=slug,
                category=category,
                title=title,
                description=description,
                content=body,
                metadata=metadata,
                file_path=str(path.relative_to(self.content_path.parent)),
            )
            self.db.add(article)

        return article

    async def sync_all(self) -> dict[str, int]:
        """Sync all content files to database.

        Returns stats: {"created": n, "updated": n, "unchanged": n}
        """
        existing = await self.get_existing_articles()
        files = self.scan_content_directory()

        stats = {"created": 0, "updated": 0, "unchanged": 0}
        seen_slugs = set()

        for file_info in files:
            slug = file_info["slug"]
            seen_slugs.add(slug)

            was_new = slug not in existing
            await self.sync_article(file_info, existing)

            if was_new:
                stats["created"] += 1
            else:
                stats["updated"] += 1

        # Mark articles not found on disk as potentially deleted
        # (We don't auto-delete, let admin handle that)
        missing = set(existing.keys()) - seen_slugs
        stats["missing"] = len(missing)

        await self.db.flush()
        return stats

    async def get_article_by_slug(self, slug: str) -> Article | None:
        """Get article by slug."""
        result = await self.db.execute(
            select(Article).where(Article.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_articles_by_category(self, category: str) -> list[Article]:
        """Get all articles in a category."""
        result = await self.db.execute(
            select(Article)
            .where(Article.category == category)
            .order_by(Article.metadata["order"].asc())
        )
        return list(result.scalars().all())
