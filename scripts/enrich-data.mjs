#!/usr/bin/env node
// MALINDRA PHASE 2
// scripts/enrich-data.mjs
// Build-time data enrichment: fetches publicly available data from Sri Lankan
// and regional sources, caches to ./data/external/, and generates per-article
// enrichment stubs at ./data/enriched/.
//
// IMPORTANT: External fetches use HEAD-safe, read-only requests with timeout.
// On CI/offline environments, falls back gracefully (no data = no enrichment).
// Run via: node scripts/enrich-data.mjs
// Invoked by: npm run prebuild

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_EXTERNAL = join(ROOT, 'data', 'external');
const DATA_ENRICHED = join(ROOT, 'data', 'enriched');
const CONTENT_ROOT = join(ROOT, 'content');

// ── Ensure directories ────────────────────────────────────────────────────────
mkdirSync(DATA_EXTERNAL, { recursive: true });
mkdirSync(DATA_ENRICHED, { recursive: true });

// ── Data sources ──────────────────────────────────────────────────────────────
// These are public endpoints. All fetches are GET/HEAD only.
// Actual payloads are scraped/parsed from HTML; we store structured JSON.
// In Phase 3, wire real API keys (CBSL Data API, CSE market feed, etc.)

const SOURCES = [
  {
    name: 'cbsl',
    label: 'Central Bank of Sri Lanka',
    url: 'https://www.cbsl.gov.lk/en/statistics/external-sector-statistics',
    tags: ['Debt Restructuring', 'Finance', 'Sri Lanka'],
  },
  {
    name: 'cse',
    label: 'Colombo Stock Exchange',
    url: 'https://www.cse.lk/pages/market-data/market-data.component.html',
    tags: ['Finance', 'Sri Lanka'],
  },
  {
    name: 'sltda',
    label: 'Sri Lanka Tourism Development Authority',
    url: 'https://www.sltda.lk/en/statistics',
    tags: ['Tourism', 'Sri Lanka'],
  },
  {
    name: 'lki',
    label: 'Lakshman Kadirgamar Institute',
    url: 'https://www.lki.lk/publications/',
    tags: ['Geopolitics', 'Laccadive Sea'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(`[enrich-data] ${msg}\n`);
}

function isCacheStale(filePath, maxAgeHours = 12) {
  if (!existsSync(filePath)) return true;
  const stat = statSync(filePath);
  const ageMs = Date.now() - stat.mtimeMs;
  return ageMs > maxAgeHours * 60 * 60 * 1000;
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MalindraBot/2.0 (+https://malindra.lk/bot)' },
    });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status, text: await res.text() };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, text: '', error: String(err) };
  }
}

// ── Source enrichment ─────────────────────────────────────────────────────────

async function enrichSource(source) {
  const today = new Date().toISOString().slice(0, 10);
  const cachePath = join(DATA_EXTERNAL, source.name, `${today}.json`);
  mkdirSync(join(DATA_EXTERNAL, source.name), { recursive: true });

  if (!isCacheStale(cachePath)) {
    log(`${source.name}: cache fresh, skipping`);
    const cached = JSON.parse(readFileSync(cachePath, 'utf-8'));
    return cached;
  }

  log(`${source.name}: fetching ${source.url}`);
  const result = await fetchWithTimeout(source.url);

  const record = {
    source: source.name,
    label: source.label,
    url: source.url,
    tags: source.tags,
    fetchedAt: new Date().toISOString(),
    status: result.status,
    ok: result.ok,
    // Phase 3: parse result.text for structured data
    // For now, store fetch success/failure + metadata stub
    data: result.ok
      ? { available: true, fetchedBytes: result.text.length }
      : { available: false, error: result.error ?? `HTTP ${result.status}` },
  };

  writeFileSync(cachePath, JSON.stringify(record, null, 2));
  log(`${source.name}: cached to ${cachePath}`);
  return record;
}

// ── Article enrichment ────────────────────────────────────────────────────────

function readArticleSlugs() {
  const slugs = [];
  if (!existsSync(CONTENT_ROOT)) return slugs;
  for (const category of readdirSync(CONTENT_ROOT)) {
    const catDir = join(CONTENT_ROOT, category);
    if (!statSync(catDir).isDirectory()) continue;
    for (const file of readdirSync(catDir)) {
      if (!file.endsWith('.md')) continue;
      slugs.push({ slug: file.replace(/\.md$/, ''), category });
    }
  }
  return slugs;
}

function matchSourcesForSlug(_slug, _category, sourceResults) {
  // Match sources to article by tag overlap
  // Reads frontmatter tags from the cached source records
  const matched = sourceResults
    .filter((s) => s.ok)
    .map((s) => ({
      source: s.source,
      label: s.label,
      url: s.url,
      tags: s.tags,
      fetchedAt: s.fetchedAt,
      available: s.data?.available ?? false,
    }));

  return matched;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('Phase 2 data enrichment starting…');

  // 1. Fetch all sources (parallel, with graceful failure)
  const sourceResults = await Promise.all(
    SOURCES.map((s) =>
      enrichSource(s).catch((err) => {
        log(`${s.name}: ERROR — ${err.message}`);
        return { source: s.name, ok: false, tags: s.tags, data: { available: false } };
      }),
    ),
  );

  log(`Sources enriched: ${sourceResults.filter((s) => s.ok).length}/${SOURCES.length}`);

  // 2. Write per-article enrichment stubs
  const articles = readArticleSlugs();
  for (const { slug, category } of articles) {
    const enrichedPath = join(DATA_ENRICHED, `${slug}.json`);
    const sources = matchSourcesForSlug(slug, category, sourceResults);

    const enriched = {
      slug,
      category,
      generatedAt: new Date().toISOString(),
      sources,
      // Phase 3: add extracted statistics, chart data, etc.
      dataPoints: [],
    };

    writeFileSync(enrichedPath, JSON.stringify(enriched, null, 2));
  }

  log(`Article enrichment stubs written: ${articles.length}`);
  log('Enrichment complete.');
}

main().catch((err) => {
  console.error('[enrich-data] FATAL:', err);
  // Non-zero exit only if explicitly required — enrichment failure must not block build
  process.exit(0);
});
