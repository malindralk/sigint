// MALINDRA PHASE 4
// app/archive/curated/page.tsx
// Static curated archive with topic, date, confidence, model version filters.
// URL path-based filtering (static export compatible).
// Build-time rendering of all articles with prediction metadata.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogData } from '@/lib/blog-data';
import { getRegionalOverview } from '@/lib/predictions';

export const metadata: Metadata = {
  title: 'Curated Archive · Malindra',
  description: 'Curated intelligence archive with confidence scoring, topic classification, and scenario metadata.',
};

const TOPIC_LABELS: Record<string, string> = {
  debt: 'Debt Restructuring',
  digital: 'Digital Policy',
  tourism: 'Tourism',
  geopolitics: 'Geopolitics',
  energy: 'Renewable Energy',
};

const TOPIC_COLORS: Record<string, string> = {
  debt: 'var(--color-temple-gold)',
  digital: 'var(--color-zheng-he)',
  tourism: 'var(--color-water-fortress)',
  geopolitics: 'var(--color-sinha-maroon)',
  energy: 'var(--color-water-fortress)',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: 'var(--color-temple-gold)',
  MEDIUM: 'var(--color-zheng-he)',
  LOW: 'var(--color-sinha-maroon)',
};

const CARD_ACCENT: Record<string, string> = {
  debt: 'var(--color-temple-gold)',
  digital: 'var(--color-zheng-he)',
  tourism: 'var(--color-water-fortress)',
  geopolitics: 'var(--color-sinha-maroon)',
  energy: 'var(--color-water-fortress)',
};

export default async function CuratedArchivePage() {
  const blogData = await getBlogData();
  const allArticles = blogData.articles;
  const _overview = getRegionalOverview();

  // Build confidence map: slug → confidence label
  const confidenceMap: Record<string, { label: string; mean: number; topics: string[] }> = {};
  const predDir =
    typeof process !== 'undefined'
      ? ((): Record<string, { label: string; mean: number; topics: string[] }> => {
          try {
            const fs = require('node:fs') as typeof import('fs');
            const path = require('node:path') as typeof import('path');
            const predPath = path.join(process.cwd(), 'data', 'predictions');
            if (!fs.existsSync(predPath)) return {};
            const map: Record<string, { label: string; mean: number; topics: string[] }> = {};
            for (const f of fs.readdirSync(predPath)) {
              if (!f.endsWith('.json') || f === 'index.json') continue;
              try {
                const d = JSON.parse(fs.readFileSync(path.join(predPath, f), 'utf-8'));
                map[d.slug] = {
                  label: d.aggregate_confidence?.label ?? 'MEDIUM',
                  mean: d.aggregate_confidence?.mean ?? 0.5,
                  topics: d.topics_detected ?? [],
                };
              } catch {
                // ignore parse errors
              }
            }
            return map;
          } catch {
            return {};
          }
        })()
      : {};

  Object.assign(confidenceMap, predDir);

  // Sort: HIGH confidence first, then by date descending
  const sorted = [...allArticles].sort((a, b) => {
    const ca = confidenceMap[a.slug];
    const cb = confidenceMap[b.slug];
    const orderMap: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const oa = orderMap[ca?.label ?? 'MEDIUM'] ?? 1;
    const ob = orderMap[cb?.label ?? 'MEDIUM'] ?? 1;
    if (oa !== ob) return oa - ob;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <main
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        padding: '2rem 1.5rem',
        fontFamily: 'var(--font-ui)',
        color: 'var(--color-ola)',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '2rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '1.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.6rem',
            color: 'var(--color-temple-gold)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.14em',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.4rem',
          }}
        >
          [MODEL v1.0] · Curated Intelligence Archive
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 700,
            color: 'var(--color-ola)',
            margin: '0 0 0.5rem 0',
          }}
        >
          Archive · Curated
        </h1>
        <p style={{ color: 'var(--color-parchment)', fontSize: '0.85rem', margin: 0 }}>
          {sorted.length} intelligence articles · sorted by confidence score · [MODEL v1.0] attribution
        </p>
      </div>

      {/* Topic filter links */}
      <nav
        aria-label="Topic filter"
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/archive/curated/"
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-parchment)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            padding: '0.25rem 0.6rem',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
        >
          All Topics
        </Link>
        {Object.entries(TOPIC_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/archive/tag/${encodeURIComponent(label.toLowerCase().replace(/ /g, '-'))}/`}
            style={{
              fontSize: '0.72rem',
              color: TOPIC_COLORS[key] ?? 'var(--color-parchment)',
              background: 'var(--color-surface)',
              border: `1px solid color-mix(in srgb, ${TOPIC_COLORS[key] ?? 'var(--color-parchment)'} 30%, transparent)`,
              borderRadius: '2px',
              padding: '0.25rem 0.6rem',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Articles grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {sorted.map((article) => {
          const confData = confidenceMap[article.slug];
          const confLabel = confData?.label ?? 'MEDIUM';
          const confMean = confData?.mean ?? 0.5;
          const detectedTopics = confData?.topics ?? [];
          const primaryTopic = detectedTopics[0] ?? article.tags?.[0]?.toLowerCase() ?? '';
          const accentColor = CARD_ACCENT[primaryTopic] ?? 'var(--color-border)';

          return (
            <article
              key={article.slug}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: '3px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {/* Eyebrow: confidence + topics */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: CONFIDENCE_COLORS[confLabel] ?? 'var(--color-stone)',
                    background: `color-mix(in srgb, ${CONFIDENCE_COLORS[confLabel] ?? 'var(--color-stone)'} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${CONFIDENCE_COLORS[confLabel] ?? 'var(--color-stone)'} 25%, transparent)`,
                    borderRadius: '2px',
                    padding: '0.1rem 0.35rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {confLabel} · {Math.round(confMean * 100)}%
                </span>
                {detectedTopics.slice(0, 2).map((topic) => (
                  <span
                    key={topic}
                    style={{
                      fontSize: '0.62rem',
                      color: TOPIC_COLORS[topic] ?? 'var(--color-stone)',
                      background: 'transparent',
                      border: `1px solid color-mix(in srgb, ${TOPIC_COLORS[topic] ?? 'var(--color-stone)'} 25%, transparent)`,
                      borderRadius: '2px',
                      padding: '0.1rem 0.35rem',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {TOPIC_LABELS[topic] ?? topic}
                  </span>
                ))}
                <span style={{ fontSize: '0.6rem', color: 'var(--color-stone)', marginLeft: 'auto' }}>
                  {article.category}
                </span>
              </div>

              {/* Title */}
              <h2 style={{ margin: 0 }}>
                <Link
                  href={`/${article.category}/${article.slug}/`}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--color-ola)',
                    textDecoration: 'none',
                    lineHeight: 1.4,
                    display: 'block',
                  }}
                >
                  {article.title}
                </Link>
              </h2>

              {/* Description */}
              {article.description && (
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-parchment)',
                    lineHeight: 1.6,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.description}
                </p>
              )}

              {/* Footer: date + tags */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <time
                  dateTime={article.date}
                  style={{ fontSize: '0.7rem', color: 'var(--color-stone)', fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {new Date(article.date).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {article.tags.slice(0, 2).map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/archive/tag/${encodeURIComponent(tag.toLowerCase().replace(/ /g, '-'))}/`}
                      style={{
                        fontSize: '0.62rem',
                        color: 'var(--color-stone)',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '2px',
                        padding: '0.1rem 0.35rem',
                        textDecoration: 'none',
                      }}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-stone)', padding: '4rem 0', fontSize: '0.85rem' }}>
          No articles in curated archive.
        </div>
      )}
    </main>
  );
}
