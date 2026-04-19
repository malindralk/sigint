'use client';

// MALINDRA PHASE 3
// components/LeadCaptureForm.tsx
// Full lead capture with name, email, org, role, topics, GDPR consent.
// POSTs to FastAPI /api/leads/capture.
// Sinhala/English parity with t-label, t-sinhala-logo, input classes.

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { detectLocale } from '@/lib/i18n';

const TOPICS = ['debt', 'digital', 'tourism', 'geopolitics', 'energy'] as const;
type Topic = (typeof TOPICS)[number];

const ROLES = ['analyst', 'journalist', 'researcher', 'policymaker', 'investor', 'student', 'other'] as const;

const LABELS = {
  en: {
    heading: 'Intelligence Subscription',
    subheading: 'Join analysts and policymakers tracking the Laccadive Sea signal.',
    nameLabel: 'Full Name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your@email.com',
    orgLabel: 'Organization',
    orgPlaceholder: 'Optional',
    roleLabel: 'Your Role',
    topicsLabel: 'Topics of Interest',
    consentLabel: 'I consent to receive intelligence dispatches and understand data is handled per the privacy policy.',
    submit: 'Subscribe to Dispatch',
    submitting: 'Subscribing…',
    success: 'Confirmed. The signal will reach you.',
    error: 'Subscription failed. Please try again.',
    topicNames: {
      debt: 'Debt Restructuring',
      digital: 'Digital Policy',
      tourism: 'Tourism',
      geopolitics: 'Geopolitics',
      energy: 'Renewable Energy',
    },
    roleNames: {
      analyst: 'Analyst',
      journalist: 'Journalist',
      researcher: 'Researcher',
      policymaker: 'Policymaker',
      investor: 'Investor',
      student: 'Student',
      other: 'Other',
    },
  },
  si: {
    heading: 'බුද්ධිය දායකත්වය',
    subheading: 'ඉන්දියන් සාගර සංඥාව අනුගමනය කරන විශ්ලේෂකයින් සහ ප්‍රතිපත්ති立案ිදේශකයින් සමඟ එකතු වන්න.',
    nameLabel: 'සම්පූර්ණ නම',
    namePlaceholder: 'ඔබේ නම',
    emailLabel: 'විද්‍යුත් ලිපිනය',
    emailPlaceholder: 'ඔබේ@email.com',
    orgLabel: 'සංවිධානය',
    orgPlaceholder: 'අවශ්‍ය නම්',
    roleLabel: 'ඔබගේ භූමිකාව',
    topicsLabel: 'ඔබේ රුචිතා මාතෘකා',
    consentLabel: 'මම රහස්‍යතා ප්‍රතිපත්තිය අනුව දත්ත හැසිරවීම සහ බුද්ධිය ලිපිය ලැබීමට එකඟ වෙමි.',
    submit: 'දායකත්වයට සදස්‍ය වන්න',
    submitting: 'සලකා බලමින්…',
    success: 'තහවුරු කෙරිණ. සංඥාව ඔබ වෙත ළඟා වේ.',
    error: 'දායකත්වය අසාර්ථක විය. නැවත උත්සාහ කරන්න.',
    topicNames: {
      debt: 'ණය ප්‍රතිව්‍යූහගත',
      digital: 'ඩිජිටල් ප්‍රතිපත්ති',
      tourism: 'සංචාරක',
      geopolitics: 'භූ-දේශපාලන',
      energy: 'බලශක්ති',
    },
    roleNames: {
      analyst: 'විශ්ලේෂක',
      journalist: 'මාධ්‍යවේදී',
      researcher: 'පර්යේෂක',
      policymaker: 'ප්‍රතිපත්ති立案ිදේශක',
      investor: 'ආයෝජක',
      student: 'ශිෂ්‍ය',
      other: 'වෙනත්',
    },
  },
};

export default function LeadCaptureForm() {
  const pathname = usePathname();
  const locale = detectLocale(pathname) as 'en' | 'si';
  const t = LABELS[locale] ?? LABELS.en;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [role, setRole] = useState<string>('other');
  const [topics, setTopics] = useState<Set<Topic>>(new Set());
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

  function toggleTopic(topic: Topic) {
    setTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setStatus('loading');
    try {
      const res = await fetch(`${apiBase}/api/leads/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          organization: org.trim() || null,
          role,
          topics: [...topics],
          locale,
          consent: true,
        }),
      });
      if (!res.ok) throw new Error('Non-OK');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="card" style={{ padding: '32px 28px', textAlign: 'center' }}>
        <div className="card-accent card-accent-gold" />
        <div className="t-sinhala-logo" style={{ fontSize: '28px', marginBottom: '12px' }}>
          {'\u0DB8\u0DBD\u0DD2\u0DB1\u0DCA\u0DAF\u0DCA\u200D\u0DBB'}
        </div>
        <p className="t-body" style={{ marginBottom: '8px' }}>
          {t.success}
        </p>
        <p className="t-heritage">{locale === 'en' ? 'Malindra · මලින්ද්‍ර' : 'මලින්ද්‍ර'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '28px 24px' }}>
      <div className="card-accent card-accent-maroon" />

      {/* Heading */}
      <div style={{ marginBottom: '20px' }}>
        <div className="t-eyebrow" style={{ marginBottom: '8px' }}>
          {t.heading}
        </div>
        <p className="t-muted">{t.subheading}</p>
      </div>

      {/* Name */}
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="lead-name" className="input-label">
          {t.nameLabel}
        </label>
        <input
          id="lead-name"
          className="input"
          type="text"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
        />
      </div>

      {/* Email */}
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="lead-email" className="input-label">
          {t.emailLabel}
        </label>
        <input
          id="lead-email"
          className="input"
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          required
        />
      </div>

      {/* Organization */}
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="lead-org" className="input-label">
          {t.orgLabel}
        </label>
        <input
          id="lead-org"
          className="input"
          type="text"
          placeholder={t.orgPlaceholder}
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Role */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="lead-role" className="input-label">
          {t.roleLabel}
        </label>
        <select
          id="lead-role"
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {(t.roleNames as Record<string, string>)[r] ?? r}
            </option>
          ))}
        </select>
      </div>

      {/* Topics */}
      <div style={{ marginBottom: '16px' }}>
        <div className="input-label" style={{ marginBottom: '8px' }}>
          {t.topicsLabel}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {TOPICS.map((topic) => {
            const active = topics.has(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: active ? 600 : 400,
                  borderRadius: '9999px',
                  border: `1px solid ${active ? 'var(--color-temple-gold)' : 'var(--color-border-default)'}`,
                  background: active ? 'color-mix(in srgb, var(--color-temple-gold) 12%, transparent)' : 'none',
                  color: active ? 'var(--color-temple-gold)' : 'var(--color-warm-stone)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {(t.topicNames as Record<string, string>)[topic] ?? topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Consent */}
      <label
        style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          style={{ marginTop: '3px', accentColor: 'var(--color-sinha-maroon)', flexShrink: 0 }}
        />
        <span className="t-muted" style={{ fontSize: '12px', lineHeight: 1.5 }}>
          {t.consentLabel}
        </span>
      </label>

      {status === 'error' && (
        <p className="t-muted" style={{ color: 'var(--color-war-banner)', fontSize: '12px', marginBottom: '10px' }}>
          {t.error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={!consent || !name.trim() || !email.trim() || status === 'loading'}
      >
        {status === 'loading' ? t.submitting : t.submit}
      </button>
    </form>
  );
}
