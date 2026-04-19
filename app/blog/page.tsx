// MALINDRA PHASE 1
// app/blog/page.tsx
// Blog index — Hero + featured article + recent posts grid.
// Fully static, no runtime fetch.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogData, getFeaturedArticle } from '@/lib/blog-data';
import NewsletterForm from '@/components/NewsletterForm';

export const metadata: Metadata = {
  title: 'Analysis — Malindra',
  description:
    'Sovereign strategy intelligence on Sri Lankan and Laccadive Sea socio-economic and geopolitical dynamics.',
  openGraph: {
    title: 'Malindra — Intelligence Analysis',
    description:
      'Calm-authority analysis of Sri Lanka and the Laccadive Sea region: debt, digital policy, trade triangulation.',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

const MALINDRA_TAGS = [
  'Debt Restructuring',
  'Digital Policy',
  'Tourism',
  'China-India Triangulation',
  'Renewable Energy',
  'Geopolitics',
  'Laccadive Sea',
  'Finance',
];

export default async function BlogIndexPage() {
  const [{ articles }, featured] = await Promise.all([getBlogData(), getFeaturedArticle()]);
  const recent = articles.slice(0, 9);

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: 'var(--spacing-3xl) var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3xl)',
      }}
    >
      {/* ── Masthead ── */}
      <header style={{ borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--spacing-2xl)' }}>
        <div className="t-eyebrow">MALINDRA · මලින්ද්‍ර</div>
        <h1
          className="t-display"
          style={{ marginTop: 'var(--spacing-sm)', maxWidth: '700px' }}
        >
          Intelligence for the Laccadive Sea Age
        </h1>
        <p
          className="t-body"
          style={{ maxWidth: '580px', marginTop: 'var(--spacing-md)' }}
        >
          Sovereign strategy analysis grounded in Sri Lankan reality. Data-driven, calm in register,
          precise in implication. SIGINT structure: Signal → Context → Implication → Action.
        </p>

        {/* Tag filter pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-xs)',
            marginTop: 'var(--spacing-lg)',
          }}
        >
          <Link href="/archive" className="badge badge-hold" style={{ textDecoration: 'none' }}>
            All Topics
          </Link>
          {MALINDRA_TAGS.map((tag) => (
            <Link
              key={tag}
              href={`/archive/tag/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}
              className="badge badge-hold"
              style={{ textDecoration: 'none' }}
            >
              {tag}
            </Link>
          ))}
        </div>
      </header>

      {/* ── Featured article ── */}
      {featured && (
        <section>
          <div className="t-eyebrow" style={{ marginBottom: 'var(--spacing-md)' }}>
            Featured Analysis
          </div>
          <Link
            href={`/blog/${featured.slug}`}
            className="card"
            style={{ display: 'block', textDecoration: 'none', padding: 'var(--spacing-xl)' }}
          >
            <div className="card-accent card-accent-gold" />
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              {featured.tags.slice(0, 3).map((t) => (
                <span key={t} className="badge badge-gold">
                  {t}
                </span>
              ))}
            </div>
            <h2 className="t-hero" style={{ marginBottom: 'var(--spacing-sm)' }}>
              {featured.title}
            </h2>
            <p className="t-body" style={{ maxWidth: '680px' }}>
              {featured.excerpt}
            </p>
            <div
              className="article-hero-meta"
              style={{ marginTop: 'var(--spacing-md)' }}
            >
              <time dateTime={featured.date}>
                {new Date(featured.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className="article-hero-meta-sep" />
              <span>{featured.readingMinutes} min read</span>
            </div>
          </Link>
        </section>
      )}

      {/* ── Recent articles grid ── */}
      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div className="t-eyebrow">Recent Analysis</div>
          <Link href="/archive" className="t-muted" style={{ fontSize: '12px' }}>
            View all →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {recent.map((article, i) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: 'var(--spacing-lg) var(--spacing-lg) var(--spacing-md)' }}
            >
              <div
                className={`card-accent ${
                  i % 4 === 0
                    ? 'card-accent-gold'
                    : i % 4 === 1
                    ? 'card-accent-blue'
                    : i % 4 === 2
                    ? 'card-accent-green'
                    : 'card-accent-maroon'
                }`}
              />
              {/* Tags */}
              {article.tags.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-sm)',
                    flexWrap: 'wrap',
                  }}
                >
                  {article.tags.slice(0, 2).map((t) => (
                    <span key={t} className="badge badge-hold" style={{ fontSize: '9px' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="t-card-heading" style={{ marginBottom: 'var(--spacing-sm)', flex: 1 }}>
                {article.title}
              </h3>
              <p className="t-muted" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: 'var(--spacing-sm)' }}>
                {article.excerpt.slice(0, 120)}
                {article.excerpt.length > 120 ? '…' : ''}
              </p>
              <div className="article-hero-meta" style={{ fontSize: '12px' }}>
                <time dateTime={article.date}>
                  {new Date(article.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <span className="article-hero-meta-sep" />
                <span>{article.readingMinutes} min</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Newsletter capture ── */}
      <section>
        <NewsletterForm locale="en" />
      </section>


    </div>
  );
}
