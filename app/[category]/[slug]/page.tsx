import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categories, getArticle, getArticles, getCategoryMeta, type Category } from '@/lib/content';
import type { Metadata } from 'next';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';

interface Props { params: Promise<{ category: string; slug: string }>; }

export function generateStaticParams() {
  return categories.flatMap((cat) =>
    getArticles(cat.id).map((a) => ({ category: cat.id, slug: a.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getArticle(category as Category, slug);
  if (!article) return {};
  return { title: article.title, description: article.description };
}

export default async function ArticlePage({ params }: Props) {
  const { category, slug } = await params;
  const article = getArticle(category as Category, slug);
  if (!article) notFound();

  const meta = getCategoryMeta(category as Category);
  const articles = getArticles(category as Category);
  const currentIdx = articles.findIndex((a) => a.slug === slug);
  const prev = articles[currentIdx - 1];
  const next = articles[currentIdx + 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Breadcrumb */}
      <div className="t-muted" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap', fontFamily: 'var(--font-ui)' }}>
        <Link href="/" className="hover:opacity-80" style={{ color: 'var(--info)' }}>home</Link>
        <span>/</span>
        <Link href={`/${category}`} className="hover:opacity-80" style={{ color: meta?.accent }}>
          {meta?.label}
        </Link>
        <span>/</span>
        <span>{article.title}</span>
      </div>

      {/* Article */}
      <article>
        <MarkdownRenderer content={article.content} category={category} />
      </article>

      {/* Prev / Next */}
      {(prev || next) && (
        <div className="grid grid-cols-2 gap-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-lg)' }}>
          {prev ? (
            <Link href={`/${category}/${prev.slug}`}
              className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', padding: 'var(--space-md)', textDecoration: 'none' }}>
              <span className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>← Previous</span>
              <span className="t-body" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{prev.title}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/${category}/${next.slug}`}
              className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', padding: 'var(--space-md)', textDecoration: 'none', textAlign: 'right', alignItems: 'flex-end' }}>
              <span className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>Next →</span>
              <span className="t-body" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{next.title}</span>
            </Link>
          ) : <div />}
        </div>
      )}

      {/* Back to category */}
      <Link href={`/${category}`}
        className="t-body hover:opacity-80 transition-opacity"
        style={{ fontSize: '13px', fontFamily: 'var(--font-ui)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        ← Back to {meta?.label}
      </Link>
    </div>
  );
}
