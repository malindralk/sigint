import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'content');

export type Category = 'em-sca' | 'sigint' | 'learning';

export interface Article {
  slug: string;
  category: Category;
  title: string;
  description: string;
  content: string;
  order: number;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  color: string;
  accent: string;
  icon: string;
}

export const categories: CategoryMeta[] = [
  {
    id: 'em-sca',
    label: 'EM Side-Channel',
    description: 'Electromagnetic side-channel analysis — theory, equipment tiers, market analysis, and TEMPEST standards.',
    color: 'text-accent-green',
    accent: '#39d353',
    icon: '⚡',
  },
  {
    id: 'sigint',
    label: 'SIGINT',
    description: 'Signals intelligence — academic research, RF fingerprinting, geolocation, and private industry landscape.',
    color: 'text-accent-cyan',
    accent: '#58a6ff',
    icon: '📡',
  },
  {
    id: 'learning',
    label: 'Learning Paths',
    description: 'Structured learning resources — Coursera curricula, prerequisites, and progression roadmaps.',
    color: 'text-accent-orange',
    accent: '#f0883e',
    icon: '📚',
  },
];

function extractTitle(content: string, filename: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return filename
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractDescription(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  return lines[0]?.trim().slice(0, 200) || '';
}

export function getArticles(category: Category): Article[] {
  const dir = path.join(contentDir, category);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  return files
    .map((file, i) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { data, content } = matter(raw);
      const slug = file.replace(/\.md$/, '');
      return {
        slug,
        category,
        title: data.title || extractTitle(content, slug),
        description: data.description || extractDescription(content),
        content,
        order: data.order ?? i,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getArticle(category: Category, slug: string): Article | null {
  const file = path.join(contentDir, category, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    category,
    title: data.title || extractTitle(content, slug),
    description: data.description || extractDescription(content),
    content,
    order: data.order ?? 0,
  };
}

export function getAllArticles(): Article[] {
  return categories.flatMap((c) => getArticles(c.id));
}

export function getCategoryMeta(id: Category): CategoryMeta | undefined {
  return categories.find((c) => c.id === id);
}
