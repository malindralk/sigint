// MALINDRA PHASE 1
// app/archive/tag/[tag]/page.tsx
// Static tag-filtered archive pages generated at build time.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogData } from '@/lib/blog-data';

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

export async function generateStaticParams() {
  return ALL_TAGS.map((tag) => ({
    tag: tag.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const label = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${label} — Archive — Malindra`,
    description: `Malindra analysis tagged with ${label}.`,
  };
}

export default async function TagArchivePage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const { articles } = await getBlogData();

  // Match slug-ified tag back to display name
  const normalizedTag = tag.replace(/-/g, ' ');
  const filtered = articles.filter((a) => a.tags.some((t) => t.toLowerCase() === normalizedTag.toLowerCase()));
  const label = normalizedTag.replace(/\b\w/g, (c) => c.toUpperCase());

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
      <header>
        <Link href="/archive" className="t-muted" style={{ fontSize: '13px' }}>
          ← Archive
        </Link>
        <h1 className="t-hero" style={{ marginTop: 'var(--spacing-sm)' }}>
          {label}
        </h1>
        <p className="t-body" style={{ marginTop: 'var(--spacing-xs)' }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''} tagged{' '}
          <span style={{ color: 'var(--color-temple-gold)' }}>{label}</span>
        </p>
      </header>

      {/* Tag strip */}
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        <Link href="/archive" className="badge badge-hold" style={{ textDecoration: 'none' }}>
          All
        </Link>
        {ALL_TAGS.map((t) => {
          const slug = t.toLowerCase().replace(/\s+/g, '-');
          return (
            <Link
              key={t}
              href={`/archive/tag/${slug}`}
              className="badge"
              style={{
                textDecoration: 'none',
                background:
                  slug === tag
                    ? 'var(--color-sinha-maroon)'
                    : 'color-mix(in srgb, var(--color-zheng-he) 15%, transparent)',
                color: slug === tag ? 'var(--color-ola-leaf)' : 'var(--color-zheng-he)',
              }}
            >
              {t}
            </Link>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
          <div className="card-accent card-accent-maroon" />
          <p className="t-body">No articles found for this tag.</p>
          <Link
            href="/archive"
            className="btn btn-ghost"
            style={{ marginTop: 'var(--spacing-md)', display: 'inline-flex' }}
          >
            View all
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {filtered.map((article) => (
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
              <div className="card-accent card-accent-gold" />
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
                    {article.tags.slice(0, 3).map((t) => (
                      <span key={t} className="badge badge-hold" style={{ fontSize: '9px' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <h3 className="t-card-heading">{article.title}</h3>
                  <p className="t-muted" style={{ fontSize: '13px', marginTop: 'var(--spacing-xs)', lineHeight: 1.5 }}>
                    {article.excerpt.slice(0, 160)}
                    {article.excerpt.length > 160 ? '…' : ''}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <time dateTime={article.date} className="t-muted" style={{ fontSize: '12px', display: 'block' }}>
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
      )}
    </div>
  );
}
