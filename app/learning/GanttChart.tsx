'use client';

import { useState } from 'react';
import { LEARNING_PHASES } from '@/lib/viz-data';

const ZOOM_LEVELS = [1, 1.5, 2] as const;

function GanttBar({
  phase,
  startPct,
  widthPct,
}: {
  phase: { phase: number; title: string; weeks: string; hours: number; color: string };
  startPct: number;
  widthPct: number;
}) {
  return (
    <div className="flex items-center gap-0">
      <div className="w-40 shrink-0 pr-4">
        <div className="text-xs font-mono text-text-secondary truncate">Phase {phase.phase}</div>
        <div className="text-xs text-text-muted truncate">{phase.title}</div>
      </div>
      <div className="flex-1 relative h-8">
        <div
          className="absolute inset-y-0 left-0 right-0 border-l border-border-muted opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #30363d 0px, #30363d 1px, transparent 1px, transparent calc(100%/26))',
          }}
        />
        <div
          className="absolute top-1 bottom-1 rounded flex items-center px-2 text-xs font-mono whitespace-nowrap overflow-hidden"
          style={{
            left: `${startPct}%`,
            width: `${widthPct}%`,
            background: `${phase.color}22`,
            border: `1px solid ${phase.color}66`,
            color: phase.color,
          }}
        >
          {phase.weeks} · {phase.hours}h
        </div>
      </div>
    </div>
  );
}

export default function GanttChart() {
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoom = ZOOM_LEVELS[zoomIdx];

  const cycleZoom = () => setZoomIdx((i) => (i + 1) % ZOOM_LEVELS.length);

  return (
    <div>
      {/* Zoom controls — desktop only */}
      <div className="hidden md:flex items-center justify-end mb-3 gap-2">
        <span className="text-xs text-text-muted font-mono">Zoom:</span>
        {ZOOM_LEVELS.map((z, i) => (
          <button
            key={z}
            onClick={cycleZoom}
            className={`text-xs px-2 py-0.5 rounded border font-mono transition-colors ${
              zoomIdx === i
                ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/10'
                : 'border-border-muted text-text-muted hover:text-text-secondary'
            }`}
          >
            {z}x
          </button>
        ))}
      </div>

      <div
        className="space-y-4 overflow-x-auto"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', minWidth: `${100 * zoom}%` }}
      >
        {/* Week ruler */}
        <div className="flex items-center gap-0" style={{ minWidth: '600px' }}>
          <div className="w-40 shrink-0" />
          <div className="flex-1 flex">
            {Array.from({ length: 26 }, (_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-text-muted font-mono border-l border-border-muted py-1"
                style={{ minWidth: 0, display: (i + 1) % 4 === 0 || i === 0 ? 'block' : 'none' }}
              >
                {i === 0 ? 'W1' : `W${i + 1}`}
              </div>
            ))}
          </div>
        </div>

        {LEARNING_PHASES.map((phase) => {
          const [startW, endW] = phase.weeks.split('\u2013').map(Number);
          const startPct = ((startW - 1) / 26) * 100;
          const widthPct = ((endW - startW + 1) / 26) * 100;

          return (
            <GanttBar
              key={phase.phase}
              phase={phase}
              startPct={startPct}
              widthPct={widthPct}
            />
          );
        })}
      </div>
    </div>
  );
}
