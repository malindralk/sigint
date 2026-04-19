#!/usr/bin/env node
// MALINDRA PHASE 2
// scripts/generate-og-images.mjs
// Build-time OpenGraph image generation for all articles.
//
// Uses: satori (JSX → SVG) + @resvg/resvg-js (SVG → PNG)
// Outputs: public/og/[locale]/[slug].png  (1200×630)
// Falls back gracefully if dependencies are not installed.
//
// Locale-aware: generates both /en/ and /si/ variants.
// Sinhala title is sourced from frontmatter field `title_si` if present,
// otherwise falls back to English title.
//
// Run via: node scripts/generate-og-images.mjs
// Invoked by: npm run postbuild

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_ROOT = join(ROOT, 'content');
const OG_OUT_EN = join(ROOT, 'public', 'og', 'en');
const OG_OUT_SI = join(ROOT, 'public', 'og', 'si');

mkdirSync(OG_OUT_EN, { recursive: true });
mkdirSync(OG_OUT_SI, { recursive: true });

function log(msg) {
  process.stdout.write(`[generate-og] ${msg}\n`);
}

// ── Frontmatter parser (minimal — no extra dep required) ──────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, content: raw };

  const yamlBlock = match[1];
  const data = {};
  const lines = yamlBlock.split('\n');

  let currentKey = null;
  let arrayMode = false;
  let arrayValues = [];

  for (const line of lines) {
    const listMatch = line.match(/^ {2}- (.+)$/);
    if (listMatch && arrayMode && currentKey) {
      arrayValues.push(listMatch[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }

    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kvMatch) {
      if (arrayMode && currentKey) {
        data[currentKey] = arrayValues;
        arrayValues = [];
        arrayMode = false;
      }
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '') {
        arrayMode = true;
        arrayValues = [];
      } else {
        data[currentKey] = val.replace(/^["']|["']$/g, '');
        currentKey = null;
      }
    }
  }

  if (arrayMode && currentKey) {
    data[currentKey] = arrayValues;
  }

  return { data, content: raw.slice(match[0].length).trim() };
}

// ── Article discovery ─────────────────────────────────────────────────────────

function readArticles() {
  const articles = [];
  if (!existsSync(CONTENT_ROOT)) return articles;

  for (const category of readdirSync(CONTENT_ROOT)) {
    const catDir = join(CONTENT_ROOT, category);
    if (!statSync(catDir).isDirectory()) continue;
    for (const file of readdirSync(catDir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace(/\.md$/, '');
      const raw = readFileSync(join(catDir, file), 'utf-8');
      const { data } = parseFrontmatter(raw);
      articles.push({ slug, category, data });
    }
  }

  return articles;
}

// ── Satori JSX element builder ────────────────────────────────────────────────
// Uses plain objects (no JSX transform required in .mjs) matching Satori's API.

function buildOgElement({ title, excerpt, locale, tags }) {
  const isSinhala = locale === 'si';
  const fontFamily = isSinhala ? 'Noto Serif Sinhala' : 'Cormorant Garamond';
  const displayTags = (tags ?? []).slice(0, 3);

  return {
    type: 'div',
    props: {
      style: {
        background: '#09090E',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px',
        fontFamily,
        position: 'relative',
      },
      children: [
        // Top accent line
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #922438, #D49628)',
            },
            children: null,
          },
        },
        // Title
        {
          type: 'div',
          props: {
            style: {
              fontSize: isSinhala ? 40 : 48,
              fontWeight: 700,
              color: '#EDE0C4',
              marginBottom: 24,
              lineHeight: 1.1,
              maxWidth: '900px',
            },
            children: title,
          },
        },
        // Excerpt
        {
          type: 'div',
          props: {
            style: {
              fontSize: isSinhala ? 20 : 22,
              color: '#B8A98E',
              marginBottom: 48,
              lineHeight: 1.5,
              maxWidth: '860px',
              fontFamily: 'DM Sans',
            },
            children: (excerpt ?? '').slice(0, 180),
          },
        },
        // Tags row
        {
          type: 'div',
          props: {
            style: { display: 'flex', gap: 12, flexWrap: 'wrap' },
            children: displayTags.map((tag) => ({
              type: 'div',
              props: {
                style: {
                  background: '#1E1620',
                  border: '1px solid rgba(146,36,56,0.5)',
                  color: '#EDE0C4',
                  padding: '6px 16px',
                  borderRadius: 4,
                  fontSize: 14,
                  fontFamily: 'DM Sans',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                },
                children: tag,
              },
            })),
          },
        },
        // Spacer
        { type: 'div', props: { style: { flex: 1 }, children: null } },
        // Footer
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#922438',
                    fontFamily: isSinhala ? 'Noto Serif Sinhala' : 'Cormorant Garamond',
                  },
                  children: 'මලින්ද්‍ර',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: '#6B6254',
                    fontFamily: 'Cormorant Garamond',
                  },
                  children: 'Kotte Kingdom 1412–1467 CE',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ── Font loader ───────────────────────────────────────────────────────────────

async function loadGoogleFont(family, weight = 700) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  try {
    const css = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }).then((r) => r.text());

    const fontUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
    if (!fontUrl) throw new Error(`No font URL found in CSS for ${family}`);

    const fontData = await fetch(fontUrl).then((r) => r.arrayBuffer());
    return fontData;
  } catch (err) {
    log(`Font load failed for ${family}: ${err.message}`);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Check for satori + @resvg/resvg-js
  let satori, Resvg;
  try {
    const satoriMod = await import('satori');
    satori = satoriMod.default ?? satoriMod.satori;
    const resvgMod = await import('@resvg/resvg-js');
    Resvg = resvgMod.Resvg;
  } catch {
    log('WARNING: satori or @resvg/resvg-js not installed.');
    log('Run: pnpm add -D satori @resvg/resvg-js');
    log('Skipping OG image generation — using og-default.png fallback.');
    return;
  }

  const articles = readArticles();
  log(`Generating OG images for ${articles.length} articles × 2 locales…`);

  // Load fonts once
  const [cormorantData, dmSansData, notoSinhalaData] = await Promise.all([
    loadGoogleFont('Cormorant Garamond', 700),
    loadGoogleFont('DM Sans', 400),
    loadGoogleFont('Noto Serif Sinhala', 700),
  ]);

  const fonts = [];
  if (cormorantData) {
    fonts.push({ name: 'Cormorant Garamond', data: cormorantData, weight: 700, style: 'normal' });
  }
  if (dmSansData) {
    fonts.push({ name: 'DM Sans', data: dmSansData, weight: 400, style: 'normal' });
  }
  if (notoSinhalaData) {
    fonts.push({ name: 'Noto Serif Sinhala', data: notoSinhalaData, weight: 700, style: 'normal' });
  }

  if (fonts.length === 0) {
    log('No fonts loaded — skipping OG generation.');
    return;
  }

  let generated = 0;
  let skipped = 0;

  for (const { slug, data } of articles) {
    const enPath = join(OG_OUT_EN, `${slug}.png`);
    const siPath = join(OG_OUT_SI, `${slug}.png`);

    // Skip if already fresh (mtime < 12h)
    const needsRegen = (p) => {
      if (!existsSync(p)) return true;
      return Date.now() - statSync(p).mtimeMs > 12 * 60 * 60 * 1000;
    };

    if (!needsRegen(enPath) && !needsRegen(siPath)) {
      skipped++;
      continue;
    }

    try {
      // EN variant
      if (needsRegen(enPath)) {
        const svgEn = await satori(
          buildOgElement({
            title: data.title ?? slug,
            excerpt: data.excerpt ?? data.description ?? '',
            locale: 'en',
            tags: Array.isArray(data.tags) ? data.tags : [],
          }),
          { width: 1200, height: 630, fonts },
        );
        const pngEn = new Resvg(svgEn, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        writeFileSync(enPath, pngEn);
      }

      // SI variant
      if (needsRegen(siPath)) {
        const svgSi = await satori(
          buildOgElement({
            title: data.title_si ?? data.title ?? slug,
            excerpt: data.excerpt_si ?? data.excerpt ?? data.description ?? '',
            locale: 'si',
            tags: Array.isArray(data.tags) ? data.tags : [],
          }),
          { width: 1200, height: 630, fonts },
        );
        const pngSi = new Resvg(svgSi, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        writeFileSync(siPath, pngSi);
      }

      generated++;
      if (generated % 5 === 0) log(`  ${generated}/${articles.length} generated…`);
    } catch (err) {
      log(`  ERROR for ${slug}: ${err.message}`);
      skipped++;
    }
  }

  log(`Done. Generated: ${generated}, Skipped: ${skipped}`);

  // If out/ exists (postbuild), sync OG images there too
  const OUT_OG_EN = join(ROOT, 'out', 'og', 'en');
  const OUT_OG_SI = join(ROOT, 'out', 'og', 'si');
  if (existsSync(join(ROOT, 'out'))) {
    mkdirSync(OUT_OG_EN, { recursive: true });
    mkdirSync(OUT_OG_SI, { recursive: true });
    // Copy all PNGs from public/og to out/og
    for (const file of readdirSync(OG_OUT_EN)) {
      if (file.endsWith('.png')) {
        const src = join(OG_OUT_EN, file);
        const dst = join(OUT_OG_EN, file);
        const srcBuf = readFileSync(src);
        writeFileSync(dst, srcBuf);
      }
    }
    for (const file of readdirSync(OG_OUT_SI)) {
      if (file.endsWith('.png')) {
        const src = join(OG_OUT_SI, file);
        const dst = join(OUT_OG_SI, file);
        const srcBuf = readFileSync(src);
        writeFileSync(dst, srcBuf);
      }
    }
    log(`Synced OG images to out/og/`);
  }
}

main().catch((err) => {
  console.error('[generate-og] FATAL:', err);
  // Non-zero exit must not block build
  process.exit(0);
});
