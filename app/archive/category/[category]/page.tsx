// MALINDRA PHASE 1
// app/archive/category/[category]/page.tsx
// Static category-filtered archive pages.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogData } from '@/lib/blog-data';

export async function generateStaticParams() {
  const { metadata } = await getBlogData();
  return metadata.categories.map((cat) => ({ category: cat }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${label} — Archive — Malindra`,
    description: `Malindra analysis in the ${label} category.`,
  };
}

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const { articles, metadata: blogMeta } = await getBlogData();
  const filtered = articles.filter((a) => a.category === category);
  const label = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
        <Link href="/archive" className="t-muted" style={{ fontSize: '13px' }}>← Archive</Link>
        <h1 className="t-hero" style={{ marginTop: 'var(--spacing-sm)' }}>{label}</h1>
        <p className="t-body" style={{ marginTop: 'var(--spacing-xs)' }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''} in{' '}
          <span style={{ color: 'var(--color-temple-gold)' }}>{label}</span>
        </p>
      </header>

      {/* Category strip */}
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        <Link href="/archive" className="badge badge-hold" style={{ textDecoration: 'none' }}>All categories</Link>
        {blogMeta.categories.map((cat) => (
          <Link
            key={cat}
            href={`/archive/category/${cat}`}
            className="badge"
            style={{
              textDecoration: 'none',
              background: cat === category
                ? 'var(--color-temple-gold)'
                : 'color-mix(in srgb, var(--color-temple-gold) 15%, transparent)',
              color: cat === category ? 'var(--color-kotte-night)' : 'var(--color-temple-gold)',
            }}
          >
            {cat.replace(/-/g, ' ')}
          </Link>
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {filtered.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: 'var(--spacing-md) var(--spacing-lg)' }}
          >
            <div className="card-accent card-accent-green" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-lg)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                  {article.tags.slice(0, 2).map((t) => (
                    <span key={t} className="badge badge-hold" style={{ fontSize: '9px' }}>{t}</span>
                  ))}
                </div>
                <h3 className="t-card-heading">{article.title}</h3>
                <p className="t-muted" style={{ fontSize: '13px', marginTop: 'var(--spacing-xs)', lineHeight: 1.5 }}>
                  {article.excerpt.slice(0, 160)}{article.excerpt.length > 160 ? '…' : ''}
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <time dateTime={article.date} className="t-muted" style={{ fontSize: '12px', display: 'block' }}>
                  {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </time>
              </div>
            </div>
          </Link>
        ))}
      </div>


    </div>
  );
}
