'use client';
// MALINDRA PHASE 5
// components/ContentGate.tsx
// Static-compatible tier upgrade prompt and usage meter.
// Renders gate overlay when user lacks required subscription tier.

import type React from 'react';
import { useEffect, useState } from 'react';

export type Tier = 'free' | 'signal' | 'sovereign' | 'enterprise';

interface TierFeature {
  label: string;
  free: boolean | string;
  signal: boolean | string;
  sovereign: boolean | string;
  enterprise: boolean | string;
}

const TIER_ORDER: Tier[] = ['free', 'signal', 'sovereign', 'enterprise'];

const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  signal: 'Signal — $29/mo',
  sovereign: 'Sovereign — $149/mo',
  enterprise: 'Enterprise',
};

const TIER_COLORS: Record<Tier, string> = {
  free: 'var(--color-warm-stone)',
  signal: 'var(--color-zheng-he)',
  sovereign: 'var(--color-temple-gold)',
  enterprise: 'var(--color-zheng-he)',
};

const FEATURES: TierFeature[] = [
  { label: 'Signal Summaries', free: true, signal: true, sovereign: true, enterprise: true },
  { label: 'Full Signal Depth', free: false, signal: true, sovereign: true, enterprise: true },
  { label: 'Scenario Engine', free: false, signal: true, sovereign: true, enterprise: true },
  { label: 'Raw Data Export', free: false, signal: true, sovereign: true, enterprise: true },
  { label: 'Multilateral Data', free: false, signal: false, sovereign: true, enterprise: true },
  { label: 'API Access', free: '500 calls', signal: '5K calls', sovereign: '50K calls', enterprise: '500K calls' },
  { label: 'White-label Briefs', free: false, signal: false, sovereign: false, enterprise: true },
  { label: 'Support', free: 'Community', signal: 'Email', sovereign: 'Priority', enterprise: 'Dedicated' },
];

interface ContentGateProps {
  requiredTier: Tier;
  /** If user already has a token, pass it in to skip the gate */
  accessToken?: string;
  /** Content to show when access is granted */
  children: React.ReactNode;
  /** Optional label describing the gated content */
  contentLabel?: string;
  locale?: 'en' | 'si';
}

const LABELS = {
  en: {
    lockedTitle: 'Gated Intelligence',
    lockedBody: 'This analysis requires a higher-tier subscription.',
    currentTier: 'Your tier',
    requiredTier: 'Required tier',
    upgrade: 'Upgrade Access',
    compareAll: 'Compare all plans',
    features: 'Plan Features',
    yes: '✓',
    no: '–',
    heritageTag: 'Malindra · Sovereign Intelligence Platform',
  },
  si: {
    lockedTitle: 'සීමිත බුද්ධිය',
    lockedBody: 'මෙම විශ්ලේෂණයට ඉහළ දායකත්ව ශ්‍රේණිය අවශ්‍ය වේ.',
    currentTier: 'ඔබේ ශ්‍රේණිය',
    requiredTier: 'අවශ්‍ය ශ්‍රේණිය',
    upgrade: 'ප්‍රවේශය වැඩිදියුණු කරන්න',
    compareAll: 'සියළු සැලසුම් සංසන්දනය කරන්න',
    features: 'සැලසුම් ලක්ෂණ',
    yes: '✓',
    no: '–',
    heritageTag: 'මලින්ද්‍ර · ස්වෛරී බුද්ධිය',
  },
};

function tierRank(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

/** Hook: resolve tier from X-Access-Token via /api/subscriptions/verify */
function useTierFromToken(token: string | undefined): { tier: Tier; loading: boolean } {
  const [tier, setTier] = useState<Tier>('free');
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/subscriptions/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: '', access_token: token }),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setTier((data.tier as Tier) || 'free');
        }
      } catch {
        // network error → default free
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { tier, loading };
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <span style={{ color: 'var(--color-water-fortress)' }}>✓</span>;
  if (value === false) return <span style={{ color: 'var(--color-warm-stone)' }}>–</span>;
  return <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>{value}</span>;
}

export function ContentGate({
  requiredTier,
  accessToken,
  children,
  contentLabel: _contentLabel = 'Intelligence Report',
  locale = 'en',
}: ContentGateProps) {
  const { tier, loading } = useTierFromToken(accessToken);
  const L = LABELS[locale];

  if (loading) {
    return (
      <div
        style={{
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--theme-text-muted)',
          fontSize: '0.875rem',
        }}
        role="status"
        aria-live="polite"
      >
        <span>Verifying access…</span>
      </div>
    );
  }

  // Access granted
  if (tierRank(tier) >= tierRank(requiredTier)) {
    return <>{children}</>;
  }

  // Render gate
  return (
    <section
      aria-label={L.lockedTitle}
      style={{
        position: 'relative',
        border: '1px solid var(--theme-border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        background: 'var(--theme-bg-surface)',
      }}
    >
      {/* Blurred preview */}
      <div
        style={{
          filter: 'blur(6px)',
          opacity: 0.35,
          pointerEvents: 'none',
          userSelect: 'none',
          maxHeight: '10rem',
          overflow: 'hidden',
          padding: '1.5rem',
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Gate overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 10, 13, 0.85)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        {/* Lock icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TIER_COLORS[requiredTier]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>

        <div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--theme-text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            {L.lockedTitle}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--theme-text-muted)', margin: 0 }}>{L.lockedBody}</p>
        </div>

        {/* Tier badges */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
            {L.currentTier}:{' '}
            <span
              style={{
                fontWeight: 600,
                color: TIER_COLORS[tier],
                padding: '0.125rem 0.5rem',
                border: `1px solid ${TIER_COLORS[tier]}`,
                borderRadius: '9999px',
              }}
            >
              {TIER_LABELS[tier]}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
            {L.requiredTier}:{' '}
            <span
              style={{
                fontWeight: 600,
                color: TIER_COLORS[requiredTier],
                padding: '0.125rem 0.5rem',
                border: `1px solid ${TIER_COLORS[requiredTier]}`,
                borderRadius: '9999px',
              }}
            >
              {TIER_LABELS[requiredTier]}
            </span>
          </div>
        </div>

        {/* CTA */}
        <a
          href="/subscribe"
          style={{
            display: 'inline-block',
            padding: '0.625rem 1.5rem',
            background: TIER_COLORS[requiredTier],
            color: 'var(--color-ola-leaf)',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={(e) => ((e.target as HTMLElement).style.opacity = '0.85')}
          onMouseOut={(e) => ((e.target as HTMLElement).style.opacity = '1')}
          onFocus={(e) => ((e.target as HTMLElement).style.opacity = '0.85')}
          onBlur={(e) => ((e.target as HTMLElement).style.opacity = '1')}
        >
          {L.upgrade}
        </a>

        <a
          href="/subscribe#compare"
          style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', textDecoration: 'underline' }}
        >
          {L.compareAll}
        </a>
      </div>

      {/* Feature table below the gate */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--theme-border)' }}>
        <h4
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--theme-text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          {L.features}
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}
            aria-label="Plan features comparison"
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.25rem 0.5rem',
                    color: 'var(--theme-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  Feature
                </th>
                {TIER_ORDER.map((t) => (
                  <th
                    key={t}
                    style={{
                      textAlign: 'center',
                      padding: '0.25rem 0.5rem',
                      color: t === requiredTier ? TIER_COLORS[t] : 'var(--theme-text-muted)',
                      fontWeight: t === requiredTier ? 700 : 400,
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.label} style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <td style={{ padding: '0.25rem 0.5rem', color: 'var(--theme-text-primary)' }}>{f.label}</td>
                  {TIER_ORDER.map((t) => (
                    <td key={t} style={{ textAlign: 'center', padding: '0.25rem 0.5rem' }}>
                      <FeatureValue value={f[t]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)', marginTop: '1rem', textAlign: 'center' }}>
          {L.heritageTag}
        </p>
      </div>
    </section>
  );
}

/** Inline usage meter for API quota display */
export function UsageMeter({
  used,
  quota,
  tier,
  label = 'API calls this month',
}: {
  used: number;
  quota: number;
  tier: Tier;
  label?: string;
}) {
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
  const color = pct >= 90 ? 'var(--color-war-banner)' : pct >= 70 ? 'var(--color-temple-gold)' : TIER_COLORS[tier];

  return (
    // biome-ignore lint/a11y/useSemanticElements: custom styled meter with div
    <div
      style={{ fontSize: '0.75rem' }}
      role="meter"
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={quota}
      aria-label={label}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.25rem',
          color: 'var(--theme-text-muted)',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          {used.toLocaleString()} / {quota.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          height: '4px',
          background: 'var(--theme-border)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '2px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

export default ContentGate;
