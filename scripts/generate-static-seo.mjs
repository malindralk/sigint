// MALINDRA PHASE 1
// scripts/generate-static-seo.mjs
// Run at build time BEFORE next build to generate:
//   public/robots.txt
//   public/sitemap.xml
//   public/rss.xml
//
// Usage: node scripts/generate-static-seo.mjs
// (Called automatically by rebuild.sh)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const CONTENT = path.join(ROOT, 'content');

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://malindra.lk';

// ── Collect articles ──────────────────────────────────────────────────────────

function collectArticles() {
  const articles = [];
  if (!fs.existsSync(CONTENT)) return articles;

  for (const category of fs.readdirSync(CONTENT)) {
    const catDir = path.join(CONTENT, category);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const file of fs.readdirSync(catDir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(catDir, file), 'utf-8');
      const { data, content } = matter(raw);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = data.title || (titleMatch ? titleMatch[1].trim() : slug);
      const date = data.date || new Date().toISOString().slice(0, 10);
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      const excerpt = data.excerpt || lines.slice(0, 2).join(' ').slice(0, 200);
      articles.push({ slug, category, title, date, excerpt, tags: data.tags || [] });
    }
  }
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ── robots.txt ────────────────────────────────────────────────────────────────

function writeRobots() {
  const content = `User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
`;
  fs.writeFileSync(path.join(PUBLIC, 'robots.txt'), content);
  console.log('✓ public/robots.txt');
}

// ── sitemap.xml ───────────────────────────────────────────────────────────────

function writeSitemap(articles) {
  const staticUrls = [
    { loc: `${BASE}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${BASE}/blog`, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE}/archive`, changefreq: 'weekly', priority: '0.7' },
  ];

  const articleUrls = articles.map(a => ({
    loc: `${BASE}/blog/${a.slug}`,
    lastmod: a.date,
    changefreq: 'monthly',
    priority: '0.8',
  }));

  const allUrls = [...staticUrls, ...articleUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml);
  console.log(`✓ public/sitemap.xml (${allUrls.length} URLs)`);
}

// ── rss.xml ───────────────────────────────────────────────────────────────────

function writeRss(articles) {
  const recent = articles.slice(0, 20);
  const items = recent.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${BASE}/blog/${a.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${a.slug}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <description><![CDATA[${a.excerpt}]]></description>
      ${a.tags.map(t => `<category><![CDATA[${t}]]></category>`).join('\n      ')}
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Malindra — Laccadive Sea Intelligence</title>
    <link>${BASE}/blog</link>
    <description>Sovereign strategy analysis for Sri Lanka and the Laccadive Sea region.</description>
    <language>en</language>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(PUBLIC, 'rss.xml'), xml);
  console.log(`✓ public/rss.xml (${recent.length} items)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const articles = collectArticles();
console.log(`Found ${articles.length} articles in content/`);
writeRobots();
writeSitemap(articles);
writeRss(articles);
console.log('SEO static assets generated.');
