import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categories, getArticles, getCategoryMeta, type Category, isValidCategory } from '@/lib/content';
import type { Metadata } from 'next';

interface Props { params: Promise<{ category: string }>; }

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const meta = getCategoryMeta(category as Category);
  if (!meta) return {};
  return { title: meta.label, description: meta.description };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  // Validate category
  if (!isValidCategory(category)) {
    notFound();
  }

  const meta = getCategoryMeta(category);
  if (!meta) notFound();

  const articles = getArticles(category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Header */}
      <div>
        <div className="t-muted" style={{ fontSize: '12px', marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-ui)' }}>
          <Link href="/" className="hover:opacity-80" style={{ color: 'var(--info)' }}>home</Link>
          <span style={{ margin: '0 var(--space-sm)' }}>/</span>
          <span style={{ color: meta.accent }}>{meta.label}</span>
        </div>
        <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-sm)' }}>
          <div>
            <h1 className="t-heading" style={{ color: meta.accent }}>{meta.label}</h1>
            <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>{meta.description}</p>
          </div>
        </div>
        <span className="badge badge-blue">{articles.length} articles</span>
      </div>

      {/* Article list */}
      <div className="space-y-2">
        {articles.map((article, i) => (
          <Link
            key={article.slug}
            href={`/${category}/${article.slug}`}
            className="card group"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', padding: 'var(--space-md)', textDecoration: 'none' }}
          >
            <span className="t-muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', minWidth: '20px', textAlign: 'right', marginTop: '2px' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="t-card-heading" style={{ fontSize: '14px', marginBottom: 'var(--space-xs)' }}>
                {article.title}
              </h2>
              <p className="t-muted" style={{ fontSize: '12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {article.description}
              </p>
            </div>
            <span className="t-muted" style={{ fontSize: '16px', marginTop: '2px', flexShrink: 0 }}>&#x203a;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
