'use client';

import { useState } from 'react';
import { LEARNING_PHASES } from '@/lib/viz-data';
import GanttChart from '@/app/components/GanttChart';
import type { GanttItem } from '@/app/components/GanttChart';

export default function LearningGanttChart() {
  const [zoom, setZoom] = useState(1);

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

  return (
    <div>
      {/* Zoom controls */}
      <div className="hidden md:flex items-center justify-end mb-3 gap-2">
        <span className="text-xs text-text-muted font-mono">Zoom:</span>
        {[1, 1.5, 2].map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={`text-xs px-2 py-0.5 rounded border font-mono transition-colors ${
              zoom === z ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/10' : 'border-border-muted text-text-muted hover:text-text-secondary'
            }`}
          >
            {z}x
          </button>
        ))}
      </div>

      <div
        className="overflow-x-auto"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', minWidth: `${100 * zoom}%` }}
      >
        <GanttChart items={items} totalWeeks={26} projectStart={new Date('2026-04-13')} />
      </div>
    </div>
  );
}
