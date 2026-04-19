'use client';
// MALINDRA PHASE 3
// components/FeedbackForm.tsx
// Static feedback form — POSTs to FastAPI /api/engagement/feedback.
// Stars rating + optional comment. Locale-aware labels.

import { useState } from 'react';
import { detectLocale } from '@/lib/i18n';
import { usePathname } from 'next/navigation';

const LABELS = {
  en: {
    heading: 'Rate This Analysis',
    placeholder: 'Additional thoughts (optional)',
    submit: 'Submit Feedback',
    submitting: 'Sending…',
    success: 'Thank you. Your signal was received.',
    error: 'Submission failed. Please try again.',
    stars: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
  },
  si: {
    heading: 'මෙම විශ්ලේෂණය ශ්‍රේණිගත කරන්න',
    placeholder: 'අතිරේක අදහස් (අවශ්‍ය නම්)',
    submit: 'ප්‍රතිපෝෂණය ඉදිරිපත් කරන්න',
    submitting: 'යවමින්…',
    success: 'ස්තූතියි. ඔබගේ සංඥාව ලැබුණි.',
    error: 'ඉදිරිපත් කිරීම අසාර්ථක විය. නැවත උත්සාහ කරන්න.',
    stars: ['දුර්වල', 'සාධාරණ', 'හොඳ', 'ඉතා හොඳ', 'විශිෂ්ට'],
  },
};

interface FeedbackFormProps {
  slug: string;
}

export default function FeedbackForm({ slug }: FeedbackFormProps) {
  const pathname = usePathname();
  const locale = detectLocale(pathname) as 'en' | 'si';
  const t = LABELS[locale] ?? LABELS.en;

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setStatus('loading');
    try {
      const res = await fetch(`${apiBase}/api/engagement/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, rating, comment: comment.trim() || null, locale }),
      });
      if (!res.ok) throw new Error('Non-OK response');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
        <div className="t-label" style={{ color: 'var(--color-water-fortress)', marginBottom: '4px' }}>✓</div>
        <p className="t-muted">{t.success}</p>
      </div>
    );
  }

  const activeRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '20px 24px' }}>
      <div className="t-label" style={{ marginBottom: '12px' }}>{t.heading}</div>

      {/* Star rating */}
      <div role="radiogroup" style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={t.stars[star - 1]}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '22px',
              color: star <= activeRating ? 'var(--color-temple-gold)' : 'var(--color-spear-iron)',
              transition: 'color 100ms ease',
              padding: '2px',
            }}
          >
            ★
          </button>
        ))}
      </div>

      {/* Comment textarea */}
      <textarea
        className="input"
        rows={3}
        placeholder={t.placeholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        style={{ resize: 'vertical', minHeight: '72px', fontSize: '14px', marginBottom: '12px' }}
      />

      {status === 'error' && (
        <p className="t-muted" style={{ color: 'var(--color-war-banner)', fontSize: '12px', marginBottom: '10px' }}>
          {t.error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={rating === 0 || status === 'loading'}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {status === 'loading' ? t.submitting : t.submit}
      </button>
    </form>
  );
}
