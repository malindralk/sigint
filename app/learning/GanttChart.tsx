'use client';

import { useState } from 'react';
import { LEARNING_PHASES } from '@/lib/viz-data';
import GanttChart from '@/app/components/GanttChart';
import type { GanttItem } from '@/app/components/GanttChart';

export default function LearningGanttChart() {
  const [open, setOpen] = useState(false);

  const items: GanttItem[] = [];
  for (const phase of LEARNING_PHASES) {
    const [startW, endW] = phase.weeks.split('\u2013').map(Number);
    const weekOffset = startW - 1;
    const durationWeeks = endW - startW + 1;
    items.push({
      section: `Phase ${phase.phase}`,
      label: phase.title,
      subtitle: `${phase.hours}h`,
      weekOffset,
      durationWeeks,
    });
  }

  const chart = <GanttChart items={items} totalWeeks={26} projectStart={new Date('2026-04-13')} />;

  return (
    <div>
      {/* Inline preview */}
      <div className="my-0">
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
            {items.length} tasks · 26 weeks
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border p-4" style={{ borderColor: '#30363d', background: '#0d1117' }}>
          {chart}
        </div>
      </div>

      {/* Full-screen expanded */}
      {open && (
        <div className="fixed inset-0" style={{ zIndex: 99999, background: '#080b10' }}>
          <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#30363d', background: '#080b10', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <span className="text-sm font-mono" style={{ color: '#e6edf3' }}>Learning Path — Gantt Chart</span>
              <span className="text-xs font-mono ml-3" style={{ color: '#6e7681' }}>26 weeks · {items.length} phases</span>
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
          <div className="overflow-auto" style={{ height: 'calc(100vh - 52px)' }} onClick={() => setOpen(false)}>
            <div className="p-6" onClick={(e) => e.stopPropagation()}>
              {chart}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
