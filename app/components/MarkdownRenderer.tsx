'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';

interface Props {
  content: string;
  category: string;
}

function transformHref(href: string | undefined, category: string): string | undefined {
  if (!href) return href;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('/')) return href;
  const slug = href.replace(/\.md$/, '');
  return `/${category}/${slug}`;
}

interface GanttItem {
  section: string;
  label: string;
  startWeek: number;
  durationWeeks: number;
}

function parseMermaidGantt(code: string): GanttItem[] {
  const items: GanttItem[] = [];
  let currentSection = '';
  const sectionMap = new Map<string, number>();
  let weekCursor = 0;

  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim();

    // Skip directives
    if (!line || line.startsWith('gantt') || line.startsWith('title') || line.startsWith('dateFormat') || line.startsWith('axisFormat') || line.startsWith('%')) continue;

    // section header
    const secMatch = line.match(/^section\s+(.+)$/i);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      if (!sectionMap.has(currentSection)) sectionMap.set(currentSection, 0);
      continue;
    }

    // task: label :alias, start, duration
    // start can be: a date (YYYY-MM-DD), after <alias>, or nothing
    // duration: Xw
    const taskMatch = line.match(/^(.+?)\s*:\s*\w+,\s*(?:after\s+\w+|(\d{4}-\d{2}-\d{2})),\s*(\d+)w$/);
    if (taskMatch && currentSection) {
      const label = taskMatch[1].trim();
      const durationWeeks = parseInt(taskMatch[3], 10);
      // Sequential within section
      const lastInSection = [...items].reverse().find(i => i.section === currentSection);
      const startWeek = lastInSection ? lastInSection.startWeek + lastInSection.durationWeeks : weekCursor;
      items.push({ section: currentSection, label, startWeek, durationWeeks });
      weekCursor = Math.max(weekCursor, startWeek + durationWeeks);
    }
  }

  return items;
}

function GanttChart({ items }: { items: GanttItem[] }) {
  const sectionColors = ['#39d353', '#58a6ff', '#bc8cff', '#f0883e', '#e3b341', '#ff7b72', '#7ee787', '#a5d6ff'];

  // Pre-compute colors per section
  const colorCache = new Map<string, string>();
  const sections = [...new Set(items.map(i => i.section))];
  sections.forEach((s, i) => colorCache.set(s, sectionColors[i % sectionColors.length]));

  let totalWeeks = 0;
  for (const item of items) {
    const end = item.startWeek + item.durationWeeks;
    if (end > totalWeeks) totalWeeks = end;
  }
  if (totalWeeks === 0) totalWeeks = 26;

  return (
    <div className="w-full" style={{ minWidth: '800px' }}>
      {/* Week ruler */}
      <div className="flex items-center gap-0 mb-2">
        <div className="w-48 shrink-0" />
        <div className="flex-1 flex">
          {Array.from({ length: totalWeeks }, (_, i) => (
            <div
              key={i}
              className="flex-1 text-center text-xs font-mono border-l py-1"
              style={{
                minWidth: 0,
                display: (i + 1) % 4 === 0 || i === 0 ? 'block' : 'none',
                color: '#6e7681',
                borderColor: '#21262d',
              }}
            >
              W{i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-1">
        {items.map((item, idx) => {
          const leftPct = (item.startWeek / totalWeeks) * 100;
          const widthPct = (item.durationWeeks / totalWeeks) * 100;
          const color = colorCache.get(item.section) || '#58a6ff';
          const isSectionStart = idx === 0 || items[idx - 1].section !== item.section;

          return (
            <div key={idx} className="flex items-center gap-0" style={{ marginTop: isSectionStart ? '8px' : 0 }}>
              <div className="w-48 shrink-0 pr-4">
                <div
                  className="text-xs font-mono truncate"
                  style={{ color: isSectionStart ? color : '#8b949e' }}
                  title={item.label}
                >
                  {item.label}
                </div>
              </div>
              <div className="flex-1 relative h-7">
                {/* Grid lines */}
                <div
                  className="absolute inset-y-0 left-0 right-0 border-l opacity-20"
                  style={{
                    borderColor: '#30363d',
                    backgroundImage: 'repeating-linear-gradient(90deg, #30363d 0px, #30363d 1px, transparent 1px, transparent calc(100% / var(--tw, 26)))',
                  }}
                />
                {/* Bar */}
                <div
                  className="absolute top-0.5 bottom-0.5 rounded flex items-center px-2 text-xs font-mono whitespace-nowrap overflow-hidden"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: `${color}22`,
                    border: `1px solid ${color}66`,
                    color: color,
                  }}
                >
                  {item.durationWeeks}w
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MermaidGanttBlock({ code }: { code: string }) {
  const [open, setOpen] = useState(false);

  const items = parseMermaidGantt(code);
  if (items.length === 0) {
    return (
      <pre className="text-xs font-mono p-4 rounded-lg border overflow-x-auto" style={{ borderColor: '#30363d', background: '#161b22', color: '#adbac7' }}>
        {code}
      </pre>
    );
  }

  return (
    <>
      {/* Inline preview */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setOpen(true)}
            className="text-xs px-3 py-1.5 rounded border cursor-pointer transition-colors"
            style={{ borderColor: '#30363d', color: '#8b949e', background: 'transparent' }}
          >
            <span style={{ marginRight: 6 }}>Expand</span>
            &#x2922;
          </button>
          <div className="text-xs font-mono" style={{ color: '#6e7681' }}>
            {items.length} tasks · {(() => { let m = 0; items.forEach(i => { const e = i.startWeek + i.durationWeeks; if (e > m) m = e; }); return m; })()} weeks
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border p-4" style={{ borderColor: '#30363d', background: '#0d1117' }}>
          <GanttChart items={items} />
        </div>
      </div>

      {/* Full-screen expanded */}
      {open && (
        <div className="fixed inset-0" style={{ zIndex: 99999, background: '#080b10' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#30363d', background: '#080b10', position: 'sticky', top: 0, zIndex: 10 }}>
            <span className="text-sm font-mono" style={{ color: '#e6edf3' }}>Gantt Chart</span>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded cursor-pointer transition-colors"
              style={{ color: '#8b949e' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#161b22')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              &#x2715;
            </button>
          </div>

          {/* Full body */}
          <div
            className="overflow-auto"
            style={{ height: 'calc(100vh - 52px)' }}
            onClick={() => setOpen(false)}
          >
            <div className="p-8" onClick={(e) => e.stopPropagation()}>
              <GanttChart items={items} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MarkdownRenderer({ content, category }: Props) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          a({ href, children, ...props }) {
            return <a href={transformHref(href, category)} {...props}>{children}</a>;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (match && match[1] === 'mermaid' && typeof children === 'string') {
              if (children.includes('gantt')) {
                return <MermaidGanttBlock code={children} />;
              }
              // Other mermaid: show as pre
              return (
                <pre className="text-xs font-mono p-4 rounded-lg border overflow-x-auto" style={{ borderColor: '#30363d', background: '#161b22', color: '#adbac7' }}>
                  {children}
                </pre>
              );
            }
            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
