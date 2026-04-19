#!/usr/bin/env node
// MALINDRA PHASE 3
// scripts/generate-charts.mjs
// Build-time SVG chart generator.
// Reads enriched data from ./data/enriched/ and ./data/votes/votes.json.
// Outputs static SVG charts to public/charts/[slug]/[type].svg.
// Uses brand token values (no CSS vars — inline SVG requires resolved values).
// Charts: time-series (line), topic-distribution (bar), vote-breakdown (donut).

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENRICHED_DIR = join(ROOT, 'data', 'enriched');
const VOTES_FILE = join(ROOT, 'data', 'votes', 'votes.json');
const CHARTS_DIR = join(ROOT, 'public', 'charts');

mkdirSync(CHARTS_DIR, { recursive: true });

// ── Brand token values (resolved — no CSS vars in SVG) ────────────────────────
const C = {
  bg: '#0A0A0D',
  surface: '#16151B',
  border: 'rgba(74,72,82,0.42)',
  borderSolid: '#49474F',
  gold: '#D49628',
  maroon: '#922438',
  ola: '#F2E8D0',
  parchment: '#C0B298',
  stone: '#857B6C',
  blue: '#3D74A8',
  green: '#28805E',
  red: '#BE3348',
  fontUI: 'DM Sans, system-ui, sans-serif',
  fontDisplay: 'Cormorant Garamond, Georgia, serif',
};

const TOPIC_COLORS = {
  debt: C.gold,
  digital: C.blue,
  tourism: C.green,
  geopolitics: C.maroon,
  energy: C.green,
};

// ── SVG helpers ───────────────────────────────────────────────────────────────

function svgWrap(content, width, height, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escXml(title)}">
  <title>${escXml(title)}</title>
  <rect width="${width}" height="${height}" fill="${C.bg}"/>
  <rect x="0" y="0" width="4" height="${height}" fill="${C.maroon}"/>
  ${content}
</svg>`;
}

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function text(x, y, content, opts = {}) {
  const {
    fill = C.ola, fontSize = 12, fontFamily = C.fontUI,
    fontWeight = 400, textAnchor = 'start', opacity = 1,
  } = opts;
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${fontSize}" font-family="${escXml(fontFamily)}" font-weight="${fontWeight}" text-anchor="${textAnchor}" opacity="${opacity}">${escXml(content)}</text>`;
}

// ── Bar chart: topic tag distribution ─────────────────────────────────────────

function generateBarChart(slug, tagCounts, title) {
  const W = 560, H = 280;
  const PAD = { top: 40, right: 20, bottom: 32, left: 120 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const entries = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (!entries.length) return null;

  const maxVal = Math.max(...entries.map(([, v]) => v));
  const barH = Math.floor((chartH / entries.length) * 0.65);
  const gap = Math.floor(chartH / entries.length);

  let bars = '';
  entries.forEach(([label, value], i) => {
    const y = PAD.top + i * gap;
    const barW = Math.round((value / maxVal) * chartW);
    const color = TOPIC_COLORS[label.toLowerCase()] ?? C.blue;

    bars += `<rect x="${PAD.left}" y="${y}" width="${barW}" height="${barH}" fill="${color}" opacity="0.85" rx="2"/>`;
    bars += text(PAD.left - 8, y + barH / 2 + 4, label.slice(0, 18), { fill: C.stone, fontSize: 11, textAnchor: 'end' });
    bars += text(PAD.left + barW + 6, y + barH / 2 + 4, String(value), { fill: color, fontSize: 11, fontWeight: 600 });
  });

  // Title
  const titleEl = text(PAD.left, 22, title.slice(0, 60), { fill: C.ola, fontSize: 13, fontWeight: 600, fontFamily: C.fontDisplay });
  // Heritage
  const heritage = text(W / 2, H - 6, 'Malindra · Kotte Kingdom 1412–1467 CE', {
    fill: C.stone, fontSize: 10, textAnchor: 'middle', opacity: 0.5,
  });

  return svgWrap(`${titleEl}${bars}${heritage}`, W, H, title);
}

// ── Line chart: article timeline ──────────────────────────────────────────────

function generateTimelineChart(articles) {
  const W = 720, H = 200;
  const PAD = { top: 36, right: 20, bottom: 40, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  if (articles.length < 2) return null;

  // Group by month
  const byMonth = {};
  for (const a of articles) {
    const month = (a.date || '').slice(0, 7);
    if (month) byMonth[month] = (byMonth[month] ?? 0) + 1;
  }
  const months = Object.keys(byMonth).sort();
  if (months.length < 2) return null;

  const maxCount = Math.max(...Object.values(byMonth));
  const xStep = chartW / (months.length - 1);

  const points = months.map((m, i) => {
    const x = PAD.left + i * xStep;
    const y = PAD.top + chartH - (byMonth[m] / maxCount) * chartH;
    return { x, y, m, count: byMonth[m] };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = pathD + ` L${points[points.length - 1].x},${PAD.top + chartH} L${points[0].x},${PAD.top + chartH} Z`;

  const dots = points.map(p =>
    `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${C.maroon}" stroke="${C.bg}" stroke-width="1.5"/>`
  ).join('');

  const xLabels = points.filter((_, i) => i % Math.ceil(points.length / 6) === 0).map(p =>
    text(p.x, PAD.top + chartH + 18, p.m.slice(0, 7), { fill: C.stone, fontSize: 10, textAnchor: 'middle' })
  ).join('');

  const titleEl = text(PAD.left, 20, 'Publication Timeline', { fill: C.ola, fontSize: 12, fontWeight: 600 });
  const heritage = text(W / 2, H - 4, 'Malindra · Kotte Kingdom 1412–1467 CE', {
    fill: C.stone, fontSize: 9, textAnchor: 'middle', opacity: 0.45,
  });

  const svg = `
    ${titleEl}
    <path d="${areaD}" fill="${C.maroon}" opacity="0.08"/>
    <path d="${pathD}" fill="none" stroke="${C.maroon}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    ${xLabels}
    ${heritage}
  `;

  return svgWrap(svg, W, H, 'Publication Timeline');
}

// ── Donut chart: vote breakdown ────────────────────────────────────────────────

function generateDonutChart(votes) {
  const W = 320, H = 260;
  const cx = 130, cy = 130, R = 90, r = 54;
  const total = Object.values(votes).reduce((s, n) => s + n, 0);
  if (total === 0) return null;

  const COLORS = [C.gold, C.blue, C.green, C.maroon, '#5B91B5'];
  const entries = Object.entries(votes);

  let startAngle = -Math.PI / 2;
  let arcs = '';
  let legend = '';

  entries.forEach(([topic, count], i) => {
    const pct = count / total;
    const angle = pct * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const color = COLORS[i % COLORS.length];

    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const ix1 = cx + r * Math.cos(startAngle);
    const iy1 = cy + r * Math.sin(startAngle);
    const ix2 = cx + r * Math.cos(endAngle);
    const iy2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    arcs += `<path d="M${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${largeArc},0 ${ix1},${iy1} Z" fill="${color}" opacity="0.9"/>`;

    const legendY = 60 + i * 36;
    legend += `<rect x="${cx * 2 + 8}" y="${legendY - 10}" width="10" height="10" fill="${color}" rx="2"/>`;
    legend += text(cx * 2 + 24, legendY, `${topic} · ${Math.round(pct * 100)}%`, { fill: C.parchment, fontSize: 11 });

    startAngle = endAngle;
  });

  // Center label
  const centerLabel = `
    ${text(cx, cy - 8, 'Topics', { fill: C.stone, fontSize: 11, textAnchor: 'middle' })}
    ${text(cx, cy + 14, String(total), { fill: C.ola, fontSize: 20, fontWeight: 600, textAnchor: 'middle', fontFamily: C.fontUI })}
    ${text(cx, cy + 28, 'votes', { fill: C.stone, fontSize: 10, textAnchor: 'middle' })}
  `;

  const heritage = text(W / 2, H - 6, 'Malindra · Kotte Kingdom 1412–1467 CE', {
    fill: C.stone, fontSize: 9, textAnchor: 'middle', opacity: 0.45,
  });

  return svgWrap(`${arcs}${centerLabel}${legend}${heritage}`, W, H, 'Topic Vote Breakdown');
}

// ── Main ──────────────────────────────────────────────────────────────────────

let chartsGenerated = 0;

// 1. Per-article tag charts
const articles = [];
if (existsSync(ENRICHED_DIR)) {
  for (const file of readdirSync(ENRICHED_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(readFileSync(join(ENRICHED_DIR, file), 'utf-8'));
      articles.push({ slug: data.slug || file.replace('.json', ''), date: data.generatedAt?.slice(0, 10), data });
    } catch {}
  }
}

// Tag aggregation across all articles
const globalTagCounts = {};
for (const a of articles) {
  const tags = a.data?.sources?.map(s => s.tags || []).flat() || [];
  for (const tag of tags) {
    globalTagCounts[tag] = (globalTagCounts[tag] ?? 0) + 1;
  }
}

// Global tag distribution chart
if (Object.keys(globalTagCounts).length > 0) {
  const svg = generateBarChart('global', globalTagCounts, 'Signal Distribution by Topic');
  if (svg) {
    writeFileSync(join(CHARTS_DIR, 'tag-distribution.svg'), svg);
    chartsGenerated++;
  }
}

// Per-article charts (if article has tag data)
for (const a of articles) {
  const tagCounts = {};
  const tags = a.data?.sources?.map(s => s.tags || []).flat() || [];
  if (!tags.length) continue;
  for (const tag of tags) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;

  const dir = join(CHARTS_DIR, a.slug);
  mkdirSync(dir, { recursive: true });

  const barSvg = generateBarChart(a.slug, tagCounts, `Source Tags — ${a.slug}`);
  if (barSvg) {
    writeFileSync(join(dir, 'tags.svg'), barSvg);
    chartsGenerated++;
  }
}

// 2. Publication timeline chart
if (articles.length >= 2) {
  const timelineSvg = generateTimelineChart(articles);
  if (timelineSvg) {
    writeFileSync(join(CHARTS_DIR, 'timeline.svg'), timelineSvg);
    chartsGenerated++;
  }
}

// 3. Vote donut chart
if (existsSync(VOTES_FILE)) {
  try {
    const votes = JSON.parse(readFileSync(VOTES_FILE, 'utf-8'));
    const donutSvg = generateDonutChart(votes);
    if (donutSvg) {
      writeFileSync(join(CHARTS_DIR, 'votes.svg'), donutSvg);
      chartsGenerated++;
    }
  } catch {}
}

// Write chart index
const index = {
  charts: [
    existsSync(join(CHARTS_DIR, 'tag-distribution.svg')) && { id: 'tag-distribution', path: '/charts/tag-distribution.svg', type: 'bar', title: 'Signal Distribution by Topic' },
    existsSync(join(CHARTS_DIR, 'timeline.svg')) && { id: 'timeline', path: '/charts/timeline.svg', type: 'line', title: 'Publication Timeline' },
    existsSync(join(CHARTS_DIR, 'votes.svg')) && { id: 'votes', path: '/charts/votes.svg', type: 'donut', title: 'Topic Vote Breakdown' },
  ].filter(Boolean),
  generatedAt: new Date().toISOString(),
};
writeFileSync(join(CHARTS_DIR, 'index.json'), JSON.stringify(index, null, 2));

console.log(`[charts] Done: ${chartsGenerated} SVG charts generated`);
