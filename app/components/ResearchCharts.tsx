'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const VENUE_COLORS: Record<string, string> = {
  'IEEE S&P': '#7A1E2E', 'CCS': '#2C5F8A', 'USENIX': '#C4881E',
  'CHES': '#A8293C', 'TCHES': '#1E6B52', 'IEEE': '#6B6254',
};

const TT = {
  backgroundColor: '#131217', border: '1px solid #4A4B5459',
  borderRadius: '6px', color: '#EDE0C4', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace',
};

export default function ResearchCharts({ papers }: { papers: { year: number; venue: string; traces: number }[] }) {
  const byYear = Object.entries(
    papers.reduce((acc, p) => { acc[p.year] = (acc[p.year] ?? 0) + 1; return acc; }, {} as Record<number, number>)
  ).map(([year, count]) => ({ year, count })).sort((a, b) => Number(a.year) - Number(b.year));

  const byVenue = Object.entries(
    papers.reduce((acc, p) => { acc[p.venue] = (acc[p.venue] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([venue, count]) => ({ venue, count })).sort((a, b) => b.count - a.count);

  const minTraceByYear = Object.entries(
    papers.reduce((acc, p) => {
      const cur = acc[p.year];
      if (cur === undefined || p.traces < cur) acc[p.year] = p.traces;
      return acc;
    }, {} as Record<number, number>)
  ).map(([year, traces]) => ({ year, traces })).sort((a, b) => Number(a.year) - Number(b.year));

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>Papers per Year</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A4B5459" />
            <XAxis dataKey="year" tick={{ fill: '#6B6254', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }} />
            <YAxis tick={{ fill: '#6B6254', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }} />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="count" fill="#7A1E2E" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>Papers by Venue</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byVenue} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#4A4B5459" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6B6254', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }} />
            <YAxis type="category" dataKey="venue" width={70} tick={{ fill: '#B8A98E', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }} />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {byVenue.map((entry, i) => (
                <Cell key={i} fill={VENUE_COLORS[entry.venue] ?? '#2C5F8A'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>Best Attack Efficiency</div>
        <div className="t-muted" style={{ fontSize: '11px', marginBottom: 'var(--space-sm)' }}>Min traces required per year</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={minTraceByYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A4B5459" />
            <XAxis dataKey="year" tick={{ fill: '#6B6254', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }} />
            <YAxis tick={{ fill: '#6B6254', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }} scale="log" domain={[1, 'auto']} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : String(v)} />
            <Tooltip contentStyle={TT} formatter={(v: number) => [`${v.toLocaleString()} traces`, 'Best']} />
            <Bar dataKey="traces" radius={[3, 3, 0, 0]}>
              {minTraceByYear.map((entry, i) => (
                <Cell key={i} fill={entry.traces <= 10 ? '#A8293C' : entry.traces <= 1000 ? '#C4881E' : '#2C5F8A'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="text-xs font-mono" style={{ color: '#A8293C' }}>■ ≤10 traces</span>
          <span className="text-xs font-mono" style={{ color: '#C4881E' }}>■ ≤1k</span>
          <span className="text-xs font-mono" style={{ color: '#2C5F8A' }}>■ &gt;1k</span>
        </div>
      </div>
    </div>
  );
}
