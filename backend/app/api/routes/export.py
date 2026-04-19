"""
Export endpoints for Next.js static build-time data fetching.
MALINDRA PHASE 1

These routes are called at build time by Next.js generateStaticParams
and server components. They serve structured JSON and raw markdown
without authentication requirements — public data only.
"""

import re
from pathlib import Path
from datetime import datetime, timezone

import frontmatter  # python-frontmatter
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse

router = APIRouter(prefix="/export", tags=["export"])

# Resolve content directory relative to backend root
CONTENT_ROOT = Path(__file__).parents[4] / "content"

MALINDRA_TAGS = [
    "Debt Restructuring",
    "Digital Policy",
    "Tourism",
    "China-India Triangulation",
    "Renewable Energy",
    "Geopolitics",
    "Indian Ocean",
    "Sri Lanka",
    "Finance",
    "Infrastructure",
]


def _read_article_meta(path: Path, slug: str, category: str) -> dict:
    """Parse frontmatter from a markdown file and return article metadata."""
    raw = path.read_text(encoding="utf-8")
    post = frontmatter.loads(raw)

    title: str = post.metadata.get("title") or _extract_title(post.content, slug)
    description: str = post.metadata.get("description") or _extract_excerpt(post.content)
    date: str = post.metadata.get("date") or _infer_date(path)
    tags: list[str] = post.metadata.get("tags") or []
    excerpt: str = post.metadata.get("excerpt") or description[:220]

    return {
        "slug": slug,
        "category": category,
        "title": title,
        "description": description,
        "excerpt": excerpt,
        "date": date,
        "tags": tags,
        "readingMinutes": _estimate_reading_time(post.content),
    }


def _extract_title(content: str, slug: str) -> str:
    match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return slug.replace("-", " ").title()


def _extract_excerpt(content: str) -> str:
    lines = [l.strip() for l in content.split("\n") if l.strip() and not l.startswith("#")]
    text = " ".join(lines[:3])
    return text[:220]


def _infer_date(path: Path) -> str:
    mtime = path.stat().st_mtime
    return datetime.fromtimestamp(mtime, tz=timezone.utc).strftime("%Y-%m-%d")


def _estimate_reading_time(content: str) -> int:
    words = len(content.split())
    return max(1, round(words / 200))


def _iter_articles():
    """Yield (slug, category, path) for all published markdown files."""
    if not CONTENT_ROOT.exists():
        return
    for category_dir in sorted(CONTENT_ROOT.iterdir()):
        if not category_dir.is_dir():
            continue
        category = category_dir.name
        for md_file in sorted(category_dir.glob("*.md")):
            slug = md_file.stem
            yield slug, category, md_file


@router.get("/blog-data.json")
async def get_blog_data() -> JSONResponse:
    """
    Return structured article index for Next.js build-time consumption.

    Shape:
    {
      "articles": [{ slug, category, title, description, excerpt, date, tags, readingMinutes }],
      "metadata": { totalCount, categories, lastBuilt }
    }
    """
    articles = []
    category_set: set[str] = set()

    for slug, category, path in _iter_articles():
        meta = _read_article_meta(path, slug, category)
        articles.append(meta)
        category_set.add(category)

    articles.sort(key=lambda a: a["date"], reverse=True)

    return JSONResponse(
        content={
            "articles": articles,
            "metadata": {
                "totalCount": len(articles),
                "categories": sorted(category_set),
                "lastBuilt": datetime.now(tz=timezone.utc).isoformat(),
            },
        }
    )


@router.get("/articles/{slug}.md", response_class=PlainTextResponse)
async def get_article_markdown(slug: str) -> PlainTextResponse:
    """
    Return raw markdown + frontmatter for a specific article slug.

    Searched across all category directories. Returns 404 if not found.
    """
    if not re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$", slug):
        raise HTTPException(status_code=400, detail="Invalid slug format")

    for article_slug, _category, path in _iter_articles():
        if article_slug == slug:
            return PlainTextResponse(content=path.read_text(encoding="utf-8"))

    raise HTTPException(status_code=404, detail=f"Article '{slug}' not found")


@router.get("/articles/{category}/{slug}.md", response_class=PlainTextResponse)
async def get_article_markdown_by_category(category: str, slug: str) -> PlainTextResponse:
    """
    Return raw markdown by category + slug.
    """
    if not re.match(r"^[a-z0-9][a-z0-9\-]*$", category):
        raise HTTPException(status_code=400, detail="Invalid category")
    if not re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$", slug):
        raise HTTPException(status_code=400, detail="Invalid slug format")

    path = CONTENT_ROOT / category / f"{slug}.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Article '{category}/{slug}' not found")

    return PlainTextResponse(content=path.read_text(encoding="utf-8"))
