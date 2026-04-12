'use client';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MARKET_GROWTH, EMSCA_SEGMENTS, EMSCA_GEOGRAPHY } from '@/lib/viz-data';

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#e6edf3',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

export function MarketGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={MARKET_GROWTH} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="emScaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#39d353" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#39d353" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sigintGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
        <XAxis dataKey="year" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={{ stroke: '#30363d' }} />
        <YAxis yAxisId="left" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={{ stroke: '#30363d' }}
          tickFormatter={v => `$${v}M`} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={{ stroke: '#30363d' }}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}B`} />
        <Tooltip contentStyle={TOOLTIP_STYLE}
          formatter={(v: number, name: string) =>
            name === 'emSca' ? [`$${v}M`, 'EM-SCA'] : [`$${(v / 1000).toFixed(1)}B`, 'SIGINT']} />
        <Legend formatter={(v) => v === 'emSca' ? 'EM-SCA Market' : 'Private SIGINT Market'}
          wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
        <Area yAxisId="left" type="monotone" dataKey="emSca" stroke="#39d353" strokeWidth={2}
          fill="url(#emScaGrad)" dot={{ fill: '#39d353', r: 3 }} />
        <Area yAxisId="right" type="monotone" dataKey="sigint" stroke="#58a6ff" strokeWidth={2}
          fill="url(#sigintGrad)" dot={{ fill: '#58a6ff', r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SegmentPieChart({ data, title }: { data: typeof EMSCA_SEGMENTS; title: string }) {
  return (
    <div>
      <div className="text-xs font-mono text-text-muted mb-3 uppercase tracking-wide">{title}</div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
            dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, '']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-1">
        {data.map(d => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            {d.name} <span className="font-mono" style={{ color: d.color }}>{d.value}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function CompanyRevenueChart({ companies }: { companies: { name: string; revenue: number; sector: string }[] }) {
  const sorted = [...companies].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const colors: Record<string, string> = { sigint: '#58a6ff', 'em-sca': '#39d353', 'space-sigint': '#bc8cff' };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 40, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={{ stroke: '#30363d' }}
          tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}B` : `$${v}M`} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#adbac7', fontSize: 11 }}
          axisLine={{ stroke: '#30363d' }} />
        <Tooltip contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`, 'Revenue']} />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, i) => (
            <Cell key={i} fill={colors[entry.sector] ?? '#58a6ff'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
