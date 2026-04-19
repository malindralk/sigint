'use client';
// MALINDRA PHASE 4
// app/dashboard/predictions/PredictionsDashboardClient.tsx
// Client-side chart rendering for pre-computed prediction data.
// Uses Recharts. All colors reference CSS vars (temple-gold, zheng-he, etc.)

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RegionalOverview } from '@/lib/predictions';
import { BRAND } from '@/lib/brand-colors';

interface Props {
  overview: RegionalOverview;
}

// Brand palette (resolved values for Recharts — CSS vars not supported in SVG)
const C = {
  gold: BRAND.accent,
  maroon: BRAND.primary,
  blue: BRAND.info,
  green: BRAND.success,
  ola: BRAND.textPrimary,
  parchment: BRAND.textSecondary,
  stone: BRAND.textMuted,
  surface: BRAND.bgSurface,
  bg: BRAND.bgBase,
  border: BRAND.borderSolid,
};

// Theme-aware values for DOM containers (not SVG)
const T = {
  surface: 'var(--theme-bg-surface)',
  elevated: 'var(--theme-bg-elevated)',
  border: 'var(--theme-border)',
  borderStrong: 'var(--theme-border-strong)',
  text: 'var(--theme-text-primary)',
  textSecondary: 'var(--theme-text-secondary)',
  textMuted: 'var(--theme-text-muted)',
};

const TOPIC_COLORS: Record<string, string> = {
  debt: C.gold,
  digital: C.blue,
  tourism: C.green,
  geopolitics: C.maroon,
  energy: C.green,
};

const TOPIC_LABELS: Record<string, string> = {
  debt: 'Debt',
  digital: 'Digital',
  tourism: 'Tourism',
  geopolitics: 'Geopolitics',
  energy: 'Energy',
};

const TREND_ICONS: Record<string, string> = {
  increasing: '↑',
  decreasing: '↓',
  mixed: '↔',
};

const TREND_COLORS: Record<string, string> = {
  increasing: C.maroon,
  decreasing: C.green,
  mixed: C.stone,
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '0.65rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: T.textSecondary,
        fontFamily: 'var(--font-ui, sans-serif)',
        marginBottom: '1rem',
        fontWeight: 600,
      }}
    >
      {children}
    </h2>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderTop: `3px solid ${accent ?? C.gold}`,
        borderRadius: '3px',
        padding: '1rem',
        minWidth: '120px',
        flex: '1',
      }}
    >
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: accent ?? C.gold,
          fontFamily: 'var(--font-display, serif)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.7rem', color: T.textMuted, marginTop: '0.25rem', fontFamily: 'var(--font-ui, sans-serif)' }}>
        {label}
      </div>
    </div>
  );
}

// Build forecast chart data from topic_metrics
function buildForecastData(overview: RegionalOverview) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  return quarters.map((q, qi) => {
    const point: Record<string, string | number> = { quarter: q };
    for (const tm of overview.topic_metrics) {
      point[tm.topic] = Math.round((tm.forecast_mean[qi] ?? 0) * 100);
    }
    return point;
  });
}

export default function PredictionsDashboardClient({ overview }: Props) {
  const topicConfidence = overview.topic_metrics.map((t) => ({
    topic: TOPIC_LABELS[t.topic] ?? t.topic,
    topicKey: t.topic,
    confidence: Math.round(t.avg_confidence * 100),
    articles: t.article_count,
    trend: t.trend,
  }));

  const forecastData = buildForecastData(overview);

  const confidenceDist = [
    { label: 'HIGH', value: overview.confidence_distribution.HIGH, color: C.gold },
    { label: 'MEDIUM', value: overview.confidence_distribution.MEDIUM, color: C.blue },
    { label: 'LOW', value: overview.confidence_distribution.LOW, color: C.maroon },
  ].filter((d) => d.value > 0);

  const correlationData = Object.entries(overview.cross_signal_correlation).map(([key, corr]) => {
    const [a, b] = key.split('__');
    return {
      pair: `${TOPIC_LABELS[a] ?? a} / ${TOPIC_LABELS[b] ?? b}`,
      correlation: Math.round(corr * 100) / 100,
    };
  });

  const total = Object.values(overview.confidence_distribution).reduce((a, b) => a + b, 0);

  return (
    <main
      style={{
        background: 'var(--color-bg, #0A0A0D)',
        minHeight: '100vh',
        padding: '2rem 1.5rem',
        fontFamily: 'var(--font-ui, sans-serif)',
        color: 'var(--color-ola, #F2E8D0)',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: '2rem', borderBottom: `1px solid ${T.border}`, paddingBottom: '1.5rem' }}>
        <span
          style={{
            fontSize: '0.6rem',
            color: C.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.5rem',
          }}
        >
          [MODEL v1.0] · [ANALYSIS] · Predictive Intelligence Dashboard
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display, serif)',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 700,
            color: T.text,
            margin: 0,
          }}
        >
          Scenario Analytics
        </h1>
        <p style={{ color: T.textSecondary, fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Pre-computed Monte Carlo scenarios across {overview.total_articles} intelligence articles.{' '}
          Model: {overview.model_version} · Generated:{' '}
          {new Date(overview.generated_at).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <StatCard label="Articles Modeled" value={overview.total_articles} accent={C.gold} />
        <StatCard label="High Confidence" value={overview.confidence_distribution.HIGH} accent={C.gold} />
        <StatCard label="Medium Confidence" value={overview.confidence_distribution.MEDIUM} accent={C.blue} />
        <StatCard label="Low Confidence" value={overview.confidence_distribution.LOW} accent={C.maroon} />
        <StatCard label="Topics Tracked" value={overview.topic_metrics.length} accent={C.green} />
      </div>

      {/* Charts grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Bar: Topic confidence */}
        {topicConfidence.length > 0 && (
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: '4px',
              padding: '1.25rem',
            }}
          >
            <SectionHeader>Signal Confidence by Topic (%)</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicConfidence} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="topic" tick={{ fill: C.stone, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: C.stone, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ola, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Confidence']}
                />
                <Bar dataKey="confidence" radius={[2, 2, 0, 0]}>
                  {topicConfidence.map((entry) => (
                    <Cell key={entry.topicKey} fill={TOPIC_COLORS[entry.topicKey] ?? C.gold} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Line: Forecast trends */}
        {forecastData.length > 0 && overview.topic_metrics.length > 0 && (
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: '4px',
              padding: '1.25rem',
            }}
          >
            <SectionHeader>Risk Forecast by Quarter (%)</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={forecastData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="quarter" tick={{ fill: C.stone, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: C.stone, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ola, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.stone }} />
                {overview.topic_metrics.map((tm) => (
                  <Line
                    key={tm.topic}
                    type="monotone"
                    dataKey={tm.topic}
                    stroke={TOPIC_COLORS[tm.topic] ?? C.stone}
                    strokeWidth={2}
                    dot={{ fill: TOPIC_COLORS[tm.topic] ?? C.stone, r: 3 }}
                    name={TOPIC_LABELS[tm.topic] ?? tm.topic}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie: confidence distribution */}
        {confidenceDist.length > 0 && (
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: '4px',
              padding: '1.25rem',
            }}
          >
            <SectionHeader>Confidence Distribution</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={confidenceDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="label"
                  paddingAngle={2}
                >
                  {confidenceDist.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ola, fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: C.stone }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar: Cross-signal correlation */}
        {correlationData.length > 0 && (
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: '4px',
              padding: '1.25rem',
            }}
          >
            <SectionHeader>Cross-Signal Correlation</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={correlationData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" domain={[-1, 1]} tick={{ fill: C.stone, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="pair" type="category" tick={{ fill: C.stone, fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ola, fontSize: 12 }}
                  formatter={(v: number) => [v.toFixed(2), 'Correlation']}
                />
                <Bar dataKey="correlation" radius={[0, 2, 2, 0]}>
                  {correlationData.map((entry, i) => (
                    <Cell key={i} fill={entry.correlation >= 0 ? C.blue : C.maroon} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Topic risk table */}
      {overview.topic_metrics.length > 0 && (
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: '4px',
            padding: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <SectionHeader>Topic Risk Summary</SectionHeader>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Topic', 'Articles', 'Avg Confidence', 'Trend', 'Q1→Q4 Forecast'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        color: T.textMuted,
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.topic_metrics.map((tm, i) => (
                  <tr
                    key={tm.topic}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      background: i % 2 === 0 ? 'transparent' : 'var(--theme-hover-bg)',
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span
                        style={{
                          color: TOPIC_COLORS[tm.topic] ?? T.textSecondary,
                          fontWeight: 600,
                        }}
                      >
                        {TOPIC_LABELS[tm.topic] ?? tm.topic}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: T.textSecondary }}>{tm.article_count}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ color: TOPIC_COLORS[tm.topic] ?? C.gold }}>
                        {Math.round(tm.avg_confidence * 100)}%
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ color: TREND_COLORS[tm.trend] }}>
                        {TREND_ICONS[tm.trend]} {tm.trend}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: T.textSecondary, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}>
                      {tm.forecast_mean.map((v) => `${Math.round(v * 100)}%`).join(' → ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* High-risk articles */}
      {overview.high_risk_slugs.length > 0 && (
        <div
          style={{
            background: T.surface,
            border: `1px solid ${C.maroon}`,
            borderLeft: `4px solid ${C.maroon}`,
            borderRadius: '4px',
            padding: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <SectionHeader>High-Confidence Risk Signals</SectionHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {overview.high_risk_slugs.map((slug) => (
              <span
                key={slug}
                style={{
                  fontSize: '0.72rem',
                  color: C.gold,
                  background: 'rgba(212,150,40,0.10)',
                  border: '1px solid rgba(212,150,40,0.25)',
                  borderRadius: '2px',
                  padding: '0.2rem 0.5rem',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {slug}
              </span>
            ))}
          </div>
        </div>
      )}


    </main>
  );
}
