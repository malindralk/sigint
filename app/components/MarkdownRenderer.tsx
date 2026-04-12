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

/* ─── Mermaid gantt parser ─── */

interface GanttItem {
  alias: string;
  section: string;
  label: string;
  hours: string;
  weekOffset: number;   // weeks from project start
  durationWeeks: number;
  startDate: string;    // "Apr 13"
  endDate: string;      // "Apr 27"
}

function parseMermaidGantt(code: string) {
  const items: GanttItem[] = [];
  let currentSection = '';
  const aliasMap = new Map<string, number>(); // alias → weekOffset of end
  let projectStart = new Date('2026-04-13');
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('gantt') || line.startsWith('dateFormat') || line.startsWith('axisFormat') || line.startsWith('%')) continue;

    // title
    const titleMatch = line.match(/^title\s+(.+)$/i);
    if (titleMatch) continue;

    // section
    const secMatch = line.match(/^section\s+(.+)$/i);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      continue;
    }

    // task: label :alias, start, duration
    // start can be: YYYY-MM-DD or after <alias>
    // duration: Xw
    const taskMatch = line.match(/^(.+?)\s*:\s*(\w+),\s*(?:(\d{4}-\d{2}-\d{2})|after\s+(\w+)),\s*(\d+)w$/);
    if (!taskMatch || !currentSection) continue;

    const label = taskMatch[1].trim();
    const alias = taskMatch[2];
    const startDate = taskMatch[3] || '';
    const afterAlias = taskMatch[4] || '';
    const durationWeeks = parseInt(taskMatch[5], 10);

    // Extract hours from label like "(20h)" or "(7.5h)"
    const hoursMatch = label.match(/\(([\d.]+)h\)/);
    const hours = hoursMatch ? hoursMatch[1] + 'h' : '';

    // Clean label
    const cleanLabel = label.replace(/\s*\([\d.]+h\)\s*$/, '').trim();

    let startWeek: number;
    if (startDate) {
      const d = new Date(startDate);
      startWeek = Math.round((d.getTime() - projectStart.getTime()) / weekMs);
    } else if (afterAlias && aliasMap.has(afterAlias)) {
      startWeek = aliasMap.get(afterAlias)!;
    } else {
      startWeek = 0;
    }

    const itemStart = projectStart.getTime() + startWeek * weekMs;
    const itemEnd = itemStart + durationWeeks * weekMs;
    const sDate = new Date(itemStart);
    const eDate = new Date(itemEnd);

    aliasMap.set(alias, startWeek + durationWeeks);

    const fmt = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    };

    items.push({
      alias,
      section: currentSection,
      label: cleanLabel,
      hours,
      weekOffset: startWeek,
      durationWeeks,
      startDate: fmt(sDate),
      endDate: fmt(eDate),
    });
  }

  // Total weeks
  let totalWeeks = 0;
  for (const item of items) {
    const end = item.weekOffset + item.durationWeeks;
    if (end > totalWeeks) totalWeeks = end;
  }

  return { items, totalWeeks, projectStart };
}

/* ─── Month/Year timeline ─── */

function buildMonthBands(projectStart: Date, totalWeeks: number) {
  const bands: { label: string; startPct: number; widthPct: number }[] = [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const totalMs = totalWeeks * weekMs;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let cursor = new Date(projectStart);
  while (cursor.getTime() < projectStart.getTime() + totalMs) {
    const bandStart = cursor.getTime();
    const bandLabel = `${months[cursor.getMonth()]} ${cursor.getFullYear()}`;

    // Advance to next month
    const nextMonth = new Date(cursor);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    const bandEnd = Math.min(nextMonth.getTime(), projectStart.getTime() + totalMs);
    const startPct = ((bandStart - projectStart.getTime()) / totalMs) * 100;
    const widthPct = ((bandEnd - bandStart) / totalMs) * 100;

    bands.push({ label: bandLabel, startPct, widthPct });
    cursor = nextMonth;
  }

  return bands;
}

/* ─── Gantt renderer ─── */

const SECTION_COLORS = ['#39d353', '#58a6ff', '#bc8cff', '#f0883e', '#e3b341', '#ff7b72', '#7ee787', '#a5d6ff'];

function GanttChart({ items, totalWeeks, projectStart }: { items: GanttItem[]; totalWeeks: number; projectStart: Date }) {
  const sections = [...new Set(items.map(i => i.section))];
  const colorMap = new Map<string, string>();
  sections.forEach((s, i) => colorMap.set(s, SECTION_COLORS[i % SECTION_COLORS.length]));

  const monthBands = buildMonthBands(projectStart, totalWeeks);

  // Group by section
  const grouped = sections.map(sec => ({
    section: sec,
    color: colorMap.get(sec)!,
    items: items.filter(i => i.section === sec),
  }));

  return (
    <div style={{ minWidth: '900px' }}>
      {/* Month/Year axis header */}
      <div className="flex items-center gap-0 mb-1">
        <div className="w-52 shrink-0" />
        <div className="flex-1 flex relative">
          {monthBands.map((band, i) => (
            <div
              key={i}
              className="text-center text-xs font-mono py-2 border-l border-r"
              style={{
                position: 'absolute',
                left: `${band.startPct}%`,
                width: `${band.widthPct}%`,
                color: '#8b949e',
                borderColor: '#21262d',
              }}
            >
              {band.label}
            </div>
          ))}
          <div className="flex-1" style={{ height: '32px' }} />
        </div>
      </div>

      {/* Week sub-axis */}
      <div className="flex items-center gap-0 mb-2">
        <div className="w-52 shrink-0" />
        <div className="flex-1 flex">
          {Array.from({ length: totalWeeks }, (_, i) => (
            <div
              key={i}
              className="flex-1 text-center text-xs font-mono py-0.5 border-l"
              style={{
                minWidth: 0,
                color: '#484f58',
                borderColor: '#21262d',
                fontSize: '9px',
                display: (i + 1) % 2 === 0 ? 'block' : 'none',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Section groups */}
      {grouped.map((group) => (
        <div key={group.section} className="mb-3">
          {/* Section header */}
          <div
            className="flex items-center gap-0 py-1.5 px-2 rounded mb-0.5 text-xs font-mono font-semibold uppercase tracking-wider"
            style={{ color: group.color, background: `${group.color}0a`, borderLeft: `3px solid ${group.color}` }}
          >
            <div className="w-48">{group.section}</div>
          </div>

          {/* Items */}
          {group.items.map((item) => {
            const leftPct = (item.weekOffset / totalWeeks) * 100;
            const widthPct = (item.durationWeeks / totalWeeks) * 100;
            const color = group.color;

            return (
              <div
                key={item.alias}
                className="flex items-center gap-0 py-0.5 rounded group/item hover:bg-white/[0.02]"
              >
                {/* Label column */}
                <div className="w-52 shrink-0 pr-3 flex items-baseline gap-2">
                  <span
                    className="text-xs font-mono truncate block"
                    style={{ color: '#cdd9e5' }}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  {item.hours && (
                    <span className="text-xs font-mono shrink-0" style={{ color: '#484f58' }}>
                      {item.hours}
                    </span>
                  )}
                </div>

                {/* Bar column */}
                <div className="flex-1 relative h-6">
                  {/* Background grid */}
                  <div
                    className="absolute inset-y-0 left-0 right-0"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent calc(100% / var(--tw) - 1px), #161b22 calc(100% / var(--tw) - 1px), #161b22 calc(100% / var(--tw)))',
                    }}
                  />

                  {/* The bar */}
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-sm flex items-center px-2 text-xs font-mono whitespace-nowrap overflow-hidden cursor-default transition-all duration-150"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      minWidth: '32px',
                      background: `${color}18`,
                      border: `1px solid ${color}55`,
                      color: color,
                    }}
                  >
                    <span className="truncate">{item.durationWeeks}w</span>
                    <span className="ml-1 text-[10px] opacity-60 hidden group-hover/item:block" style={{ color }}>
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Mermaid block wrapper ─── */

function MermaidGanttBlock({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const parsed = parseMermaidGantt(code);
  const { items, totalWeeks, projectStart } = parsed;

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
            {items.length} tasks · {totalWeeks} weeks
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border p-4" style={{ borderColor: '#30363d', background: '#0d1117' }}>
          <GanttChart items={items} totalWeeks={totalWeeks} projectStart={projectStart} />
        </div>
      </div>

      {/* Full-screen expanded */}
      {open && (
        <div className="fixed inset-0" style={{ zIndex: 99999, background: '#080b10' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#30363d', background: '#080b10', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <span className="text-sm font-mono" style={{ color: '#e6edf3' }}>Gantt Chart</span>
              <span className="text-xs font-mono ml-3" style={{ color: '#6e7681' }}>
                {totalWeeks} weeks · {items.length} tasks
              </span>
            </div>
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
          <div className="overflow-auto" style={{ height: 'calc(100vh - 52px)' }} onClick={() => setOpen(false)}>
            <div className="p-6" onClick={(e) => e.stopPropagation()}>
              <GanttChart items={items} totalWeeks={totalWeeks} projectStart={projectStart} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main renderer ─── */

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
