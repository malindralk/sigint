// MALINDRA PHASE 4
// scripts/export-dashboard-json.ts
// Runs at build time. Outputs public/dashboard/predictions.json
// for client-side chart hydration in the static dashboard.

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Import build-time functions directly
import { getRegionalOverview } from '../lib/predictions.js';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'public', 'dashboard');

mkdirSync(OUT_DIR, { recursive: true });

const overview = getRegionalOverview();

// Add chart-ready data shapes for Recharts
const chartData = {
  ...overview,

  // Bar chart: confidence by topic
  topicConfidenceChart: overview.topic_metrics.map((t) => ({
    topic: t.topic,
    confidence: Math.round(t.avg_confidence * 100),
    articles: t.article_count,
    trend: t.trend,
  })),

  // Line chart: aggregate forecast by topic (Q1..Q4)
  forecastChart: (() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map((q, qi) => {
      const point: Record<string, string | number> = { quarter: q };
      for (const tm of overview.topic_metrics) {
        point[tm.topic] = Math.round((tm.forecast_mean[qi] ?? 0) * 100);
      }
      return point;
    });
  })(),

  // Donut/pie: confidence distribution
  confidenceDistChart: [
    { label: 'HIGH', value: overview.confidence_distribution.HIGH, color: '#D49628' },
    { label: 'MEDIUM', value: overview.confidence_distribution.MEDIUM, color: '#3D74A8' },
    { label: 'LOW', value: overview.confidence_distribution.LOW, color: '#922438' },
  ].filter((d) => d.value > 0),

  // Scatter: cross-signal correlation
  correlationChart: Object.entries(overview.cross_signal_correlation).map(([key, corr]) => {
    const [a, b] = key.split('__');
    return { pair: `${a} / ${b}`, correlation: corr };
  }),
};

const outPath = join(OUT_DIR, 'predictions.json');
writeFileSync(outPath, JSON.stringify(chartData, null, 2), 'utf-8');

console.log(
  `[export-dashboard-json] Done: ${overview.total_articles} articles, ${overview.topic_metrics.length} topics → ${outPath}`
);
