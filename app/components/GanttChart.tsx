'use client';

import { useState, useRef, useCallback } from 'react';
import { BRAND, CHART_COLORS } from '@/lib/brand-colors';

export interface GanttItem {
  section: string;
  label: string;
  weekOffset: number;
  durationWeeks: number;
  color?: string;
  subtitle?: string;
}

const BRAND_COLORS = [BRAND.primary, BRAND.info, BRAND.accent, BRAND.success, BRAND.danger];

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
  items?: GanttItem[];
  totalWeeks?: number;
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

  const weekCount = totalWeeks ?? 26;
  const monthBands = buildMonthBands(projectStart, weekCount);

  // Build items from LEARNING_PHASES if not provided
  const rows = items ?? [
    { label: 'DSP Foundations', subtitle: '130h', weekOffset: 0, durationWeeks: 8, color: BRAND_COLORS[0] },
    { label: 'Hardware Security', subtitle: '17.5h', weekOffset: 8, durationWeeks: 2, color: BRAND_COLORS[1] },
    { label: 'RF Engineering', subtitle: '70h', weekOffset: 12, durationWeeks: 5, color: BRAND_COLORS[2] },
    { label: 'ML for Signals', subtitle: '30h', weekOffset: 19, durationWeeks: 2, color: BRAND_COLORS[3] },
    { label: 'Supplementary', subtitle: '85h', weekOffset: 24, durationWeeks: 2, color: BRAND_COLORS[4] },
  ];

  const cursorInfo = cursorPct !== null ? getCursorInfo(cursorPct, weekCount, projectStart) : null;

  return (
    <div style={{ minWidth: '900px' }} ref={trackRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Month/Year axis */}
      <div className="flex items-center gap-0 mb-1">
        <div className="shrink-0" style={{ width: 180 }} />
        <div className="flex-1 relative">
          {monthBands.map((band, i) => (
            <div key={i} className="absolute text-center text-xs py-2 border-l border-r"
              style={{ left: `${band.startPct}%`, width: `${band.widthPct}%`, color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
              {band.label}
            </div>
          ))}
          <div style={{ height: '32px' }} />
        </div>
      </div>

      {/* Week sub-axis */}
      <div className="flex items-center gap-0 mb-1">
        <div className="shrink-0" style={{ width: 180 }} />
        <div className="flex-1 relative">
          {Array.from({ length: weekCount }, (_, i) => (
            <div key={i} className="absolute text-center text-xs py-0.5 border-l"
              style={{ left: `${(i / weekCount) * 100}%`, width: `${100 / weekCount}%`, color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', display: (i + 1) % 2 === 0 ? 'block' : 'none' }}>
              {i + 1}
            </div>
          ))}

          {/* Cursor tooltip */}
          {cursorInfo && cursorPct !== null && (
            <div className="absolute pointer-events-none" style={{ left: `${cursorPct}%`, transform: 'translateX(-50%)', top: 0, zIndex: 20 }}>
              <div className="text-xs px-2 py-0.5 rounded whitespace-nowrap" style={{ background: 'var(--theme-bg-elevated)', border: '1px solid var(--theme-border-strong)', color: BRAND.info, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                W{cursorInfo.weekNum} · {cursorInfo.dateStr}
              </div>
            </div>
          )}

          {/* Cursor vertical line */}
          {cursorPct !== null && (
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${cursorPct}%`, width: '1px', background: `${BRAND.info}59`, zIndex: 10 }} />
          )}

          <div style={{ height: '20px' }} />
        </div>
      </div>

      {/* Chart rows */}
      <div className="relative">
        {rows.map((row, idx) => {
          const leftPct = (row.weekOffset / weekCount) * 100;
          const widthPct = (row.durationWeeks / weekCount) * 100;
          const color = row.color ?? BRAND_COLORS[idx % BRAND_COLORS.length];

          return (
            <div key={idx} className="flex items-center gap-0 py-0.5 rounded" style={{ transition: 'background 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {/* Label */}
              <div className="shrink-0 pr-3 flex items-baseline gap-2" style={{ width: 180 }}>
                <span className="text-xs truncate block" style={{ color: 'var(--theme-text-secondary)', fontFamily: 'DM Sans, sans-serif' }} title={row.label}>
                  {row.label}
                </span>
                {row.subtitle && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--theme-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{row.subtitle}</span>
                )}
              </div>

              {/* Bar */}
              <div className="flex-1 relative h-6">
                {/* Grid lines */}
                {Array.from({ length: weekCount + 1 }, (_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l" style={{ left: `${(i / weekCount) * 100}%`, borderColor: 'var(--theme-border)', opacity: 0.3 }} />
                ))}

                <div className="absolute top-0.5 bottom-0.5 rounded-sm flex items-center px-2 text-xs font-mono whitespace-nowrap overflow-hidden cursor-default"
                  style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 3)}%`, minWidth: '32px', background: `${color}18`, border: `1px solid ${color}55`, color }}>
                  <span className="truncate">{row.durationWeeks}w</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
