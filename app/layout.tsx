import type { Metadata } from 'next';
import './globals.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { categories, getArticles, type Category } from '@/lib/content';

export const metadata: Metadata = {
  title: { default: 'SIGINT Wiki', template: '%s — SIGINT Wiki' },
  description: 'Electromagnetic side-channel analysis, signals intelligence, and RF security research knowledge base.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Build wiki nav dynamically from content
  const wikiNav = categories.map((cat) => ({
    id: cat.id,
    items: getArticles(cat.id as Category).map((a) => ({
      slug: a.slug,
      label: a.title,
    })),
  }));

  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-text-primary min-h-screen">
        <div className="scanline" />
        <div className="flex min-h-screen">
          <Sidebar wikiNav={wikiNav} />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
              {children}
            </main>
            <footer className="border-t border-border-default px-6 py-4 text-center text-text-muted text-xs font-mono">
              SIGINT WIKI &middot; {new Date().getFullYear()} &middot; EM-SCA &middot; RF Intelligence &middot; Hardware Security
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
