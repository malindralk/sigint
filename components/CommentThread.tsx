'use client';

// MALINDRA PHASE 3
// components/CommentThread.tsx
// Static-compatible comment submission + display.
// Comments are fetched at build time; new comments POST to FastAPI and show
// a pending state until next rebuild approves them.

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { detectLocale } from '@/lib/i18n';

const LABELS = {
  en: {
    heading: 'Intelligence Thread',
    namePlaceholder: 'Your name',
    bodyPlaceholder: 'Your analysis or response…',
    submit: 'Post Comment',
    submitting: 'Posting…',
    pendingNotice: 'Submitted. Your comment will appear after editorial review.',
    error: 'Submission failed. Please try again.',
    noComments: 'No comments yet. Be the first to add signal.',
    charCount: (n: number) => `${n}/2000`,
  },
  si: {
    heading: 'බුද්ධිය ත්‍රෙඩ්',
    namePlaceholder: 'ඔබේ නම',
    bodyPlaceholder: 'ඔබේ විශ්ලේෂණය හෝ ප්‍රතිචාරය…',
    submit: 'අදහස් යොමු කරන්න',
    submitting: 'යවමින්…',
    pendingNotice: 'ඉදිරිපත් කෙරිණ. ඔබගේ අදහස සංස්කාරක සමාලෝචනයෙන් පසු දිස් වේ.',
    error: 'ඉදිරිපත් කිරීම අසාර්ථක විය.',
    noComments: 'තවම අදහස් නැත.',
    charCount: (n: number) => `${n}/2000`,
  },
};

export interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  locale?: string;
}

interface CommentThreadProps {
  slug: string;
  initialComments?: Comment[];
}

export default function CommentThread({ slug, initialComments = [] }: CommentThreadProps) {
  const pathname = usePathname();
  const locale = detectLocale(pathname) as 'en' | 'si';
  const t = LABELS[locale] ?? LABELS.en;

  const [comments, _setComments] = useState<Comment[]>(initialComments);
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'error'>('idle');

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !body.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`${apiBase}/api/engagement/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, author: author.trim(), body: body.trim(), locale }),
      });
      if (!res.ok) throw new Error('Non-OK response');
      setStatus('pending');
      setAuthor('');
      setBody('');
    } catch {
      setStatus('error');
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso.slice(0, 10);
    }
  }

  return (
    <section style={{ marginTop: 'var(--spacing-2xl)' }}>
      <div style={{ borderTop: '1px solid var(--color-border-default)', paddingTop: 'var(--spacing-xl)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--spacing-lg)' }}>
          {t.heading}
        </div>

        {/* Existing comments */}
        {comments.length === 0 ? (
          <p className="t-muted" style={{ marginBottom: 'var(--spacing-xl)' }}>
            {t.noComments}
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            {comments.map((c) => (
              <div
                key={c.id}
                className="card"
                style={{ padding: '16px 20px', borderLeft: '2px solid var(--color-sinha-maroon-20)' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-parchment)',
                    }}
                  >
                    {c.author}
                  </span>
                  <span className="t-muted" style={{ fontSize: '11px' }}>
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    lineHeight: 1.65,
                    color: 'var(--color-parchment)',
                  }}
                >
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Submit form */}
        {status === 'pending' ? (
          <div className="alert alert-info">
            <span>ℹ</span>
            <span>{t.pendingNotice}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <input
              className="input"
              type="text"
              placeholder={t.namePlaceholder}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={60}
              required
            />
            <div style={{ position: 'relative' }}>
              <textarea
                className="input"
                rows={4}
                placeholder={t.bodyPlaceholder}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                required
                style={{ resize: 'vertical', minHeight: '96px', fontSize: '14px', paddingBottom: '28px' }}
              />
              <span
                className="t-muted"
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '12px',
                  fontSize: '11px',
                  pointerEvents: 'none',
                }}
              >
                {t.charCount(body.length)}
              </span>
            </div>
            {status === 'error' && (
              <p className="t-muted" style={{ color: 'var(--color-war-banner)', fontSize: '12px' }}>
                {t.error}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-ghost"
              disabled={status === 'loading' || !author.trim() || !body.trim()}
            >
              {status === 'loading' ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
