'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import GanttChart from '@/app/components/GanttChart';
import { BRAND } from '@/lib/brand-colors';
import 'highlight.js/styles/github-dark.css';

interface Props {
  content: string;
  category: string;
}

function transformHref(href: string | undefined, category: string): string | undefined {
  if (!href) return href;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('/'))
    return href;
  return `/${category}/${href.replace(/\.md$/, '')}`;
}

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
  const projectStart = new Date('2026-04-13');
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim();
    if (
      !line ||
      line.startsWith('gantt') ||
      line.startsWith('dateFormat') ||
      line.startsWith('axisFormat') ||
      line.startsWith('%') ||
      line.startsWith('title')
    )
      continue;
    const secMatch = line.match(/^section\s+(.+)$/i);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      continue;
    }
    const taskMatch = line.match(/^(.+?)\s*:\s*(\w+),\s*(?:(\d{4}-\d{2}-\d{2})|after\s+(\w+)),\s*(\d+)w$/);
    if (!taskMatch || !currentSection) continue;
    const label = taskMatch[1].trim();
    const alias = taskMatch[2];
    const startDate = taskMatch[3] || '';
    const afterAlias = taskMatch[4] || '';
    const durationWeeks = parseInt(taskMatch[5], 10);
    const hoursMatch = label.match(/\(([\d.]+)h\)/);
    const subtitle = hoursMatch ? `${hoursMatch[1]}h` : '';
    const cleanLabel = label.replace(/\s*\([\d.]+h\)\s*$/, '').trim();
    let startWeek: number;
    if (startDate) startWeek = Math.round((new Date(startDate).getTime() - projectStart.getTime()) / weekMs);
    else if (afterAlias && aliasMap.has(afterAlias)) startWeek = aliasMap.get(afterAlias) ?? 0;
    else startWeek = 0;
    aliasMap.set(alias, startWeek + durationWeeks);
    items.push({ alias, section: currentSection, label: cleanLabel, subtitle, weekOffset: startWeek, durationWeeks });
  }

  let totalWeeks = 0;
  for (const item of items) {
    const end = item.weekOffset + item.durationWeeks;
    if (end > totalWeeks) totalWeeks = end;
  }
  return { items, totalWeeks, projectStart };
}

const GANTT_COLORS = [BRAND.primary, BRAND.info, BRAND.accent, BRAND.success, BRAND.danger];

function MermaidGanttBlock({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const parsed = parseMermaidGantt(code);
  if (parsed.items.length === 0) {
    return (
      <pre
        className="text-xs font-mono p-4 rounded-lg border overflow-x-auto"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
      >
        {code}
      </pre>
    );
  }

  const ganttItems = parsed.items.map((item, i) => ({
    ...item,
    color: GANTT_COLORS[i % GANTT_COLORS.length],
  }));

  const chart = <GanttChart items={ganttItems} totalWeeks={parsed.totalWeeks} projectStart={parsed.projectStart} />;

  return (
    <>
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs px-3 py-1.5 rounded border cursor-pointer transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
          >
            <span style={{ marginRight: 6 }}>Expand</span>&#x2922;
          </button>
          <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {parsed.items.length} tasks · {parsed.totalWeeks} weeks
          </div>
        </div>
        <div
          className="overflow-x-auto rounded-lg border p-4"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
        >
          {chart}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0" style={{ zIndex: 99999, background: 'var(--bg-base)' }}>
          <div
            className="flex items-center justify-between px-6 py-3 border-b"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-base)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div>
              <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                Gantt Chart
              </span>
              <span className="text-xs font-mono ml-3" style={{ color: 'var(--text-muted)' }}>
                {parsed.totalWeeks} weeks · {parsed.items.length} tasks
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded cursor-pointer transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              &#x2715;
            </button>
          </div>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: fullscreen overlay dismiss */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: fullscreen overlay dismiss */}
          <div className="overflow-auto" style={{ height: 'calc(100vh - 52px)' }} onClick={() => setOpen(false)}>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation handler */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation handler */}
            <div className="p-6" onClick={(e) => e.stopPropagation()}>
              {chart}
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
        rehypePlugins={[rehypeHighlight, rehypeSlug, rehypeSanitize]}
        components={{
          a({ href, children, ...props }) {
            return (
              <a href={transformHref(href, category)} {...props}>
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (match && match[1] === 'mermaid' && typeof children === 'string') {
              if (children.includes('gantt')) return <MermaidGanttBlock code={children} />;
              return (
                <pre
                  className="text-xs font-mono p-4 rounded-lg border overflow-x-auto"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {children}
                </pre>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
