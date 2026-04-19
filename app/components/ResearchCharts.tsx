'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BRAND } from '@/lib/brand-colors';

const VENUE_COLORS: Record<string, string> = {
  'IEEE S&P': BRAND.primary,
  CCS: BRAND.info,
  USENIX: BRAND.accent,
  CHES: BRAND.danger,
  TCHES: BRAND.success,
  IEEE: BRAND.textMuted,
};

const TT: React.CSSProperties = {
  backgroundColor: 'var(--theme-bg-surface)',
  border: '1px solid var(--theme-border)',
  borderRadius: '6px',
  color: 'var(--theme-text-primary)',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

export default function ResearchCharts({ papers }: { papers: { year: number; venue: string; traces: number }[] }) {
  const byYear = Object.entries(
    papers.reduce(
      (acc, p) => {
        acc[p.year] = (acc[p.year] ?? 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    ),
  )
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  const byVenue = Object.entries(
    papers.reduce(
      (acc, p) => {
        acc[p.venue] = (acc[p.venue] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .map(([venue, count]) => ({ venue, count }))
    .sort((a, b) => b.count - a.count);

  const minTraceByYear = Object.entries(
    papers.reduce(
      (acc, p) => {
        const cur = acc[p.year];
        if (cur === undefined || p.traces < cur) acc[p.year] = p.traces;
        return acc;
      },
      {} as Record<number, number>,
    ),
  )
    .map(([year, traces]) => ({ year, traces }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>
          Papers per Year
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byYear}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
            <XAxis
              dataKey="year"
              tick={{ fill: BRAND.textMuted, fontSize: 10 }}
              axisLine={{ stroke: BRAND.borderSolid }}
            />
            <YAxis tick={{ fill: BRAND.textMuted, fontSize: 10 }} axisLine={{ stroke: BRAND.borderSolid }} />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="count" fill={BRAND.primary} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>
          Papers by Venue
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byVenue} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: BRAND.textMuted, fontSize: 10 }}
              axisLine={{ stroke: BRAND.borderSolid }}
            />
            <YAxis
              type="category"
              dataKey="venue"
              width={70}
              tick={{ fill: BRAND.textSecondary, fontSize: 10 }}
              axisLine={{ stroke: BRAND.borderSolid }}
            />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {byVenue.map((entry) => (
                <Cell key={entry.venue} fill={VENUE_COLORS[entry.venue] ?? BRAND.info} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>
          Best Attack Efficiency
        </div>
        <div className="t-muted" style={{ fontSize: '11px', marginBottom: 'var(--space-sm)' }}>
          Min traces required per year
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={minTraceByYear}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
            <XAxis
              dataKey="year"
              tick={{ fill: BRAND.textMuted, fontSize: 10 }}
              axisLine={{ stroke: BRAND.borderSolid }}
            />
            <YAxis
              tick={{ fill: BRAND.textMuted, fontSize: 10 }}
              axisLine={{ stroke: BRAND.borderSolid }}
              scale="log"
              domain={[1, 'auto']}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
            />
            <Tooltip contentStyle={TT} formatter={(v: number) => [`${v.toLocaleString()} traces`, 'Best']} />
            <Bar dataKey="traces" radius={[3, 3, 0, 0]}>
              {minTraceByYear.map((entry) => (
                <Cell
                  key={entry.year}
                  fill={entry.traces <= 10 ? BRAND.danger : entry.traces <= 1000 ? BRAND.accent : BRAND.info}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="text-xs font-mono" style={{ color: BRAND.danger }}>
            ■ ≤10 traces
          </span>
          <span className="text-xs font-mono" style={{ color: BRAND.accent }}>
            ■ ≤1k
          </span>
          <span className="text-xs font-mono" style={{ color: BRAND.info }}>
            ■ &gt;1k
          </span>
        </div>
      </div>
    </div>
  );
}
