#!/usr/bin/env node
// MALINDRA PHASE 5
// scripts/autonomous-signals.mjs
// Build-time autonomous signal generator.
// Reads enriched articles + predictions from ./data/enriched/ + ./data/predictions/
// Runs lightweight similarity scoring + regression trend projection
// Outputs ./data/signals/[slug].json with [MODEL v2.0] attribution

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENRICHED_DIR = join(ROOT, 'data', 'enriched');
const PREDICTIONS_DIR = join(ROOT, 'data', 'predictions');
const SIGNALS_DIR = join(ROOT, 'data', 'signals');

mkdirSync(SIGNALS_DIR, { recursive: true });

const MODEL_VERSION = 'v2.0';

// ── Lightweight cosine similarity (no deps) ───────────────────────────────────

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function tfVector(tokens) {
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] ?? 0) + 1;
  const total = tokens.length || 1;
  const vec = {};
  for (const [t, c] of Object.entries(counts)) vec[t] = c / total;
  return vec;
}

function cosineSim(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, normA = 0, normB = 0;
  for (const k of keys) {
    const va = a[k] ?? 0, vb = b[k] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Linear regression for trend projection ────────────────────────────────────

function linReg(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 };
  const xs = ys.map((_, i) => i);
  const xm = xs.reduce((a, b) => a + b, 0) / n;
  const ym = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0);
  const den = xs.reduce((s, x) => s + (x - xm) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: ym - slope * xm };
}

function project(ys, periods = 4) {
  const { slope, intercept } = linReg(ys);
  const n = ys.length;
  return Array.from({ length: periods }, (_, i) =>
    Math.max(0, Math.min(1, intercept + slope * (n + i)))
  ).map(v => Math.round(v * 1000) / 1000);
}

// ── Signal strength scoring ───────────────────────────────────────────────────

const SIGNAL_KEYWORDS = {
  geopolitical_risk: ['china', 'india', 'us', 'military', 'strategic', 'port', 'sovereign', 'alliance'],
  economic_stress: ['debt', 'imf', 'default', 'fiscal', 'gdp', 'inflation', 'currency', 'bonds'],
  digital_transformation: ['digital', 'ai', 'cyber', 'platform', 'data', 'technology', 'infrastructure'],
  climate_resilience: ['climate', 'energy', 'solar', 'renewable', 'carbon', 'grid', 'flood', 'disaster'],
  social_cohesion: ['poverty', 'unemployment', 'protest', 'inequality', 'food', 'migration', 'health'],
};

function scoreSignals(text) {
  const tokens = tokenize(text);
  const total = tokens.length || 1;
  const scores = {};
  for (const [signal, keywords] of Object.entries(SIGNAL_KEYWORDS)) {
    const hits = keywords.filter(kw => text.includes(kw)).length;
    scores[signal] = Math.round((hits / keywords.length) * 1000) / 1000;
  }
  return scores;
}

// ── Cross-article similarity ──────────────────────────────────────────────────

function buildSimilarityIndex(articles) {
  const vecs = articles.map(a => tfVector(tokenize(a.text)));
  const sim = {};
  for (let i = 0; i < articles.length; i++) {
    const top = [];
    for (let j = 0; j < articles.length; j++) {
      if (i === j) continue;
      const s = cosineSim(vecs[i], vecs[j]);
      if (s > 0.05) top.push({ slug: articles[j].slug, similarity: Math.round(s * 1000) / 1000 });
    }
    top.sort((a, b) => b.similarity - a.similarity);
    sim[articles[i].slug] = top.slice(0, 5);
  }
  return sim;
}

// ── Load data ─────────────────────────────────────────────────────────────────

function loadArticles() {
  const articles = [];
  if (!existsSync(ENRICHED_DIR)) return articles;
  for (const f of readdirSync(ENRICHED_DIR)) {
    if (!f.endsWith('.json')) continue;
    try {
      const d = JSON.parse(readFileSync(join(ENRICHED_DIR, f), 'utf-8'));
      articles.push({
        slug: d.slug || f.replace('.json', ''),
        category: d.category || '',
        text: [d.slug, d.category, ...(d.dataPoints || []).map(String)].join(' '),
        enriched: d,
      });
    } catch { /* ignore */ }
  }
  return articles;
}

function loadPrediction(slug) {
  const p = join(PREDICTIONS_DIR, `${slug}.json`);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const articles = loadArticles();
if (!articles.length) {
  console.log('[autonomous-signals] No enriched articles — skipping');
  process.exit(0);
}

const simIndex = buildSimilarityIndex(articles);

let generated = 0;
for (const article of articles) {
  const pred = loadPrediction(article.slug);
  const signalScores = scoreSignals(article.text);

  // Derive dominant signal
  const topSignal = Object.entries(signalScores).sort((a, b) => b[1] - a[1])[0];
  const signalName = topSignal ? topSignal[0] : 'geopolitical_risk';
  const signalStrength = topSignal ? topSignal[1] : 0;

  // Use prediction confidence series if available
  const baseConf = pred?.aggregate_confidence?.mean ?? 0.5;
  const scenarioForecasts = (pred?.scenarios ?? []).flatMap(s => s.forecast_quarters ?? []);
  const histSeries = scenarioForecasts.length >= 2
    ? scenarioForecasts.slice(0, 8)
    : [baseConf * 0.9, baseConf * 0.95, baseConf, baseConf * 1.02];

  const projectedTrajectory = project(histSeries);
  const trendSlope = linReg(histSeries).slope;
  const trendDir = trendSlope > 0.005 ? 'escalating' : trendSlope < -0.005 ? 'de-escalating' : 'stable';

  // Confidence interval (simple ±1 std from projected)
  const projMean = projectedTrajectory.reduce((a, b) => a + b, 0) / projectedTrajectory.length;
  const projStd = Math.sqrt(projectedTrajectory.reduce((s, v) => s + (v - projMean) ** 2, 0) / projectedTrajectory.length);

  const signal = {
    slug: article.slug,
    model_version: MODEL_VERSION,
    model_label: `[MODEL ${MODEL_VERSION}]`,
    analysis_label: '[ANALYSIS]',
    generated_at: new Date().toISOString(),
    dominant_signal: signalName,
    signal_strength: Math.round(signalStrength * 1000) / 1000,
    all_signal_scores: signalScores,
    trend_direction: trendDir,
    trend_slope: Math.round(trendSlope * 10000) / 10000,
    projected_trajectory: projectedTrajectory,
    confidence_interval: {
      mean: Math.round(projMean * 1000) / 1000,
      std: Math.round(projStd * 1000) / 1000,
      lower: Math.round(Math.max(0, projMean - projStd) * 1000) / 1000,
      upper: Math.round(Math.min(1, projMean + projStd) * 1000) / 1000,
    },
    related_articles: simIndex[article.slug] ?? [],
    prediction_ref: pred ? { slug: pred.slug, confidence_label: pred.aggregate_confidence?.label } : null,
    meta: {
      methodology: 'TF cosine similarity + OLS linear regression trend projection',
      disclaimer: 'Pre-computed at build time. Not financial or investment advice.',
      articles_in_corpus: articles.length,
    },
  };

  writeFileSync(
    join(SIGNALS_DIR, `${article.slug}.json`),
    JSON.stringify(signal, null, 2),
    'utf-8'
  );
  generated++;
}

// Write index
const index = {
  model_version: MODEL_VERSION,
  generated_at: new Date().toISOString(),
  total: generated,
  entries: readdirSync(SIGNALS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => {
      try {
        const d = JSON.parse(readFileSync(join(SIGNALS_DIR, f), 'utf-8'));
        return { slug: d.slug, dominant_signal: d.dominant_signal, trend_direction: d.trend_direction, signal_strength: d.signal_strength };
      } catch { return null; }
    })
    .filter(Boolean),
};
writeFileSync(join(SIGNALS_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');

console.log(`[autonomous-signals] Done: ${generated} signals generated`);
