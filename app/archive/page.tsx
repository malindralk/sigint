// MALINDRA PHASE 1
// app/archive/page.tsx
// Static archive — filters are encoded in the URL path segment via generateStaticParams.
// NOTE: In output: export, searchParams are not available at runtime.
// We render the unfiltered archive at /archive/ and use client-side tag highlighting.
// Tag-filtered pages are generated at build time via /archive/tag/[tag]/page.tsx.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogData } from '@/lib/blog-data';

export const metadata: Metadata = {
  title: 'Archive — Malindra',
  description: 'Browse all Malindra intelligence analysis by topic and category.',
};

const ALL_TAGS = [
  'Debt Restructuring',
  'Digital Policy',
  'Tourism',
  'China-India Triangulation',
  'Renewable Energy',
  'Geopolitics',
  'Laccadive Sea',
  'Finance',
  'Infrastructure',
  'Sri Lanka',
];

export default async function ArchivePage() {
  const { articles, metadata: blogMeta } = await getBlogData();

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: 'var(--spacing-3xl) var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2xl)',
      }}
    >
      {/* Header */}
      <header>
        <Link href="/blog" className="t-muted" style={{ fontSize: '13px' }}>
          ← Malindra
        </Link>
        <h1 className="t-hero" style={{ marginTop: 'var(--spacing-sm)' }}>
          Archive
        </h1>
        <p className="t-body" style={{ marginTop: 'var(--spacing-xs)' }}>
          {articles.length} article{articles.length !== 1 ? 's' : ''} · All Analysis
        </p>
      </header>

      {/* ── Filter strip ── */}
      <nav>
        <div className="t-label" style={{ marginBottom: 'var(--spacing-sm)' }}>
          Filter by Topic
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          <Link
            href="/archive"
            className="badge"
            style={{
              textDecoration: 'none',
              background: 'var(--color-sinha-maroon)',
              color: 'var(--color-ola-leaf)',
            }}
          >
            All
          </Link>
          {ALL_TAGS.map((t) => (
            <Link
              key={t}
              href={`/archive/tag/${encodeURIComponent(t.toLowerCase().replace(/\s+/g, '-'))}`}
              className="badge badge-hold"
              style={{ textDecoration: 'none' }}
            >
              {t}
            </Link>
          ))}
        </div>

        {/* Category filter */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-xs)',
            marginTop: 'var(--spacing-sm)',
            flexWrap: 'wrap',
          }}
        >
          {blogMeta.categories.map((cat) => (
            <Link
              key={cat}
              href={`/archive/category/${cat}`}
              className="badge"
              style={{
                textDecoration: 'none',
                background: 'color-mix(in srgb, var(--color-temple-gold) 15%, transparent)',
                color: 'var(--color-temple-gold)',
              }}
            >
              {cat.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Article list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              padding: 'var(--spacing-md) var(--spacing-lg)',
            }}
          >
            <div className="card-accent card-accent-blue" />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--spacing-lg)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-xs)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      background: 'color-mix(in srgb, var(--color-sinha-maroon) 12%, transparent)',
                      color: 'var(--color-sinha-maroon)',
                    }}
                  >
                    {article.category.replace(/-/g, ' ')}
                  </span>
                  {article.tags.slice(0, 2).map((t) => (
                    <span key={t} className="badge badge-hold" style={{ fontSize: '9px' }}>
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="t-card-heading">{article.title}</h3>
                <p
                  className="t-muted"
                  style={{ fontSize: '13px', marginTop: 'var(--spacing-xs)', lineHeight: 1.5 }}
                >
                  {article.excerpt.slice(0, 160)}
                  {article.excerpt.length > 160 ? '…' : ''}
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <time
                  dateTime={article.date}
                  className="t-muted"
                  style={{ fontSize: '12px', display: 'block' }}
                >
                  {new Date(article.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <span className="t-muted" style={{ fontSize: '12px' }}>
                  {article.readingMinutes} min read
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>


    </div>
  );
}
