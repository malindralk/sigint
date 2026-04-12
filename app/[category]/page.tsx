import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categories, getArticles, getCategoryMeta, type Category } from '@/lib/content';
import type { Metadata } from 'next';

interface Props {
  params: { category: string };
}

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const meta = getCategoryMeta(params.category as Category);
  if (!meta) return {};
  return { title: meta.label, description: meta.description };
}

export default function CategoryPage({ params }: Props) {
  const meta = getCategoryMeta(params.category as Category);
  if (!meta) notFound();

  const articles = getArticles(params.category as Category);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="font-mono text-text-muted text-sm mb-2">
          <Link href="/" className="hover:text-accent-cyan">home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: meta.accent }}>{meta.id}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{meta.icon}</span>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: meta.accent }}>{meta.label}</h1>
            <p className="text-text-secondary mt-1">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <span className="border border-border-muted rounded px-2 py-0.5">{articles.length} articles</span>
        </div>
      </div>

      {/* Article list */}
      <div className="space-y-3">
        {articles.map((article, i) => (
          <Link
            key={article.slug}
            href={`/${params.category}/${article.slug}`}
            className="group flex items-start gap-4 bg-bg-secondary border border-border-default rounded-lg p-5 hover:bg-bg-hover hover:border-border-default transition-all"
          >
            <span className="font-mono text-text-muted text-sm mt-0.5 shrink-0 w-6 text-right">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-text-primary font-semibold group-hover:text-white transition-colors mb-1 truncate">
                {article.title}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                {article.description}
              </p>
            </div>
            <span className="text-text-muted text-xl shrink-0 mt-1">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
