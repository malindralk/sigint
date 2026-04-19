'use client';
// MALINDRA PHASE 5
// components/SignalProjection.tsx
// Renders pre-computed autonomous signal projections.
// Labels: [MODEL v2.0] + [ANALYSIS]
// Shows confidence intervals, trend direction, projected trajectory sparkline.
// Uses: --color-temple-gold (positive), --color-war-banner (risk)

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface SignalData {
  slug: string;
  model_version: string;
  model_label: string;
  analysis_label: string;
  generated_at: string;
  dominant_signal: string;
  signal_strength: number;
  all_signal_scores: Record<string, number>;
  trend_direction: 'escalating' | 'de-escalating' | 'stable';
  trend_slope: number;
  projected_trajectory: number[];
  confidence_interval: { mean: number; std: number; lower: number; upper: number };
  related_articles: Array<{ slug: string; similarity: number }>;
  prediction_ref: { slug: string; confidence_label: string } | null;
  meta: { methodology: string; disclaimer: string; articles_in_corpus: number };
}

interface Props {
  slug: string;
  locale?: 'en' | 'si';
}

const SIGNAL_LABELS: Record<string, string> = {
  geopolitical_risk: 'Geopolitical Risk',
  economic_stress: 'Economic Stress',
  digital_transformation: 'Digital Transformation',
  climate_resilience: 'Climate Resilience',
  social_cohesion: 'Social Cohesion',
};

const SIGNAL_COLORS: Record<string, string> = {
  geopolitical_risk: 'var(--color-sinha-maroon)',
  economic_stress: 'var(--color-temple-gold)',
  digital_transformation: 'var(--color-zheng-he)',
  climate_resilience: 'var(--color-water-fortress)',
  social_cohesion: 'var(--color-parchment)',
};

const TREND_META: Record<string, { label: string; color: string; icon: string }> = {
  escalating: { label: 'Escalating', color: 'var(--color-war-banner, #be3348)', icon: '↑' },
  'de-escalating': { label: 'De-escalating', color: 'var(--color-water-fortress)', icon: '↓' },
  stable: { label: 'Stable', color: 'var(--color-stone)', icon: '→' },
};

const LABELS = {
  en: {
    heading: 'Autonomous Signal Projection',
    dominantSignal: 'Dominant Signal',
    signalStrength: 'Signal Strength',
    trendDir: 'Trend Direction',
    projection: 'Projected Trajectory (Q1→Q4)',
    confidence: 'Confidence Interval',
    related: 'Related Signals',
    methodology: 'Methodology',
    disclaimer: 'Disclaimer',
    loading: 'Computing signal projection…',
    error: 'Signal data unavailable.',
    heritage: 'Malindra · මලින්ද්‍ර',
    allSignals: 'All Signal Scores',
  },
  si: {
    heading: 'ස්වාධීන සංඥා ප්‍රක්ෂේපණය',
    dominantSignal: 'ප්‍රධාන සංඥාව',
    signalStrength: 'සංඥා ශක්තිය',
    trendDir: 'ප්‍රවණතා දිශාව',
    projection: 'ප්‍රක්ෂේපිත ගමන් මාර්ගය',
    confidence: 'විශ්වාස කාල පරාසය',
    related: 'අදාළ සංඥා',
    methodology: 'ක්‍රමවේදය',
    disclaimer: 'වියාචනය',
    loading: 'සංඥා ගණනය කරමින්…',
    error: 'සංඥා දත්ත නොමැත.',
    heritage: 'මලින්ද්‍ර · කෝට්ටේ රාජධානිය 1412–1467',
    allSignals: 'සියළු සංඥා ලකුණු',
  },
};

function TrajectorySVG({ values }: { values: number[] }) {
  const W = 200, H = 48, pad = 6;
  if (!values.length) return null;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0.01);
  const range = max - min;
  const pts = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastPt = pts[pts.length - 1]?.split(',');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Signal trajectory sparkline" role="img">
      <rect width={W} height={H} fill="var(--color-surface)" rx="3" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="var(--color-temple-gold)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {lastPt && (
        <circle cx={lastPt[0]} cy={lastPt[1]} r="3.5" fill="var(--color-temple-gold)" />
      )}
    </svg>
  );
}

function StrengthBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{ height: '6px', background: 'var(--color-surface)', borderRadius: '3px', border: '1px solid var(--color-border)', overflow: 'hidden' }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          width: `${Math.round(value * 100)}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

export default function SignalProjection({ slug, locale = 'en' }: Props) {
  const t = LABELS[locale];
  const [data, setData] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    // Try signals endpoint first, fallback to predictions
    fetch(`${API_BASE}/api/ai/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, model_version: 'v2.0' }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<SignalData>; })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  const cardBase: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    padding: '1.5rem',
    fontFamily: 'var(--font-ui)',
  };

  if (loading) return (
    <div style={cardBase} aria-live="polite" aria-busy="true">
      <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>{t.loading}</span>
    </div>
  );

  if (error || !data) return (
    <div style={cardBase} role="alert">
      <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>{t.error}</span>
    </div>
  );

  const trendMeta = TREND_META[data.trend_direction] ?? TREND_META.stable;
  const sigColor = SIGNAL_COLORS[data.dominant_signal] ?? 'var(--color-parchment)';

  return (
    <section aria-label={t.heading} style={cardBase}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-ola)' }}>
          {t.heading}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.62rem', color: 'var(--color-temple-gold)',
            background: 'rgba(212,150,40,0.12)', border: '1px solid rgba(212,150,40,0.28)',
            borderRadius: '2px', padding: '0.1rem 0.4rem', letterSpacing: '0.06em',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {data.model_label}
          </span>
          <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', fontFamily: 'var(--font-mono, monospace)' }}>
            {data.analysis_label}
          </span>
        </div>
      </div>

      {/* Dominant signal + trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
            {t.dominantSignal}
          </span>
          <span style={{
            fontSize: '0.75rem', color: sigColor,
            background: `color-mix(in srgb, ${sigColor} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${sigColor} 25%, transparent)`,
            borderRadius: '2px', padding: '0.15rem 0.5rem', letterSpacing: '0.04em',
          }}>
            {SIGNAL_LABELS[data.dominant_signal] ?? data.dominant_signal}
          </span>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
              {t.signalStrength}
            </span>
            <StrengthBar value={data.signal_strength} color={sigColor} />
            <span style={{ fontSize: '0.65rem', color: 'var(--color-stone)', marginTop: '0.2rem', display: 'block' }}>
              {Math.round(data.signal_strength * 100)}%
            </span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
            {t.trendDir}
          </span>
          <span style={{ fontSize: '0.82rem', color: trendMeta.color, fontWeight: 600 }}>
            {trendMeta.icon} {trendMeta.label}
          </span>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
              {t.projection}
            </span>
            <TrajectorySVG values={data.projected_trajectory} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--color-stone)', marginTop: '0.2rem' }}>
              {data.projected_trajectory.map((v, i) => (
                <span key={i}>Q{i + 1}: {Math.round(v * 100)}%</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence interval */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '3px', padding: '0.75rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
          {t.confidence}
        </span>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Lower', value: data.confidence_interval.lower, color: 'var(--color-water-fortress)' },
            { label: 'Mean', value: data.confidence_interval.mean, color: 'var(--color-temple-gold)' },
            { label: 'Upper', value: data.confidence_interval.upper, color: 'var(--color-sinha-maroon)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <span style={{ fontSize: '0.6rem', color: 'var(--color-stone)', display: 'block' }}>{label}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
          <div>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-stone)', display: 'block' }}>±σ</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-parchment)', fontFamily: 'var(--font-display)' }}>
              {Math.round(data.confidence_interval.std * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* All signal scores */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
          {t.allSignals}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {Object.entries(data.all_signal_scores)
            .sort((a, b) => b[1] - a[1])
            .map(([sig, score]) => (
              <div key={sig} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: SIGNAL_COLORS[sig] ?? 'var(--color-parchment)', minWidth: '160px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {SIGNAL_LABELS[sig] ?? sig}
                </span>
                <div style={{ flex: 1, height: '4px', background: 'var(--color-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(score * 100)}%`, height: '100%', background: SIGNAL_COLORS[sig] ?? 'var(--color-parchment)', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-stone)', minWidth: '32px', textAlign: 'right' }}>{Math.round(score * 100)}%</span>
              </div>
            ))}
        </div>
      </div>

      {/* Related articles */}
      {data.related_articles.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
            {t.related}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {data.related_articles.slice(0, 5).map(r => (
              <span key={r.slug} style={{ fontSize: '0.65rem', color: 'var(--color-zheng-he)', background: 'rgba(61,116,168,0.08)', border: '1px solid rgba(61,116,168,0.22)', borderRadius: '2px', padding: '0.1rem 0.4rem', fontFamily: 'var(--font-mono, monospace)' }}>
                {r.slug} · {Math.round(r.similarity * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Methodology + disclaimer */}
      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', fontSize: '0.68rem', color: 'var(--color-stone)', lineHeight: 1.6 }}>
        <span style={{ color: 'var(--color-temple-gold)' }}>{t.methodology}:</span> {data.meta.methodology} · Corpus: {data.meta.articles_in_corpus} articles
        <br />
        <span style={{ color: 'var(--color-war-banner, #be3348)' }}>{t.disclaimer}:</span> {data.meta.disclaimer}
      </div>

      {/* Heritage */}
      <div style={{ marginTop: '0.75rem', fontSize: '0.62rem', color: 'var(--color-stone)', opacity: 0.45, fontFamily: 'var(--font-display)', textAlign: 'center', letterSpacing: '0.08em' }}>
        {t.heritage}
      </div>
    </section>
  );
}
