'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import GanttChart from '@/app/components/GanttChart';
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

/* ─── Mermaid gantt parser ─── */

interface RawItem {
  alias: string;
  section: string;
  label: string;
  subtitle: string;
  weekOffset: number;
  durationWeeks: number;
}

function parseMermaidGantt(code: string) {
  const items: RawItem[] = [];
  let currentSection = '';
  const aliasMap = new Map<string, number>();
  let projectStart = new Date('2026-04-13');
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('gantt') || line.startsWith('dateFormat') || line.startsWith('axisFormat') || line.startsWith('%') || line.startsWith('title')) continue;

    const secMatch = line.match(/^section\s+(.+)$/i);
    if (secMatch) { currentSection = secMatch[1].trim(); continue; }

    const taskMatch = line.match(/^(.+?)\s*:\s*(\w+),\s*(?:(\d{4}-\d{2}-\d{2})|after\s+(\w+)),\s*(\d+)w$/);
    if (!taskMatch || !currentSection) continue;

    const label = taskMatch[1].trim();
    const alias = taskMatch[2];
    const startDate = taskMatch[3] || '';
    const afterAlias = taskMatch[4] || '';
    const durationWeeks = parseInt(taskMatch[5], 10);

    const hoursMatch = label.match(/\(([\d.]+)h\)/);
    const subtitle = hoursMatch ? hoursMatch[1] + 'h' : '';
    const cleanLabel = label.replace(/\s*\([\d.]+h\)\s*$/, '').trim();

    let startWeek: number;
    if (startDate) {
      startWeek = Math.round((new Date(startDate).getTime() - projectStart.getTime()) / weekMs);
    } else if (afterAlias && aliasMap.has(afterAlias)) {
      startWeek = aliasMap.get(afterAlias)!;
    } else {
      startWeek = 0;
    }
    aliasMap.set(alias, startWeek + durationWeeks);

    items.push({ alias, section: currentSection, label: cleanLabel, subtitle, weekOffset: startWeek, durationWeeks });
  }

  let totalWeeks = 0;
  for (const item of items) { const end = item.weekOffset + item.durationWeeks; if (end > totalWeeks) totalWeeks = end; }

  return { items, totalWeeks, projectStart };
}

function MermaidGanttBlock({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const parsed = parseMermaidGantt(code);

  if (parsed.items.length === 0) {
    return <pre className="text-xs font-mono p-4 rounded-lg border overflow-x-auto" style={{ borderColor: '#30363d', background: '#161b22', color: '#adbac7' }}>{code}</pre>;
  }

  const chart = (
    <GanttChart items={parsed.items} totalWeeks={parsed.totalWeeks} projectStart={parsed.projectStart} />
  );

  return (
    <>
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setOpen(true)} className="text-xs px-3 py-1.5 rounded border cursor-pointer transition-colors" style={{ borderColor: '#30363d', color: '#8b949e', background: 'transparent' }}>
            <span style={{ marginRight: 6 }}>Expand</span>&#x2922;
          </button>
          <div className="text-xs font-mono" style={{ color: '#6e7681' }}>{parsed.items.length} tasks · {parsed.totalWeeks} weeks</div>
        </div>
        <div className="overflow-x-auto rounded-lg border p-4" style={{ borderColor: '#30363d', background: '#0d1117' }}>{chart}</div>
      </div>

      {open && (
        <div className="fixed inset-0" style={{ zIndex: 99999, background: '#080b10' }}>
          <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#30363d', background: '#080b10', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <span className="text-sm font-mono" style={{ color: '#e6edf3' }}>Gantt Chart</span>
              <span className="text-xs font-mono ml-3" style={{ color: '#6e7681' }}>{parsed.totalWeeks} weeks · {parsed.items.length} tasks</span>
            </div>
            <button onClick={() => setOpen(false)} className="h-8 w-8 flex items-center justify-center rounded cursor-pointer transition-colors" style={{ color: '#8b949e' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#161b22')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>&#x2715;</button>
          </div>
          <div className="overflow-auto" style={{ height: 'calc(100vh - 52px)' }} onClick={() => setOpen(false)}>
            <div className="p-6" onClick={(e) => e.stopPropagation()}>{chart}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MarkdownRenderer({ content, category }: Props) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          a({ href, children, ...props }) { return <a href={transformHref(href, category)} {...props}>{children}</a>; },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (match && match[1] === 'mermaid' && typeof children === 'string') {
              if (children.includes('gantt')) return <MermaidGanttBlock code={children} />;
              return <pre className="text-xs font-mono p-4 rounded-lg border overflow-x-auto" style={{ borderColor: '#30363d', background: '#161b22', color: '#adbac7' }}>{children}</pre>;
            }
            return <code className={className} {...props}>{children}</code>;
          },
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
