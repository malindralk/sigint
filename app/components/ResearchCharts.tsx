'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Paper { year: number; venue: string; title: string; attack: string; target: string; traces: number }

const VENUE_COLORS: Record<string, string> = {
  'IEEE S&P': '#39d353', 'CCS': '#58a6ff', 'USENIX': '#bc8cff',
  'CHES': '#f0883e', 'TCHES': '#e3b341', 'IEEE': '#adbac7',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1117', border: '1px solid #30363d',
  borderRadius: '6px', color: '#e6edf3', fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

export default function ResearchCharts({ papers }: { papers: Paper[] }) {
  // Papers by year
  const byYear = Object.entries(
    papers.reduce((acc, p) => { acc[p.year] = (acc[p.year] ?? 0) + 1; return acc; }, {} as Record<number, number>)
  ).map(([year, count]) => ({ year, count })).sort((a, b) => Number(a.year) - Number(b.year));

  // Papers by venue
  const byVenue = Object.entries(
    papers.reduce((acc, p) => { acc[p.venue] = (acc[p.venue] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([venue, count]) => ({ venue, count })).sort((a, b) => b.count - a.count);

  // Min traces by year (best attack efficiency)
  const minTraceByYear = Object.entries(
    papers.reduce((acc, p) => {
      const cur = acc[p.year];
      if (cur === undefined || p.traces < cur) acc[p.year] = p.traces;
      return acc;
    }, {} as Record<number, number>)
  ).map(([year, traces]) => ({ year, traces })).sort((a, b) => Number(a.year) - Number(b.year));

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="text-xs font-mono text-text-muted uppercase tracking-wide mb-4">Papers per Year</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="year" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={{ stroke: '#30363d' }} />
            <YAxis tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={{ stroke: '#30363d' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#39d353" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="text-xs font-mono text-text-muted uppercase tracking-wide mb-4">Papers by Venue</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byVenue} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={{ stroke: '#30363d' }} />
            <YAxis type="category" dataKey="venue" width={70} tick={{ fill: '#adbac7', fontSize: 10 }} axisLine={{ stroke: '#30363d' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {byVenue.map((entry, i) => (
                <Cell key={i} fill={VENUE_COLORS[entry.venue] ?? '#58a6ff'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="text-xs font-mono text-text-muted uppercase tracking-wide mb-4">Best Attack Efficiency</div>
        <div className="text-xs text-text-muted mb-3">Min traces required per year</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={minTraceByYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="year" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={{ stroke: '#30363d' }} />
            <YAxis tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={{ stroke: '#30363d' }}
              scale="log" domain={[1, 'auto']} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : String(v)} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v.toLocaleString()} traces`, 'Best']} />
            <Bar dataKey="traces" radius={[3, 3, 0, 0]}>
              {minTraceByYear.map((entry, i) => (
                <Cell key={i} fill={entry.traces <= 10 ? '#f85149' : entry.traces <= 1000 ? '#f0883e' : '#58a6ff'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="text-xs text-red-400 font-mono">■ ≤10 traces</span>
          <span className="text-xs text-accent-orange font-mono">■ ≤1k</span>
          <span className="text-xs text-accent-cyan font-mono">■ &gt;1k</span>
        </div>
      </div>
    </div>
  );
}
