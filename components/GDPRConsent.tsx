'use client';
// MALINDRA PHASE 3
// components/GDPRConsent.tsx
// Static GDPR consent banner with localStorage persistence.
// Blocks analytics until consent=granted.
// Logs consent decision to FastAPI /api/consent/log (fire-and-forget).
// Sinhala/English parity.

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'malindra-consent';
const CONSENT_VERSION = 'v1';

const LABELS = {
  en: {
    heading: 'Intelligence Platform Notice',
    body: 'We use anonymous analytics to understand which intelligence topics matter most to our readers. No personal data is sold or shared. You can withdraw consent at any time.',
    accept: 'Accept Analytics',
    decline: 'Decline',
    learnMore: 'Privacy Policy',
    withdrawn: 'Analytics preferences updated.',
  },
  si: {
    heading: 'බුද්ධිය වේදිකා දැනුම්දීම',
    body: 'අපේ පාඨකයින්ට වඩාත් වැදගත් බුද්ධිය මාතෘකා හඳුනා ගැනීමට අපි නිර්නාමික විශ්ලේෂණ භාවිතා කරමු. ඔබගේ දත්ත අලෙවි නොකෙරේ.',
    accept: 'විශ්ලේෂණ පිළිගන්න',
    decline: 'ප්‍රතික්ෂේප කරන්න',
    learnMore: 'රහස්‍යතා ප්‍රතිපත්තිය',
    withdrawn: 'ප්‍රතිපත්ති යාවත්කාලීන කෙරිණ.',
  },
};

type ConsentState = 'granted' | 'declined' | 'pending';

interface GDPRConsentProps {
  locale?: 'en' | 'si';
}

export default function GDPRConsent({ locale = 'en' }: GDPRConsentProps) {
  const t = LABELS[locale] ?? LABELS.en;
  const [visible, setVisible] = useState(false);
  const [_decided, setDecided] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function logConsent(decision: ConsentState) {
    // Fire-and-forget audit log
    fetch(`${apiBase}/api/consent/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        version: CONSENT_VERSION,
        locale,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  function decide(decision: 'granted' | 'declined') {
    try {
      localStorage.setItem(CONSENT_KEY, decision);
      localStorage.setItem(`${CONSENT_KEY}-version`, CONSENT_VERSION);
      localStorage.setItem(`${CONSENT_KEY}-timestamp`, new Date().toISOString());
    } catch {}
    setVisible(false);
    setDecided(true);
    logConsent(decision);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-heading"
      aria-describedby="consent-body"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        width: 'min(520px, calc(100vw - 32px))',
        background: 'var(--color-manuscript)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'var(--color-temple-gold)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      />

      <div id="consent-heading" className="t-label" style={{ marginBottom: '8px' }}>
        {t.heading}
      </div>

      <p id="consent-body" className="t-muted" style={{ marginBottom: '16px', lineHeight: 1.55 }}>
        {t.body}{' '}
        <a href="/privacy" style={{ color: 'var(--color-zheng-he)', textDecoration: 'underline', fontSize: '13px' }}>
          {t.learnMore}
        </a>
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => decide('granted')}
          style={{ flex: 1, justifyContent: 'center', minWidth: '140px' }}
        >
          {t.accept}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => decide('declined')}
          style={{ minWidth: '100px' }}
        >
          {t.decline}
        </button>
      </div>

      <div className="t-heritage" style={{ marginTop: '12px', paddingTop: '8px' }}>
        {locale === 'en' ? 'Malindra · මලින්ද්‍ර' : 'මලින්ද්‍ර'}
      </div>
    </div>
  );
}
