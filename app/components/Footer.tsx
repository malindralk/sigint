'use client';
// MALINDRA PHASE 1

import Link from 'next/link';
import { useConsent } from '@/app/hooks/useConsent';
import { useLocale } from '@/app/hooks/useLocale';

export default function Footer() {
  const { hasDecided } = useConsent();
  const { nav } = useLocale();

  // If user has made a consent decision, show minimal footer
  if (hasDecided) {
    return (
      <footer
        className="global-footer"
        style={{
          width: '100%',
          padding: '12px var(--spacing-xl)',
          borderTop: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--theme-bg-surface)',
          flexShrink: 0,
        }}
      >
        <div
          className="footer-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Brand */}
          <div
            className="t-muted footer-brand"
            style={{
              fontSize: '13px',
            }}
          >
            මලින්ද්‍ර
          </div>

          {/* Right: Links */}
          <div className="footer-links" style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
            <Link
              href="/privacy"
              className="t-muted"
              style={{
                fontSize: '13px',
                transition: 'opacity 150ms ease',
              }}
            >
              {nav.privacy}
            </Link>
            <Link
              href="/terms"
              className="t-muted"
              style={{
                fontSize: '13px',
                transition: 'opacity 150ms ease',
              }}
            >
              {nav.terms}
            </Link>
            <Link
              href="/contact"
              className="t-muted"
              style={{
                fontSize: '13px',
                transition: 'opacity 150ms ease',
              }}
            >
              {nav.contact}
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  // Full footer shown before consent decision
  return (
    <footer
      className="global-footer"
      style={{
        width: '100%',
        padding: 'var(--spacing-xl) var(--spacing-2xl)',
        borderTop: '1px solid var(--color-border-default)',
        backgroundColor: 'var(--theme-bg-surface)',
        flexShrink: 0,
      }}
    >
      <div
        className="footer-inner"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--spacing-lg)',
          }}
        >
          <div>
            <div className="t-label footer-brand" style={{ marginBottom: 'var(--spacing-sm)' }}>
              මලින්ද්‍ර
            </div>
            <div className="t-muted footer-description" style={{ maxWidth: '420px' }}>
              Data-driven socio-economic and geopolitical analysis for Sri Lanka and the Laccadive Sea region. Static,
              secure, and heritage-grounded.
            </div>
          </div>

          <div className="footer-links" style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
            <Link href="/privacy" className="t-muted" style={{ transition: 'opacity 150ms ease' }}>
              {nav.privacy}
            </Link>
            <Link href="/terms" className="t-muted" style={{ transition: 'opacity 150ms ease' }}>
              {nav.terms}
            </Link>
            <Link href="/contact" className="t-muted" style={{ transition: 'opacity 150ms ease' }}>
              {nav.contact}
            </Link>
          </div>
        </div>

        <div className="heritage-tag footer-heritage">මලින්ද්‍ර</div>
      </div>
    </footer>
  );
}
