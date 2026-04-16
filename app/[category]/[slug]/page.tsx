import { notFound } from 'next/navigation';
import { categories, getArticle, getArticles, getCategoryMeta, type Category } from '@/lib/content';
import type { Metadata } from 'next';
import ArticleView from '@/app/components/ArticleView';

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
  const prev = articles[currentIdx - 1] ?? null;
  const next = articles[currentIdx + 1] ?? null;

  return (
    <ArticleView
      title={article.title}
      content={article.content}
      category={category}
      categoryLabel={meta?.label ?? category}
      categoryAccent={meta?.accent ?? '#58a6ff'}
      prevArticle={prev ? { slug: prev.slug, title: prev.title } : null}
      nextArticle={next ? { slug: next.slug, title: next.title } : null}
    />
  );
}
