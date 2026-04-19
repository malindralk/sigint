'use client';
// MALINDRA PHASE 4
// components/ScenarioPanel.tsx
// Renders pre-computed AI scenario predictions.
// Labels: [MODEL v1.0] + [ANALYSIS]
// Shows confidence intervals, risk direction, forecast quarters.
// Uses brand token CSS variables throughout.

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface ConfidenceScore {
  mean: number;
  p10: number;
  p50: number;
  p90: number;
  std: number;
  ci_width: number;
}

interface Scenario {
  topic: string;
  signal: string;
  context: string;
  implication: string;
  action: string;
  confidence: ConfidenceScore;
  forecast_quarters: number[];
  risk_direction: 'increasing' | 'decreasing';
}

interface Prediction {
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
  };
}

interface ScenarioPanelProps {
  slug: string;
  locale?: 'en' | 'si';
}

const LABELS = {
  en: {
    heading: 'Scenario Analysis',
    signal: 'Signal',
    context: 'Context',
    implication: 'Implication',
    action: 'Action',
    confidence: 'Confidence',
    forecast: 'Forecast (Q)',
    riskDir: 'Risk Direction',
    increasing: 'Increasing',
    decreasing: 'Decreasing',
    methodology: 'Methodology',
    disclaimer: 'Disclaimer',
    loading: 'Loading scenario analysis…',
    error: 'Scenario data unavailable.',
    heritage: 'Malindra · මලින්ද්‍ර',
    confidenceLabels: {
      HIGH: 'High Confidence',
      MEDIUM: 'Medium Confidence',
      LOW: 'Low Confidence',
    } as Record<string, string>,
    topicLabels: {
      debt: 'Debt',
      digital: 'Digital',
      tourism: 'Tourism',
      geopolitics: 'Geopolitics',
      energy: 'Energy',
    } as Record<string, string>,
  },
  si: {
    heading: 'දර්ශනය විශ්ලේෂණය',
    signal: 'සංඥාව',
    context: 'සන්දර්භය',
    implication: 'ඇඟවීම',
    action: 'ක්‍රියාව',
    confidence: 'විශ්වාසය',
    forecast: 'අනාවැකිය (කාර්තු)',
    riskDir: 'අවදානම් දිශාව',
    increasing: 'වැඩිවෙමින්',
    decreasing: 'අඩුවෙමින්',
    methodology: 'ක්‍රමවේදය',
    disclaimer: 'වියාචනය',
    loading: 'දර්ශනය විශ්ලේෂණය පූරණය වෙමින්…',
    error: 'දර්ශනය දත්ත නොමැත.',
    heritage: 'මලින්ද්‍ර · කෝට්ටේ රාජධානිය 1412–1467',
    confidenceLabels: {
      HIGH: 'ඉහළ විශ්වාසය',
      MEDIUM: 'මධ්‍ය විශ්වාසය',
      LOW: 'අඩු විශ්වාසය',
    } as Record<string, string>,
    topicLabels: {
      debt: 'ණය',
      digital: 'ඩිජිටල්',
      tourism: 'සංචාරක',
      geopolitics: 'භූ-දේශපාලන',
      energy: 'බලශක්ති',
    } as Record<string, string>,
  },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: 'var(--color-temple-gold)',
  MEDIUM: 'var(--color-zheng-he)',
  LOW: 'var(--color-sinha-maroon)',
};

const TOPIC_COLORS: Record<string, string> = {
  debt: 'var(--color-temple-gold)',
  digital: 'var(--color-zheng-he)',
  tourism: 'var(--color-water-fortress)',
  geopolitics: 'var(--color-sinha-maroon)',
  energy: 'var(--color-water-fortress)',
};

function ConfidenceBar({ score }: { score: ConfidenceScore }) {
  const pct = Math.round(score.mean * 100);
  return (
    <div style={{ margin: '0.5rem 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--color-parchment)',
          marginBottom: '0.25rem',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span>P10: {Math.round(score.p10 * 100)}%</span>
        <span>Mean: {pct}%</span>
        <span>P90: {Math.round(score.p90 * 100)}%</span>
      </div>
      <div
        style={{
          height: '6px',
          background: 'var(--color-surface)',
          borderRadius: '3px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'var(--color-temple-gold)',
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

function ForecastSparkline({ quarters }: { quarters: number[] }) {
  const W = 120;
  const H = 32;
  const pad = 4;
  const min = Math.min(...quarters);
  const max = Math.max(...quarters);
  const range = max - min || 0.01;
  const pts = quarters.map((v, i) => {
    const x = pad + (i / (quarters.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} aria-label="Forecast sparkline">
      <rect width={W} height={H} fill="var(--color-surface)" rx="2" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="var(--color-temple-gold)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {quarters.map((v, i) => {
        const x = pad + (i / (quarters.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v - min) / range) * (H - pad * 2);
        // biome-ignore lint/suspicious/noArrayIndexKey: positional SVG data points
        return <circle key={`pt-${i}`} cx={x} cy={y} r="2.5" fill="var(--color-temple-gold)" />;
      })}
    </svg>
  );
}

export default function ScenarioPanel({ slug, locale = 'en' }: ScenarioPanelProps) {
  const t = LABELS[locale];
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`${API_BASE}/api/ai/predictions/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json() as Promise<Prediction>;
      })
      .then((d) => {
        setPrediction(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div
        style={{
          padding: '1.5rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          color: 'var(--color-stone)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.85rem',
        }}
      >
        {t.loading}
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div
        style={{
          padding: '1.5rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          color: 'var(--color-stone)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.85rem',
        }}
      >
        {t.error}
      </div>
    );
  }

  const confColor = CONFIDENCE_COLORS[prediction.aggregate_confidence.label] ?? 'var(--color-stone)';
  const confLabel = t.confidenceLabels[prediction.aggregate_confidence.label] ?? prediction.aggregate_confidence.label;

  return (
    <section
      aria-label={t.heading}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        padding: '1.5rem',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-ola)',
            letterSpacing: '0.04em',
          }}
        >
          {t.heading}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--color-temple-gold)',
              background: 'rgba(212,150,40,0.10)',
              border: '1px solid rgba(212,150,40,0.25)',
              borderRadius: '2px',
              padding: '0.1rem 0.4rem',
              letterSpacing: '0.06em',
            }}
          >
            {prediction.model_label}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              color: confColor,
              background: `color-mix(in srgb, ${confColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${confColor} 30%, transparent)`,
              borderRadius: '2px',
              padding: '0.1rem 0.4rem',
              letterSpacing: '0.06em',
            }}
          >
            {confLabel} · {Math.round(prediction.aggregate_confidence.mean * 100)}%
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--color-stone)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {prediction.analysis_label}
          </span>
        </div>
      </div>

      {/* Topic badges */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {prediction.topics_detected.map((topic) => (
          <span
            key={topic}
            style={{
              fontSize: '0.65rem',
              color: TOPIC_COLORS[topic] ?? 'var(--color-parchment)',
              background: `color-mix(in srgb, ${TOPIC_COLORS[topic] ?? 'var(--color-parchment)'} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${TOPIC_COLORS[topic] ?? 'var(--color-parchment)'} 25%, transparent)`,
              borderRadius: '2px',
              padding: '0.1rem 0.4rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {t.topicLabels[topic] ?? topic}
          </span>
        ))}
      </div>

      {/* Scenarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {prediction.scenarios.map((sc) => (
          <div
            key={sc.signal}
            style={{
              borderLeft: `3px solid ${TOPIC_COLORS[sc.topic] ?? 'var(--color-border)'}`,
              paddingLeft: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-stone)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {t.topicLabels[sc.topic] ?? sc.topic}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color:
                    sc.risk_direction === 'increasing'
                      ? 'var(--color-war-banner, #be3348)'
                      : 'var(--color-water-fortress, #28805e)',
                  letterSpacing: '0.04em',
                }}
              >
                ↑ {sc.risk_direction === 'increasing' ? t.increasing : t.decreasing}
              </span>
            </div>

            {/* SIGINT blocks */}
            {(
              [
                { label: t.signal, value: sc.signal, accent: 'var(--color-temple-gold)' },
                { label: t.context, value: sc.context, accent: 'var(--color-zheng-he)' },
                { label: t.implication, value: sc.implication, accent: 'var(--color-sinha-maroon)' },
                { label: t.action, value: sc.action, accent: 'var(--color-water-fortress)' },
              ] as { label: string; value: string; accent: string }[]
            ).map(({ label, value, accent }) => (
              <div key={label} style={{ marginBottom: '0.6rem' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  [{label}]
                </span>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-parchment)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {value}
                </p>
              </div>
            ))}

            {/* Confidence + forecast */}
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: '1', minWidth: '160px' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--color-stone)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t.confidence}
                </span>
                <ConfidenceBar score={sc.confidence} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--color-stone)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t.forecast}
                </span>
                <ForecastSparkline quarters={sc.forecast_quarters} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Methodology note */}
      <div
        style={{
          marginTop: '1.25rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.7rem',
          color: 'var(--color-stone)',
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: 'var(--color-temple-gold)' }}>{t.methodology}:</span> {prediction.meta.methodology} ·{' '}
        {prediction.meta.forecast_horizon_quarters}Q horizon
        <br />
        <span style={{ color: 'var(--color-war-banner, #be3348)' }}>{t.disclaimer}:</span> {prediction.meta.disclaimer}
      </div>

      {/* Heritage footer */}
      <div
        style={{
          marginTop: '0.75rem',
          fontSize: '0.65rem',
          color: 'var(--color-stone)',
          opacity: 0.45,
          fontFamily: 'var(--font-display)',
          textAlign: 'center',
          letterSpacing: '0.08em',
        }}
      >
        {t.heritage}
      </div>
    </section>
  );
}
