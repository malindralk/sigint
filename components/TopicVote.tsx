'use client';

// MALINDRA PHASE 3
// components/TopicVote.tsx
// Topic interest voting — static checkbox grid POSTing to FastAPI.
// Displays current percentage breakdown (from last build).

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { detectLocale, getUI } from '@/lib/i18n';

const TOPICS = ['debt', 'digital', 'tourism', 'geopolitics', 'energy'] as const;
type Topic = (typeof TOPICS)[number];

interface TopicVoteProps {
  /** Pre-fetched vote totals from last build (data/votes/votes.json) */
  initialVotes?: Partial<Record<Topic, number>>;
}

export default function TopicVote({ initialVotes = {} }: TopicVoteProps) {
  const pathname = usePathname();
  const locale = detectLocale(pathname) as 'en' | 'si';
  const ui = getUI(locale);

  const [selected, setSelected] = useState<Set<Topic>>(new Set());
  const [votes, setVotes] = useState<Record<Topic, number>>(() => {
    const result = {} as Record<Topic, number>;
    for (const t of TOPICS) {
      result[t] = initialVotes[t] ?? 0;
    }
    return result;
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

  function toggle(topic: Topic) {
    if (status === 'done') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0 || status !== 'idle') return;
    setStatus('loading');
    try {
      const res = await fetch(`${apiBase}/api/engagement/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: [...selected], locale }),
      });
      if (!res.ok) throw new Error('Non-OK');
      const data = (await res.json()) as { totals: Record<Topic, number> };
      setVotes(data.totals as Record<Topic, number>);
      setStatus('done');
      // Persist to localStorage so we don't re-prompt
      try {
        localStorage.setItem('malindra-voted', '1');
      } catch {}
    } catch {
      setStatus('error');
    }
  }

  const total = Math.max(
    1,
    Object.values(votes).reduce((s, n) => s + n, 0),
  );

  // Badge accent colors per topic
  const TOPIC_COLORS: Record<Topic, string> = {
    debt: 'var(--color-temple-gold)',
    digital: 'var(--color-zheng-he)',
    tourism: 'var(--color-water-fortress)',
    geopolitics: 'var(--color-sinha-maroon)',
    energy: 'var(--color-water-fortress)',
  };

  const labels: Record<Topic, string> = ui.topics as Record<Topic, string>;

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '20px 24px' }}>
      <div className="card-accent card-accent-gold" />
      <div className="t-label" style={{ marginBottom: '12px' }}>
        {locale === 'en' ? 'Intelligence Priorities' : 'බුද්ධිය ප්‍රමුඛතා'}
      </div>
      <p className="t-muted" style={{ marginBottom: '16px', fontSize: '12px' }}>
        {locale === 'en' ? 'Which topics deserve deeper analysis?' : 'කුමන මාතෘකා ගැඹුරු විශ්ලේෂණයට සුදුසු ද?'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {TOPICS.map((topic) => {
          const pct = Math.round((votes[topic] / total) * 100);
          const isSelected = selected.has(topic);
          const color = TOPIC_COLORS[topic];

          return (
            <button
              key={topic}
              type="button"
              onClick={() => toggle(topic)}
              disabled={status === 'done'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isSelected ? `color-mix(in srgb, ${color} 8%, transparent)` : 'none',
                border: `1px solid ${isSelected ? color : 'var(--color-border-default)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                cursor: status === 'done' ? 'default' : 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 150ms ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Progress fill */}
              {status === 'done' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: `color-mix(in srgb, ${color} 10%, transparent)`,
                    transition: 'width 400ms ease',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Checkbox indicator */}
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  border: `2px solid ${isSelected ? color : 'var(--color-spear-iron)'}`,
                  background: isSelected ? color : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms ease',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {isSelected && (
                  <svg aria-hidden="true" width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path
                      d="M1 3.5L3.5 6L8 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: isSelected ? color : 'var(--color-parchment)',
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                }}
              >
                {labels[topic] ?? topic}
              </span>

              {status === 'done' && (
                <span
                  style={{
                    fontSize: '12px',
                    color,
                    fontWeight: 600,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {pct}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {status !== 'done' && (
        <>
          {status === 'error' && (
            <p className="t-muted" style={{ color: 'var(--color-war-banner)', fontSize: '12px', marginBottom: '8px' }}>
              {locale === 'en' ? 'Vote failed. Please try again.' : 'ඡන්දය අසාර්ථකයි.'}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-ghost btn-full"
            disabled={selected.size === 0 || status === 'loading'}
          >
            {status === 'loading'
              ? locale === 'en'
                ? 'Sending…'
                : 'යවමින්…'
              : locale === 'en'
                ? 'Cast Vote'
                : 'ඡන්දය දෙන්න'}
          </button>
        </>
      )}

      {status === 'done' && (
        <p className="t-muted" style={{ fontSize: '11px', textAlign: 'center', marginTop: '8px' }}>
          {locale === 'en' ? 'Signal recorded. Thank you.' : 'සංඥාව ලියාපදිංචි විය.'}
        </p>
      )}

      <div className="t-heritage" style={{ marginTop: '12px', paddingTop: '10px' }}>
        Malindra · මලින්ද්‍ර
      </div>
    </form>
  );
}
