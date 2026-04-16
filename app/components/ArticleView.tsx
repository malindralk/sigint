'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MarkdownRenderer from './MarkdownRenderer';

/* ── Types ───────────────────────────────────────────────── */
interface Section {
  title: string;
  content: string;
}

interface LinkedArticle {
  label: string;
  href: string;
}

interface Props {
  title: string;
  content: string;
  category: string;
  categoryLabel: string;
  categoryAccent: string;
  updatedAt?: string;
  prevArticle?: { slug: string; title: string } | null;
  nextArticle?: { slug: string; title: string } | null;
}

/* ── Helpers ─────────────────────────────────────────────── */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

function parseUpdatedDate(content: string): string | null {
  const match = content.match(/\*Last Updated:\s*(.+?)\*/i);
  return match ? match[1].trim() : null;
}

function parseSections(content: string): Section[] {
  // Split by ## headings. First chunk is preamble (before first ##).
  const parts = content.split(/^(?=## )/m);
  const sections: Section[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^## (.+)$/m);
    if (headingMatch) {
      sections.push({ title: headingMatch[1].trim(), content: trimmed });
    } else {
      // Preamble (content before first ##) -- keep as intro
      sections.push({ title: 'Introduction', content: trimmed });
    }
  }

  return sections;
}

function parseLinkedArticles(content: string, category: string): LinkedArticle[] {
  // Parse the wiki navigation line: [Label](file.md)
  const navMatch = content.match(/\*\*Wiki navigation:\*\*(.+)/);
  if (!navMatch) return [];

  const links: LinkedArticle[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(navMatch[1])) !== null) {
    const label = m[1];
    let href = m[2];
    // Convert .md refs to routes
    if (!href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#')) {
      href = `/${category}/${href.replace(/\.md$/, '')}`;
    }
    // Fix cross-category links (em-sca articles from sigint category)
    if (!href.startsWith('http') && !href.startsWith('#')) {
      // Check if the slug exists in a different category by checking known prefixes
      if (href.includes('/em-sca-') || href.includes('/electromagnetic-') || href.includes('/tempest-') || href.includes('/pqc-em-sca') || href.includes('/entry-level-') || href.includes('/research-grade-') || href.includes('/professional-em-')) {
        if (!href.startsWith('/em-sca/')) {
          href = '/em-sca/' + href.split('/').pop();
        }
      }
      if (href.includes('/coursera-')) {
        if (!href.startsWith('/learning/')) {
          href = '/learning/' + href.split('/').pop();
        }
      }
    }
    links.push({ label, href });
  }
  return links;
}

/* Strip the preamble metadata (h1, date line, wiki nav, first ---) from content
   since the hero header now shows this info */
function stripPreamble(content: string): string {
  let lines = content.split('\n');
  let startIdx = 0;

  // Skip leading # heading
  while (startIdx < lines.length && (lines[startIdx].trim() === '' || lines[startIdx].startsWith('# '))) startIdx++;
  // Skip date/source italic lines
  while (startIdx < lines.length && (lines[startIdx].trim().startsWith('*') && !lines[startIdx].trim().startsWith('**Wiki'))) startIdx++;
  // Skip blank lines
  while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
  // Skip wiki navigation line
  if (startIdx < lines.length && lines[startIdx].includes('**Wiki navigation:**')) startIdx++;
  // Skip blank lines
  while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
  // Skip leading ---
  if (startIdx < lines.length && lines[startIdx].trim() === '---') startIdx++;
  // Skip blank lines
  while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;

  return lines.slice(startIdx).join('\n');
}

/* ── Icons ───────────────────────────────────────────────── */
function FocusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

/* ── Bookmark persistence ────────────────────────────────── */
function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('malindra-bookmarks') || '[]'); } catch { return []; }
}
function toggleBookmarkStorage(path: string): boolean {
  const bm = getBookmarks();
  const idx = bm.indexOf(path);
  if (idx >= 0) { bm.splice(idx, 1); } else { bm.push(path); }
  localStorage.setItem('malindra-bookmarks', JSON.stringify(bm));
  return idx < 0; // returns new state
}

/* ── Component ───────────────────────────────────────────── */
export default function ArticleView({ title, content, category, categoryLabel, categoryAccent, prevArticle, nextArticle }: Props) {
  const updatedAt = useMemo(() => parseUpdatedDate(content), [content]);
  const readingTime = useMemo(() => estimateReadingTime(content), [content]);
  const linkedArticles = useMemo(() => parseLinkedArticles(content, category), [content, category]);
  const strippedContent = useMemo(() => stripPreamble(content), [content]);
  const sections = useMemo(() => parseSections(strippedContent), [strippedContent]);

  const [currentSection, setCurrentSection] = useState(0);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTheme, setFocusTheme] = useState<'dark' | 'light'>('dark');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const articlePath = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    setIsBookmarked(getBookmarks().includes(articlePath));
  }, [articlePath]);

  const progress = sections.length > 0 ? ((currentSection + 1) / sections.length) * 100 : 0;

  const goTo = useCallback((idx: number) => {
    setCurrentSection(idx);
    setShowSectionPicker(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBookmark = useCallback(() => {
    const newState = toggleBookmarkStorage(articlePath);
    setIsBookmarked(newState);
  }, [articlePath]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMsg('Link copied');
      setTimeout(() => setShareMsg(''), 2000);
    } catch {
      setShareMsg('Failed to copy');
      setTimeout(() => setShareMsg(''), 2000);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (focusMode) {
        if (e.key === 'Escape') setFocusMode(false);
        if (e.key === 'ArrowRight' && currentSection < sections.length - 1) goTo(currentSection + 1);
        if (e.key === 'ArrowLeft' && currentSection > 0) goTo(currentSection - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, currentSection, sections.length, goTo]);

  const currentSectionData = sections[currentSection];

  return (
    <>
      {/* Reading progress bar */}
      <div className="reading-progress">
        <div className="reading-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Breadcrumb */}
        <div className="t-muted" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontFamily: 'var(--font-ui)', marginBottom: '20px' }}>
          <Link href="/" className="hover:opacity-80" style={{ color: 'var(--color-zheng-he)' }}>home</Link>
          <span>/</span>
          <Link href={`/${category}`} className="hover:opacity-80" style={{ color: categoryAccent }}>
            {categoryLabel}
          </Link>
        </div>

        {/* Hero header */}
        <div className="article-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="article-badge" style={{ background: `color-mix(in srgb, ${categoryAccent} 15%, transparent)`, color: categoryAccent, border: `1px solid color-mix(in srgb, ${categoryAccent} 25%, transparent)` }}>
              {categoryLabel}
            </span>
            {updatedAt && (
              <>
                <span className="article-hero-meta-sep" />
                <span className="article-hero-meta">{updatedAt}</span>
              </>
            )}
            <span className="article-hero-meta-sep" />
            <span className="article-hero-meta">{readingTime} min read</span>
            <span className="article-hero-meta-sep" />
            <span className="article-hero-meta">{sections.length} sections</span>
          </div>
          <h1 className="article-hero-title">{title}</h1>

          {/* Toolbar */}
          <div className="article-toolbar">
            <button className="toolbar-btn" onClick={() => setFocusMode(true)} title="Focus mode">
              <FocusIcon /> Focus
            </button>
            <button className="toolbar-btn" onClick={handleBookmark} data-active={isBookmarked} title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
              <BookmarkIcon filled={isBookmarked} /> {isBookmarked ? 'Saved' : 'Save'}
            </button>
            <button className="toolbar-btn" onClick={handleShare} title="Copy link">
              <ShareIcon /> {shareMsg || 'Share'}
            </button>
            <button className="toolbar-btn" onClick={() => setShowSectionPicker(p => !p)} title="Jump to section">
              <ListIcon /> Sections
            </button>
          </div>
        </div>

        {/* Section picker */}
        {showSectionPicker && (
          <div className="section-picker">
            {sections.map((s, i) => (
              <button key={i} className="section-picker-chip" data-active={i === currentSection} onClick={() => goTo(i)}>
                {s.title}
              </button>
            ))}
          </div>
        )}

        {/* Interconnects */}
        {linkedArticles.length > 0 && (
          <div className="article-links">
            {linkedArticles.map((link, i) => (
              <Link key={i} href={link.href} className="article-link-chip">
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Current section content */}
        {currentSectionData && (
          <article>
            <MarkdownRenderer content={currentSectionData.content} category={category} />
          </article>
        )}

        {/* Section navigation */}
        <div className="section-nav">
          <button className="section-nav-btn" disabled={currentSection === 0} onClick={() => goTo(currentSection - 1)}>
            <ChevronLeftIcon /> Prev
          </button>
          <span className="section-counter">
            {currentSection + 1} / {sections.length}
          </span>
          <button className="section-nav-btn" disabled={currentSection === sections.length - 1} onClick={() => goTo(currentSection + 1)}>
            Next <ChevronRightIcon />
          </button>
        </div>

        {/* Prev/Next article links */}
        {(prevArticle || nextArticle) && (
          <div className="grid grid-cols-2 gap-3" style={{ borderTop: '1px solid var(--theme-border, var(--color-border-default))', paddingTop: '24px', marginTop: '24px' }}>
            {prevArticle ? (
              <Link href={`/${category}/${prevArticle.slug}`}
                className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px', textDecoration: 'none' }}>
                <span className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>&larr; Previous</span>
                <span className="t-body" style={{ fontSize: '13px', color: 'var(--theme-text-primary, var(--color-ola-leaf))' }}>{prevArticle.title}</span>
              </Link>
            ) : <div />}
            {nextArticle ? (
              <Link href={`/${category}/${nextArticle.slug}`}
                className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px', textDecoration: 'none', textAlign: 'right', alignItems: 'flex-end' }}>
                <span className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>Next &rarr;</span>
                <span className="t-body" style={{ fontSize: '13px', color: 'var(--theme-text-primary, var(--color-ola-leaf))' }}>{nextArticle.title}</span>
              </Link>
            ) : <div />}
          </div>
        )}
      </div>

      {/* ── FOCUS MODE OVERLAY ─────────────────────────────── */}
      {focusMode && (
        <div className="focus-overlay" data-mode={focusTheme}>
          <div className="focus-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="toolbar-btn" onClick={() => setFocusMode(false)} title="Exit focus mode" style={{ border: 'none', padding: '6px' }}>
                <CloseIcon />
              </button>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 500, opacity: 0.7 }}>
                {sections[currentSection]?.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="toolbar-btn" onClick={handleBookmark} data-active={isBookmarked} style={{ border: 'none', padding: '6px' }} title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
                <BookmarkIcon filled={isBookmarked} />
              </button>
              <button className="toolbar-btn" onClick={() => setFocusTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ border: 'none', padding: '6px' }} title="Toggle reading theme">
                {focusTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <span className="section-counter" style={{ marginLeft: '4px' }}>
                {currentSection + 1} / {sections.length}
              </span>
            </div>
          </div>

          <div className="focus-body">
            <div className="prose">
              {currentSectionData && (
                <MarkdownRenderer content={currentSectionData.content} category={category} />
              )}
            </div>
          </div>

          <div className="focus-nav">
            <button className="section-nav-btn" disabled={currentSection === 0} onClick={() => goTo(currentSection - 1)}>
              <ChevronLeftIcon /> Prev
            </button>
            <button className="section-nav-btn" onClick={() => setShowSectionPicker(p => !p)}>
              <ListIcon /> {sections[currentSection]?.title}
            </button>
            <button className="section-nav-btn" disabled={currentSection === sections.length - 1} onClick={() => goTo(currentSection + 1)}>
              Next <ChevronRightIcon />
            </button>
          </div>

          {/* Section picker in focus mode */}
          {showSectionPicker && (
            <div style={{ position: 'fixed', bottom: '56px', left: '50%', transform: 'translateX(-50%)', zIndex: 10001, maxWidth: '600px', width: '90vw', maxHeight: '50vh', overflowY: 'auto', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--theme-border, var(--color-border-default))', background: focusTheme === 'dark' ? 'var(--color-manuscript)' : '#F0F0F2' }}>
              <div className="section-picker">
                {sections.map((s, i) => (
                  <button key={i} className="section-picker-chip" data-active={i === currentSection} onClick={() => goTo(i)}>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
