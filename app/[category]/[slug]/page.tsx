import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categories, getArticle, getArticles, getCategoryMeta, type Category } from '@/lib/content';
import type { Metadata } from 'next';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';

interface Props {
  params: { category: string; slug: string };
}

export function generateStaticParams() {
  return categories.flatMap((cat) =>
    getArticles(cat.id).map((a) => ({ category: cat.id, slug: a.slug }))
  );
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticle(params.category as Category, params.slug);
  if (!article) return {};
  return { title: article.title, description: article.description };
}

export default function ArticlePage({ params }: Props) {
  const article = getArticle(params.category as Category, params.slug);
  if (!article) notFound();

  const meta = getCategoryMeta(params.category as Category);
  const articles = getArticles(params.category as Category);
  const currentIdx = articles.findIndex((a) => a.slug === params.slug);
  const prev = articles[currentIdx - 1];
  const next = articles[currentIdx + 1];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="font-mono text-text-muted text-sm flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-accent-cyan">home</Link>
        <span>/</span>
        <Link href={`/${params.category}`} className="hover:text-white" style={{ color: meta?.accent }}>
          {meta?.label}
        </Link>
        <span>/</span>
        <span className="text-text-secondary truncate">{article.title}</span>
      </div>

      {/* Article */}
      <article>
        <MarkdownRenderer content={article.content} />
      </article>

      {/* Prev / Next navigation */}
      {(prev || next) && (
        <div className="border-t border-border-default pt-6 grid grid-cols-2 gap-4">
          {prev ? (
            <Link
              href={`/${params.category}/${prev.slug}`}
              className="flex flex-col gap-1 bg-bg-secondary border border-border-default rounded-lg p-4 hover:bg-bg-hover transition-all"
            >
              <span className="text-text-muted text-xs font-mono">← Previous</span>
              <span className="text-text-primary text-sm font-medium line-clamp-1">{prev.title}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              href={`/${params.category}/${next.slug}`}
              className="flex flex-col gap-1 bg-bg-secondary border border-border-default rounded-lg p-4 hover:bg-bg-hover transition-all text-right"
            >
              <span className="text-text-muted text-xs font-mono">Next →</span>
              <span className="text-text-primary text-sm font-medium line-clamp-1">{next.title}</span>
            </Link>
          ) : <div />}
        </div>
      )}

      {/* Back to category */}
      <div className="pb-4">
        <Link
          href={`/${params.category}`}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-mono"
        >
          ← Back to {meta?.label}
        </Link>
      </div>
    </div>
  );
}
