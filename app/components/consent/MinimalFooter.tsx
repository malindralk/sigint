'use client';

import Link from 'next/link';
import { useConsent } from '@/app/hooks/useConsent';

export default function MinimalFooter() {
  const { hasDecided, resetConsent } = useConsent();

  // Only show minimal footer if user has given consent
  if (!hasDecided) {
    return null;
  }

  return (
    <footer
      style={{
        width: '100%',
        padding: '12px 20px',
        borderTop: '1px solid var(--color-border-default)',
        backgroundColor: 'var(--theme-bg-surface)',
        flexShrink: 0,
      }}
    >
      <div
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
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '13px',
            color: 'var(--color-warm-stone)',
          }}
        >
          මලින්ද්‍ර · Sovereign Intelligence
        </div>

        {/* Right: Links */}
        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
          <Link
            href="/privacy"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '13px',
              color: 'var(--color-warm-stone)',
              transition: 'opacity 150ms ease',
            }}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '13px',
              color: 'var(--color-warm-stone)',
              transition: 'opacity 150ms ease',
            }}
          >
            Terms
          </Link>
          <Link
            href="/contact"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '13px',
              color: 'var(--color-warm-stone)',
              transition: 'opacity 150ms ease',
            }}
          >
            Contact
          </Link>
          {/* Reset consent link - allows users to re-open the dialog */}
          <button
            onClick={resetConsent}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              color: 'var(--color-warm-stone)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              padding: 0,
              opacity: 0.7,
            }}
            title="Review privacy consent settings"
          >
            Cookie Settings
          </button>
        </div>
      </div>
    </footer>
  );
}
