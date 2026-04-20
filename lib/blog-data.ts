// MALINDRA PHASE 1
// lib/blog-data.ts
// Build-time data source: reads ONLY from local content/ directory via gray-matter.
// Zero network dependencies. Fully offline-capable static generation.
//
// IMPORTANT: This runs only at build time (Node.js context).
// Never import this in client components.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArticleMeta {
  slug: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  tags: string[];
  entities: string[];
  readingMinutes: number;
}

export interface ArticleContent extends ArticleMeta {
  rawMarkdown: string;
}

export interface BlogData {
  articles: ArticleMeta[];
  metadata: {
    totalCount: number;
    categories: string[];
    lastBuilt: string;
  };
}

// ── Config ───────────────────────────────────────────────────────────────────

const CONTENT_ROOT = path.join(process.cwd(), 'content');

// ── Module-level cache (populated once per build process) ─────────────────────
let _articlesCache: ArticleMeta[] | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTitle(content: string, slug: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractExcerpt(content: string): string {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('|'));
  return lines.slice(0, 3).join(' ').slice(0, 220);
}

function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function inferDate(filePath: string): string {
  try {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ── Local filesystem reader (primary data source) ────────────────────────────

function readArticlesFromFS(): ArticleMeta[] {
  if (_articlesCache !== null) return _articlesCache;
  if (!fs.existsSync(CONTENT_ROOT)) return [];

  const result: ArticleMeta[] = [];

  for (const category of fs.readdirSync(CONTENT_ROOT)) {
    const catDir = path.join(CONTENT_ROOT, category);
    if (!fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs.readdirSync(catDir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace(/\.md$/, '');
      const filePath = path.join(catDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);

      result.push({
        slug,
        category,
        title: (data.title as string) || extractTitle(content, slug),
        description: (data.description as string) || extractExcerpt(content),
        excerpt: (data.excerpt as string) || extractExcerpt(content).slice(0, 220),
        date: (data.date as string) || inferDate(filePath),
        tags: (data.tags as string[]) || [],
        entities: (data.entities as string[]) || [],
        readingMinutes: estimateReadingTime(content),
      });
    }
  }

  _articlesCache = result.sort((a, b) => (a.date < b.date ? 1 : -1));
  return _articlesCache;
}

function readArticleFromFS(slug: string): ArticleContent | null {
  if (!fs.existsSync(CONTENT_ROOT)) return null;

  for (const category of fs.readdirSync(CONTENT_ROOT)) {
    const filePath = path.join(CONTENT_ROOT, category, `${slug}.md`);
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    return {
      slug,
      category,
      title: (data.title as string) || extractTitle(content, slug),
      description: (data.description as string) || extractExcerpt(content),
      excerpt: (data.excerpt as string) || extractExcerpt(content).slice(0, 220),
      date: (data.date as string) || inferDate(filePath),
      tags: (data.tags as string[]) || [],
      entities: (data.entities as string[]) || [],
      readingMinutes: estimateReadingTime(content),
      rawMarkdown: raw,
    };
  }

  return null;
}

// ── Public API (filesystem-only, zero network calls) ──────────────────────────

/**
 * Get all article metadata for index / archive pages.
 * Reads exclusively from the local content/ directory.
 */
export async function getBlogData(): Promise<BlogData> {
  const articles = readArticlesFromFS();
  return {
    articles,
    metadata: {
      totalCount: articles.length,
      categories: [...new Set(articles.map((a) => a.category))].sort(),
      lastBuilt: new Date().toISOString(),
    },
  };
}

/**
 * Get all article slugs — used by generateStaticParams.
 */
export async function getAllSlugs(): Promise<string[]> {
  const { articles } = await getBlogData();
  return articles.map((a) => a.slug);
}

/**
 * Get full article content (metadata + raw markdown).
 * Reads directly from the filesystem.
 */
export async function getArticleContent(slug: string): Promise<ArticleContent | null> {
  return readArticleFromFS(slug);
}

/**
 * Get articles filtered by tag.
 */
export async function getArticlesByTag(tag: string): Promise<ArticleMeta[]> {
  const { articles } = await getBlogData();
  return articles.filter((a) => a.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
}

/**
 * Get featured article (most recent with a 'featured' tag or just first).
 */
export async function getFeaturedArticle(): Promise<ArticleMeta | null> {
  const { articles } = await getBlogData();
  return articles.find((a) => a.tags.includes('featured')) ?? articles[0] ?? null;
}

// ── Phase 2: Enriched data ────────────────────────────────────────────────────

export interface EnrichedData {
  slug: string;
  category: string;
  generatedAt: string;
  sources: Array<{
    source: string;
    label: string;
    url: string;
    tags: string[];
    fetchedAt: string;
    available: boolean;
  }>;
  dataPoints: unknown[];
}

/**
 * Get build-time enrichment data for a slug.
 * Reads from ./data/enriched/[slug].json if available.
 * Returns null gracefully if enrichment has not been run.
 */
export function getEnrichedData(slug: string): EnrichedData | null {
  const enrichedPath = path.join(process.cwd(), 'data', 'enriched', `${slug}.json`);
  if (!fs.existsSync(enrichedPath)) return null;
  try {
    const raw = fs.readFileSync(enrichedPath, 'utf-8');
    return JSON.parse(raw) as EnrichedData;
  } catch {
    return null;
  }
}

/**
 * Get article with enrichment merged in.
 */
export async function getArticleWithEnrichment(
  slug: string,
): Promise<(ArticleContent & { enriched: EnrichedData | null }) | null> {
  const article = await getArticleContent(slug);
  if (!article) return null;
  const enriched = getEnrichedData(slug);
  return { ...article, enriched };
}
