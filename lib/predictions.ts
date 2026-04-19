// MALINDRA PHASE 4
// lib/predictions.ts
// Build-time prediction data loader.
// Loads ./data/predictions/ at build time (Node.js context).
// Exports: getPredictionMetrics(slug), getRegionalOverview()

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const PREDICTIONS_DIR = join(process.cwd(), 'data', 'predictions');

export interface ConfidenceScore {
  mean: number;
  p10: number;
  p50: number;
  p90: number;
  std: number;
  ci_width: number;
}

export interface Scenario {
  topic: string;
  signal: string;
  context: string;
  implication: string;
  action: string;
  confidence: ConfidenceScore;
  forecast_quarters: number[];
  risk_direction: 'increasing' | 'decreasing';
}

export interface Prediction {
  slug: string;
  model_version: string;
  model_label: string;
  analysis_label: string;
  generated_at: string;
  topics_detected: string[];
  aggregate_confidence: {
    mean: number;
    p50: number;
    label: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  scenarios: Scenario[];
  meta: {
    methodology: string;
    disclaimer: string;
    forecast_horizon_quarters: number;
    monte_carlo_iterations: number;
    seed: number;
  };
}

export interface PredictionIndex {
  generated_at: string;
  model_version: string;
  total: number;
  entries: Array<{
    slug: string;
    model_version: string;
    topics: string[];
    confidence_label: string;
    confidence_mean: number;
    generated_at: string;
  }>;
}

export interface TopicMetrics {
  topic: string;
  article_count: number;
  avg_confidence: number;
  trend: 'increasing' | 'decreasing' | 'mixed';
  forecast_mean: number[];
}

export interface RegionalOverview {
  total_articles: number;
  model_version: string;
  generated_at: string;
  confidence_distribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  topic_metrics: TopicMetrics[];
  cross_signal_correlation: Record<string, number>;
  high_risk_slugs: string[];
}

function loadPrediction(slug: string): Prediction | null {
  const path = join(PREDICTIONS_DIR, `${slug}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Prediction;
  } catch {
    return null;
  }
}

function loadIndex(): PredictionIndex | null {
  const path = join(PREDICTIONS_DIR, 'index.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as PredictionIndex;
  } catch {
    return null;
  }
}

function loadAllPredictions(): Prediction[] {
  if (!existsSync(PREDICTIONS_DIR)) return [];
  const files = readdirSync(PREDICTIONS_DIR).filter(
    (f) => f.endsWith('.json') && f !== 'index.json'
  );
  return files.flatMap((f) => {
    const slug = f.replace('.json', '');
    const pred = loadPrediction(slug);
    return pred ? [pred] : [];
  });
}

export function getPredictionMetrics(slug: string): Prediction | null {
  return loadPrediction(slug);
}

export function getRegionalOverview(): RegionalOverview {
  const predictions = loadAllPredictions();
  const index = loadIndex();

  const distribution = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const topicMap: Record<
    string,
    { count: number; conf: number[]; increasing: number; decreasing: number; forecasts: number[][] }
  > = {};

  for (const pred of predictions) {
    const label = pred.aggregate_confidence.label;
    if (label in distribution) distribution[label]++;

    for (const sc of pred.scenarios) {
      if (!topicMap[sc.topic]) {
        topicMap[sc.topic] = { count: 0, conf: [], increasing: 0, decreasing: 0, forecasts: [] };
      }
      const tm = topicMap[sc.topic];
      tm.count++;
      tm.conf.push(sc.confidence.mean);
      if (sc.risk_direction === 'increasing') tm.increasing++;
      else tm.decreasing++;
      tm.forecasts.push(sc.forecast_quarters);
    }
  }

  const topic_metrics: TopicMetrics[] = Object.entries(topicMap).map(([topic, tm]) => {
    const avg_confidence = tm.conf.reduce((a, b) => a + b, 0) / (tm.conf.length || 1);
    const trend: 'increasing' | 'decreasing' | 'mixed' =
      tm.increasing > tm.decreasing * 1.5
        ? 'increasing'
        : tm.decreasing > tm.increasing * 1.5
        ? 'decreasing'
        : 'mixed';

    // Average forecast across articles
    const qLen = tm.forecasts[0]?.length ?? 4;
    const forecast_mean = Array.from({ length: qLen }, (_, qi) => {
      const vals = tm.forecasts.map((f) => f[qi] ?? 0).filter(Boolean);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    return {
      topic,
      article_count: tm.count,
      avg_confidence: Math.round(avg_confidence * 1000) / 1000,
      trend,
      forecast_mean: forecast_mean.map((v) => Math.round(v * 1000) / 1000),
    };
  });

  topic_metrics.sort((a, b) => b.avg_confidence - a.avg_confidence);

  // Simple cross-signal correlation (Pearson approximation from P50 values)
  const topics = topic_metrics.map((t) => t.topic);
  const cross_signal_correlation: Record<string, number> = {};
  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const key = `${topics[i]}__${topics[j]}`;
      const tm_i = topicMap[topics[i]];
      const tm_j = topicMap[topics[j]];
      // Pearson on forecast_mean series
      const f_i = topic_metrics[i].forecast_mean;
      const f_j = topic_metrics[j].forecast_mean;
      if (f_i.length !== f_j.length || f_i.length === 0) {
        cross_signal_correlation[key] = 0;
        continue;
      }
      const mean_i = f_i.reduce((a, b) => a + b, 0) / f_i.length;
      const mean_j = f_j.reduce((a, b) => a + b, 0) / f_j.length;
      const num = f_i.reduce((s, v, k) => s + (v - mean_i) * (f_j[k] - mean_j), 0);
      const den_i = Math.sqrt(f_i.reduce((s, v) => s + (v - mean_i) ** 2, 0));
      const den_j = Math.sqrt(f_j.reduce((s, v) => s + (v - mean_j) ** 2, 0));
      cross_signal_correlation[key] =
        den_i * den_j === 0 ? 0 : Math.round((num / (den_i * den_j)) * 1000) / 1000;
    }
  }

  const high_risk_slugs = predictions
    .filter((p) => p.aggregate_confidence.label === 'HIGH')
    .map((p) => p.slug);

  return {
    total_articles: predictions.length,
    model_version: index?.model_version ?? 'v1.0',
    generated_at: index?.generated_at ?? new Date().toISOString(),
    confidence_distribution: distribution,
    topic_metrics,
    cross_signal_correlation,
    high_risk_slugs,
  };
}
