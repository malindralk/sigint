// MALINDRA PHASE 2
// components/NewsletterForm.tsx
// Newsletter capture with topic segmentation.
// Locale-aware labels: passes `locale` prop for Sinhala/English toggle.
// POSTs to FastAPI /api/newsletter/subscribe with { email, topics[] }.
// Static-export safe: no SSR, client component only.

'use client';

import { useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { getUI } from '@/lib/i18n';

const SUBSCRIBE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/newsletter/subscribe`
  : '/api/newsletter/subscribe';

type Status = 'idle' | 'loading' | 'success' | 'error';

const TOPIC_IDS = ['debt', 'digital', 'tourism', 'geopolitics', 'energy'] as const;
type TopicId = (typeof TOPIC_IDS)[number];

const _TOPIC_ACCENT: Record<TopicId, string> = {
  debt: 'card-accent-gold',
  digital: 'card-accent-blue',
  tourism: 'card-accent-green',
  geopolitics: 'card-accent-maroon',
  energy: 'card-accent-green',
};

interface NewsletterFormProps {
  locale?: Locale;
}

export default function NewsletterForm({ locale = 'en' }: NewsletterFormProps) {
  const t = getUI(locale);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [topics, setTopics] = useState<TopicId[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function toggleTopic(id: TopicId) {
    setTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const data = new FormData(e.currentTarget);
    const email = data.get('email')?.toString().trim() ?? '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch(SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, topics }),
      });

      if (res.ok) {
        setStatus('success');
        setTopics([]);
        formRef.current?.reset();
      } else {
        const body = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage((body as { detail?: string }).detail ?? t.subscribeError);
      }
    } catch {
      setStatus('error');
      setErrorMessage(t.networkError);
    }
  }

  return (
    <div className="card" style={{ maxWidth: '560px', padding: 'var(--spacing-xl)' }}>
      <div className="card-accent card-accent-maroon" />

      <div className="t-eyebrow" style={{ marginBottom: 'var(--spacing-sm)' }}>
        {t.subscribeLabel}
      </div>
      <h2 className="t-heading" style={{ marginBottom: 'var(--spacing-sm)' }}>
        {t.subscribeHeading}
      </h2>
      <p className="t-body" style={{ marginBottom: 'var(--spacing-lg)' }}>
        {t.subscribeBody}
      </p>

      {/* Success state */}
      {status === 'success' && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-md)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13.5 4.5L6.5 11.5L2.5 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t.subscribeSuccess}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-md)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />
          </svg>
          {errorMessage}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {/* Email row */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="newsletter-email" className="input-label" style={{ marginBottom: '6px' }}>
              {t.emailLabel}
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              className="input"
              placeholder={t.emailPlaceholder}
              required
              autoComplete="email"
              disabled={status === 'loading'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'loading'}
              aria-busy={status === 'loading'}
            >
              {status === 'loading' ? t.subscribing : t.subscribeCta}
            </button>
          </div>
        </div>

        {/* Topic segmentation */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 'var(--spacing-sm)', fontSize: '11px' }}>
            {t.topicsLabel}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-xs)',
            }}
          >
            {TOPIC_IDS.map((id) => {
              const selected = topics.includes(id);
              return (
                <label
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: selected ? '1px solid var(--color-sinha-maroon)' : '1px solid var(--color-border-default)',
                    background: selected
                      ? 'color-mix(in srgb, var(--color-sinha-maroon) 10%, transparent)'
                      : 'transparent',
                    transition: 'all 150ms ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleTopic(id)}
                    style={{ display: 'none' }}
                    aria-label={t.topics[id]}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: selected ? 'var(--color-sinha-maroon)' : 'var(--color-warm-stone)',
                      transition: 'background 150ms ease',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: locale === 'si' ? '12px' : '11px',
                      fontWeight: selected ? 600 : 400,
                      letterSpacing: locale === 'si' ? '0' : '0.06em',
                      textTransform: locale === 'si' ? 'none' : 'uppercase',
                      color: selected ? 'var(--color-parchment)' : 'var(--color-warm-stone)',
                    }}
                  >
                    {t.topics[id]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </form>

      <p className="t-muted" style={{ fontSize: '11px', marginTop: 'var(--spacing-md)' }}>
        {t.privacyNote}
      </p>
    </div>
  );
}
