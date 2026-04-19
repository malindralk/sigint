// MALINDRA PHASE 2
// components/SigintCrossRef.tsx
// Renders a "Related Intelligence" card with cross-referenced signals.
// Injected at build time by app/blog/[slug]/page.tsx — not a client component.

import Link from 'next/link';
import type { Signal } from '@/lib/sigint';
import { getBadgeVariant } from '@/lib/sigint';

interface SigintCrossRefProps {
  signals: Signal[];
  locale?: string;
}

export default function SigintCrossRef({ signals, locale = 'en' }: SigintCrossRefProps) {
  if (signals.length === 0) return null;

  const label = locale === 'si' ? 'අදාළ බුද්ධිය' : 'Related Intelligence';
  const heritageText = locale === 'si' ? 'මලින්ද්‍ර' : 'Malindra · මලින්ද්‍ර';

  return (
    <aside
      className="card"
      style={{ marginTop: 'var(--spacing-2xl)', padding: 'var(--spacing-lg)' }}
      aria-label={label}
    >
      <div className="card-accent card-accent-maroon" />
      <div className="t-label" style={{ marginBottom: 'var(--spacing-md)' }}>
        {label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {signals.map((signal) => (
          <Link
            key={signal.slug}
            href={`/blog/${signal.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-xs)',
              padding: 'var(--spacing-sm) var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              transition: 'background-color 150ms ease',
            }}
            className="card-link-row"
          >
            {/* Tags row */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              {signal.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={`badge ${getBadgeVariant(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
            {/* Title */}
            <span
              className="t-muted"
              style={{
                fontSize: '14px',
                color: 'var(--color-parchment)',
                lineHeight: 1.4,
              }}
            >
              {signal.title}
            </span>
            {/* Date */}
            <time dateTime={signal.date} className="t-muted" style={{ fontSize: '11px' }}>
              {new Date(signal.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </Link>
        ))}
      </div>

      <div className="t-heritage" style={{ marginTop: 'var(--spacing-md)' }}>
        {heritageText}
      </div>
    </aside>
  );
}
