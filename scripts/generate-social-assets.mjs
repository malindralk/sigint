#!/usr/bin/env node
// MALINDRA PHASE 3
// scripts/generate-social-assets.mjs
// Build-time social content package generator.
// Reads published articles from ./data/enriched/ + content/
// Generates:
//   public/social/[slug]/thread.html   — Twitter/X thread (character-count validated)
//   public/social/[slug]/carousel.png  — LinkedIn carousel (1080x1080) via satori + @resvg
//   public/social/[slug]/manifest.json — package manifest
//
// NOTE: PDF generation requires puppeteer which is not installed by default.
// If ENABLE_PDF=1 env var is set and puppeteer is available, PDFs are generated.
// Otherwise brief.html is generated as a fallback.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_ROOT = join(ROOT, 'content');
const DATA_ENRICHED = join(ROOT, 'data', 'enriched');
const SOCIAL_OUT = join(ROOT, 'public', 'social');

mkdirSync(SOCIAL_OUT, { recursive: true });

// ── Font loading ──────────────────────────────────────────────────────────────

let satori, Resvg;
try {
  const satoriMod = await import('satori');
  satori = satoriMod.default;
  const resvgMod = await import('@resvg/resvg-js');
  Resvg = resvgMod.Resvg;
} catch {
  console.warn('[social] satori/@resvg not available — carousel PNG generation skipped');
}

async function loadFont(url, fallbackPath) {
  if (existsSync(fallbackPath)) {
    return readFileSync(fallbackPath);
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(fallbackPath, buf);
      return buf;
    }
  } catch {
    // network unavailable
  }
  return null;
}

const FONT_CACHE = join(ROOT, 'data', 'fonts');
mkdirSync(FONT_CACHE, { recursive: true });

const fontUI = await loadFont(
  'https://fonts.gstatic.com/s/dmsans/v14/rP2Hp2ywxg089UriCZOIHQ.woff',
  join(FONT_CACHE, 'dmsans-regular.woff')
);

const fontDisplay = await loadFont(
  'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjY.woff',
  join(FONT_CACHE, 'cormorant-regular.woff')
);

const fonts = [];
if (fontUI) fonts.push({ name: 'DM Sans', data: fontUI, weight: 400, style: 'normal' });
if (fontDisplay) fonts.push({ name: 'Cormorant Garamond', data: fontDisplay, weight: 700, style: 'normal' });

// ── Read articles ─────────────────────────────────────────────────────────────

function readArticles() {
  const articles = [];
  if (!existsSync(CONTENT_ROOT)) return articles;

  for (const category of readdirSync(CONTENT_ROOT)) {
    const catDir = join(CONTENT_ROOT, category);
    try {
      const stat = statSync(catDir);
      if (!stat.isDirectory()) continue;
    } catch { continue; }

    for (const file of readdirSync(catDir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace(/\.md$/, '');
      try {
        const raw = readFileSync(join(catDir, file), 'utf-8');
        // Parse minimal frontmatter without gray-matter (mjs context)
        const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
        let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let description = '';
        let tags = [];
        let date = new Date().toISOString().slice(0, 10);

        if (fmMatch) {
          const fm = fmMatch[1];
          const titleMatch = fm.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
          const descMatch = fm.match(/^description:\s*['"]?(.+?)['"]?\s*$/m);
          const dateMatch = fm.match(/^date:\s*(.+?)\s*$/m);
          const tagsMatch = fm.match(/^tags:\s*\[(.+?)\]/m);
          if (titleMatch) title = titleMatch[1];
          if (descMatch) description = descMatch[1];
          if (dateMatch) date = dateMatch[1];
          if (tagsMatch) tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
        }

        const bodyLines = raw.replace(/^---[\s\S]*?---/, '').split('\n')
          .map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('|'));
        if (!description) description = bodyLines.slice(0, 2).join(' ').slice(0, 200);

        const enrichedPath = join(DATA_ENRICHED, `${slug}.json`);
        let enriched = null;
        if (existsSync(enrichedPath)) {
          try { enriched = JSON.parse(readFileSync(enrichedPath, 'utf-8')); } catch {}
        }

        articles.push({ slug, category, title, description, tags, date, bodyLines, enriched });
      } catch { continue; }
    }
  }
  return articles;
}

const articles = await (async () => {
  const result = [];
  if (!existsSync(CONTENT_ROOT)) return result;
  const { statSync } = await import('fs');

  for (const category of readdirSync(CONTENT_ROOT)) {
    const catDir = join(CONTENT_ROOT, category);
    try {
      if (!statSync(catDir).isDirectory()) continue;
    } catch { continue; }

    for (const file of readdirSync(catDir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace(/\.md$/, '');
      try {
        const raw = readFileSync(join(catDir, file), 'utf-8');
        const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
        let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let description = '';
        let tags = [];
        let date = new Date().toISOString().slice(0, 10);

        if (fmMatch) {
          const fm = fmMatch[1];
          const titleMatch = fm.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
          const descMatch = fm.match(/^description:\s*['"]?(.+?)['"]?\s*$/m);
          const dateMatch = fm.match(/^date:\s*(.+?)\s*$/m);
          const tagsMatch = fm.match(/^tags:\s*\[(.+?)\]/m);
          if (titleMatch) title = titleMatch[1];
          if (descMatch) description = descMatch[1];
          if (dateMatch) date = dateMatch[1];
          if (tagsMatch) tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
        }

        const body = raw.replace(/^---[\s\S]*?---/, '');
        const bodyLines = body.split('\n').map(l => l.trim())
          .filter(l => l && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('[') && !l.startsWith('!'));
        if (!description) description = bodyLines.slice(0, 2).join(' ').slice(0, 200);

        result.push({ slug, category, title, description, tags, date, bodyLines });
      } catch { continue; }
    }
  }
  return result;
})();

// ── Thread generator ──────────────────────────────────────────────────────────

const THREAD_MAX = 280;

function buildThreadTweets(article) {
  const { title, description, tags, date, bodyLines } = article;
  const tagStr = tags.slice(0, 3).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
  const sourceTag = '#MalindraSIGINT';
  const heritage = 'Kotte Kingdom 1412–1467 CE';

  const tweets = [];

  // Tweet 1: Signal header
  const header = `🔍 SIGNAL: ${title}\n\n${description.slice(0, 180)}\n\n${tagStr} ${sourceTag}`;
  tweets.push(truncateTweet(header));

  // Tweet 2-4: Body excerpts (3 lines each, validated ≤280 chars)
  const chunks = [];
  let chunk = [];
  for (const line of bodyLines) {
    chunk.push(line);
    const joined = chunk.join(' ');
    if (joined.length >= 180 || chunk.length >= 4) {
      chunks.push(chunk.join(' ').slice(0, 240));
      chunk = [];
    }
    if (chunks.length >= 3) break;
  }
  if (chunk.length && chunks.length < 3) chunks.push(chunk.join(' ').slice(0, 240));

  chunks.forEach((c, i) => {
    tweets.push(truncateTweet(`${i + 2}/ ${c}`));
  });

  // Final tweet: Heritage + date + CTA
  const cta = `📊 Full intelligence brief: malindra.lk\n\n${heritage} · ${date}\n\n${sourceTag}`;
  tweets.push(truncateTweet(cta));

  return tweets;
}

function truncateTweet(text) {
  if (text.length <= THREAD_MAX) return text;
  return text.slice(0, THREAD_MAX - 1) + '…';
}

function renderThreadHTML(tweets, article) {
  const escaped = tweets.map(t => t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  );
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Thread: ${article.title.replace(/</g, '&lt;')} — Malindra SIGINT</title>
<style>
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: #0A0A0D; color: #F2E8D0; margin: 0; padding: 32px; max-width: 640px; }
  h1 { font-family: Georgia, serif; font-size: 20px; color: #F2E8D0; margin-bottom: 24px; }
  .thread { display: flex; flex-direction: column; gap: 16px; }
  .tweet { background: #16151B; border: 1px solid rgba(74,72,82,0.42); border-radius: 6px; padding: 16px; font-size: 15px; line-height: 1.6; position: relative; }
  .tweet::before { content: attr(data-n); position: absolute; top: 12px; right: 14px; font-size: 11px; color: #857B6C; letter-spacing: 0.1em; }
  .tweet .char-count { font-size: 11px; color: #857B6C; margin-top: 8px; text-align: right; }
  .char-over { color: #BE3348; }
  .heritage { margin-top: 32px; font-style: italic; font-size: 12px; color: #857B6C; text-align: center; opacity: 0.6; }
  .meta { font-size: 11px; color: #857B6C; margin-bottom: 24px; letter-spacing: 0.08em; text-transform: uppercase; }
</style>
</head>
<body>
<div class="meta">Malindra SIGINT · Twitter/X Thread · Generated ${new Date().toISOString().slice(0, 10)}</div>
<h1>${article.title.replace(/</g, '&lt;')}</h1>
<div class="thread">
${escaped.map((t, i) => {
    const raw = tweets[i];
    const count = raw.length;
    const over = count > THREAD_MAX;
    return `  <div class="tweet" data-n="${i + 1}/${tweets.length}">
    ${t}
    <div class="char-count${over ? ' char-over' : ''}">${count}/${THREAD_MAX}</div>
  </div>`;
  }).join('\n')}
</div>
<div class="heritage">මලින්ද්‍ර · Kotte Kingdom 1412–1467 CE</div>
</body>
</html>`;
}

// ── Carousel generator (satori + @resvg) ─────────────────────────────────────

async function generateCarouselPNG(article, outPath) {
  if (!satori || !Resvg || fonts.length === 0) return false;

  const { title, description, tags, date } = article;
  const tagStr = tags.slice(0, 3).map(t => t.toUpperCase()).join('  ·  ');

  // Brand colors
  const C = {
    bg: '#0A0A0D',
    surface: '#16151B',
    border: 'rgba(74,72,82,0.42)',
    gold: '#D49628',
    maroon: '#922438',
    ola: '#F2E8D0',
    parchment: '#C0B298',
    stone: '#857B6C',
    blue: '#3D74A8',
  };

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: 1080, height: 1080,
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        padding: '64px',
        position: 'relative',
        fontFamily: 'DM Sans',
      },
      children: [
        // Top accent bar
        { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: C.maroon } } },
        // Eyebrow
        { type: 'div', props: {
          style: { fontSize: '14px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.maroon, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' },
          children: [
            { type: 'div', props: { style: { width: '24px', height: '1px', background: C.maroon } } },
            { type: 'span', props: { children: 'SIGINT ANALYSIS · MALINDRA' } },
          ]
        }},
        // Title
        { type: 'div', props: {
          style: { fontFamily: 'Cormorant Garamond', fontSize: '52px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', color: C.ola, marginBottom: '32px', flex: 1 },
          children: title.length > 80 ? title.slice(0, 77) + '…' : title,
        }},
        // Description
        { type: 'div', props: {
          style: { fontSize: '18px', lineHeight: 1.6, color: C.parchment, marginBottom: '40px' },
          children: description.length > 200 ? description.slice(0, 197) + '…' : description,
        }},
        // Tags
        tagStr ? { type: 'div', props: {
          style: { fontSize: '12px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: '32px' },
          children: tagStr,
        }} : null,
        // Footer
        { type: 'div', props: {
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${C.border}`, paddingTop: '24px' },
          children: [
            { type: 'div', props: {
              style: { fontSize: '13px', color: C.stone, fontStyle: 'italic', fontFamily: 'Cormorant Garamond' },
              children: 'Kotte Kingdom 1412–1467 CE',
            }},
            { type: 'div', props: {
              style: { fontSize: '13px', color: C.stone },
              children: date,
            }},
          ],
        }},
        // Bottom accent
        { type: 'div', props: { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${C.maroon}, ${C.gold})` } } },
      ].filter(Boolean),
    },
  };

  try {
    const svg = await satori(jsx, { width: 1080, height: 1080, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } });
    writeFileSync(outPath, resvg.render().asPng());
    return true;
  } catch (e) {
    console.warn(`[social] carousel failed for ${article.slug}:`, e.message);
    return false;
  }
}

// ── Brief HTML (PDF fallback) ─────────────────────────────────────────────────

function renderBriefHTML(article) {
  const { title, description, tags, date, bodyLines } = article;
  const tagStr = tags.slice(0, 5).join(', ');
  const body = bodyLines.slice(0, 20).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title.replace(/</g, '&lt;')} — Malindra Intelligence Brief</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0A0A0D; color: #F2E8D0; padding: 48px 64px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #922438; padding-bottom: 24px; margin-bottom: 32px; }
  .eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #922438; margin-bottom: 16px; }
  h1 { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: #F2E8D0; margin-bottom: 12px; }
  .meta { font-size: 13px; color: #857B6C; }
  .description { font-size: 16px; line-height: 1.7; color: #C0B298; margin: 24px 0; }
  .body { font-size: 15px; line-height: 1.75; color: #C0B298; white-space: pre-wrap; }
  .tags { margin: 24px 0; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #D49628; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid rgba(74,72,82,0.42); font-family: 'Cormorant Garamond', serif; font-size: 12px; font-style: italic; color: #857B6C; text-align: center; }
  @media print { body { background: white; color: #1A1A1E; } h1, .description, .body { color: #2A2A30; } }
</style>
</head>
<body>
<div class="header">
  <div class="eyebrow">Malindra SIGINT Analysis · Intelligence Brief</div>
  <h1>${title.replace(/</g, '&lt;')}</h1>
  <div class="meta">${date}${tagStr ? ' · ' + tagStr : ''}</div>
</div>
<div class="description">${description.replace(/</g, '&lt;')}</div>
<div class="body">${body.replace(/</g, '&lt;')}</div>
<div class="footer">මලින්ද්‍ර · Kotte Kingdom 1412–1467 CE · malindra.lk</div>
</body>
</html>`;
}

// ── Main loop ─────────────────────────────────────────────────────────────────

let generated = 0;
let skipped = 0;

for (const article of articles) {
  const dir = join(SOCIAL_OUT, article.slug);
  mkdirSync(dir, { recursive: true });

  // Thread HTML
  const tweets = buildThreadTweets(article);
  const threadHTML = renderThreadHTML(tweets, article);
  writeFileSync(join(dir, 'thread.html'), threadHTML);

  // Carousel PNG
  const carouselPath = join(dir, 'carousel.png');
  const carouselOk = await generateCarouselPNG(article, carouselPath);

  // Brief HTML (+ PDF if puppeteer available and ENABLE_PDF=1)
  const briefHTML = renderBriefHTML(article);
  writeFileSync(join(dir, 'brief.html'), briefHTML);

  let pdfGenerated = false;
  if (process.env.ENABLE_PDF === '1') {
    try {
      const puppeteer = await import('puppeteer-core');
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(briefHTML, { waitUntil: 'networkidle0' });
      await page.pdf({ path: join(dir, 'brief.pdf'), format: 'A4', printBackground: true });
      await browser.close();
      pdfGenerated = true;
    } catch (e) {
      console.warn(`[social] PDF skipped for ${article.slug}: ${e.message}`);
    }
  }

  // Manifest
  const manifest = {
    slug: article.slug,
    title: article.title,
    date: article.date,
    tags: article.tags,
    generatedAt: new Date().toISOString(),
    assets: {
      thread: 'thread.html',
      threadTweetCount: tweets.length,
      carousel: carouselOk ? 'carousel.png' : null,
      brief: pdfGenerated ? 'brief.pdf' : 'brief.html',
    },
  };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  generated++;
}

// Write master index
const index = articles.map(a => ({
  slug: a.slug,
  title: a.title,
  date: a.date,
  hasCarousel: existsSync(join(SOCIAL_OUT, a.slug, 'carousel.png')),
}));
writeFileSync(join(SOCIAL_OUT, 'index.json'), JSON.stringify({ packages: index, generatedAt: new Date().toISOString() }, null, 2));

console.log(`[social] Done: ${generated} packages generated, ${skipped} skipped`);
