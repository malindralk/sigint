'use client';

import { useState, useRef, useCallback } from 'react';

export interface GanttItem {
  section: string;
  label: string;
  weekOffset: number;
  durationWeeks: number;
  color?: string;
  subtitle?: string;
}

const SECTION_COLORS = ['#39d353', '#58a6ff', '#bc8cff', '#f0883e', '#e3b341', '#ff7b72', '#7ee787', '#a5d6ff'];

const LABEL_WIDTH = 208; // px — fixed label column

function buildMonthBands(projectStart: Date, totalWeeks: number) {
  const bands: { label: string; startPct: number; widthPct: number }[] = [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const totalMs = totalWeeks * weekMs;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let cursor = new Date(projectStart);
  while (cursor.getTime() < projectStart.getTime() + totalMs) {
    const bandStart = cursor.getTime();
    const bandLabel = `${months[cursor.getMonth()]} ${cursor.getFullYear()}`;
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

function getCursorInfo(pct: number, totalWeeks: number, projectStart: Date) {
  const weekFloat = (pct / 100) * totalWeeks;
  const weekNum = Math.floor(weekFloat) + 1;
  const ms = projectStart.getTime() + weekFloat * 7 * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return { weekNum: Math.min(weekNum, totalWeeks), dateStr: `${months[d.getMonth()]} ${d.getDate()}` };
}

export default function GanttChart({
  items,
  totalWeeks,
  projectStart = new Date('2026-04-13'),
}: {
  items: GanttItem[];
  totalWeeks: number;
  projectStart?: Date;
}) {
  const [cursorPct, setCursorPct] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setCursorPct(pct);
  }, []);

  const handleMouseLeave = useCallback(() => setCursorPct(null), []);

  const sections = [...new Set(items.map(i => i.section))];
  const colorMap = new Map<string, string>();
  sections.forEach((s, i) => colorMap.set(s, SECTION_COLORS[i % SECTION_COLORS.length]));

  const monthBands = buildMonthBands(projectStart, totalWeeks);

  const grouped = sections.map(sec => ({
    section: sec,
    color: colorMap.get(sec)!,
    items: items.filter(i => i.section === sec),
  }));

  const cursorInfo = cursorPct !== null ? getCursorInfo(cursorPct, totalWeeks, projectStart) : null;

  return (
    <div style={{ minWidth: '900px' }}>
      {/* Month/Year axis */}
      <div className="flex items-center gap-0 mb-1">
        <div className="shrink-0" style={{ width: LABEL_WIDTH }} />
        <div className="flex-1 relative">
          {monthBands.map((band, i) => (
            <div
              key={i}
              className="absolute text-center text-xs font-mono py-2 border-l border-r"
              style={{
                left: `${band.startPct}%`,
                width: `${band.widthPct}%`,
                color: '#8b949e',
                borderColor: '#21262d',
              }}
            >
              {band.label}
            </div>
          ))}
          <div style={{ height: '32px' }} />
        </div>
      </div>

      {/* Week sub-axis */}
      <div className="flex items-center gap-0 mb-1">
        <div className="shrink-0" style={{ width: LABEL_WIDTH }} />
        <div className="flex-1 relative">
          {Array.from({ length: totalWeeks }, (_, i) => (
            <div
              key={i}
              className="absolute text-center text-xs font-mono py-0.5 border-l"
              style={{
                left: `${(i / totalWeeks) * 100}%`,
                width: `${100 / totalWeeks}%`,
                color: '#484f58',
                borderColor: '#21262d',
                fontSize: '9px',
                display: (i + 1) % 2 === 0 ? 'block' : 'none',
              }}
            >
              {i + 1}
            </div>
          ))}
          <div style={{ height: '20px' }} />
        </div>
      </div>

      {/* Chart rows — single mouse tracking layer */}
      <div
        className="relative"
        ref={trackRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Cursor tooltip */}
        {cursorInfo && cursorPct !== null && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: `${cursorPct}%`,
              transform: 'translateX(-50%)',
              top: -4,
            }}
          >
            <div
              className="text-xs font-mono px-2 py-0.5 rounded whitespace-nowrap"
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                color: '#58a6ff',
              }}
            >
              W{cursorInfo.weekNum} · {cursorInfo.dateStr}
            </div>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.section} className="mb-3">
            {/* Section header */}
            <div
              className="flex items-center gap-0 py-1.5 px-2 rounded mb-0.5 text-xs font-mono font-semibold uppercase tracking-wider"
              style={{ color: group.color, background: `${group.color}0a`, borderLeft: `3px solid ${group.color}` }}
            >
              <div className="shrink-0" style={{ width: LABEL_WIDTH }}>{group.section}</div>
            </div>

            {/* Items */}
            {group.items.map((item, idx) => {
              const leftPct = (item.weekOffset / totalWeeks) * 100;
              const widthPct = (item.durationWeeks / totalWeeks) * 100;

              return (
                <div key={idx} className="flex items-center gap-0 py-0.5 rounded group/item hover:bg-white/[0.02]">
                  {/* Label */}
                  <div className="shrink-0 pr-3 flex items-baseline gap-2" style={{ width: LABEL_WIDTH }}>
                    <span className="text-xs font-mono truncate block" style={{ color: '#cdd9e5' }} title={item.label}>
                      {item.label}
                    </span>
                    {item.subtitle && (
                      <span className="text-xs font-mono shrink-0" style={{ color: '#484f58' }}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>

                  {/* Bar row */}
                  <div className="flex-1 relative h-6">
                    {/* Cursor line */}
                    {cursorPct !== null && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-10"
                        style={{ left: `${cursorPct}%`, width: '1px', background: 'rgba(88, 166, 255, 0.35)' }}
                      />
                    )}

                    {/* Grid lines */}
                    {Array.from({ length: totalWeeks + 1 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l"
                        style={{ left: `${(i / totalWeeks) * 100}%`, borderColor: '#21262d', opacity: 0.3 }}
                      />
                    ))}

                    {/* Bar */}
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded-sm flex items-center px-2 text-xs font-mono whitespace-nowrap overflow-hidden cursor-default"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 3)}%`,
                        minWidth: '32px',
                        background: `${item.color ?? group.color}18`,
                        border: `1px solid ${item.color ?? group.color}55`,
                        color: item.color ?? group.color,
                      }}
                    >
                      <span className="truncate">{item.durationWeeks}w</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
