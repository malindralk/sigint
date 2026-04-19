'use client';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MARKET_GROWTH, EMSCA_SEGMENTS, EMSCA_GEOGRAPHY } from '@/lib/viz-data';
import { BRAND, CHART_COLORS } from '@/lib/brand-colors';

const TT: React.CSSProperties = {
  backgroundColor: 'var(--theme-bg-surface)',
  border: '1px solid var(--theme-border)',
  borderRadius: '6px',
  color: 'var(--theme-text-primary)',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

export function MarketGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={MARKET_GROWTH} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="emScaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sigintGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BRAND.info} stopOpacity={0.3} />
            <stop offset="95%" stopColor={BRAND.info} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
        <XAxis dataKey="year" tick={{ fill: BRAND.textMuted, fontSize: 11 }} axisLine={{ stroke: BRAND.borderSolid }} />
        <YAxis yAxisId="left" tick={{ fill: BRAND.textMuted, fontSize: 11 }} axisLine={{ stroke: BRAND.borderSolid }} tickFormatter={v => `$${v}M`} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: BRAND.textMuted, fontSize: 11 }} axisLine={{ stroke: BRAND.borderSolid }} tickFormatter={v => `$${(v / 1000).toFixed(0)}B`} />
        <Tooltip contentStyle={TT} formatter={(v: number, name: string) =>
          name === 'emSca' ? [`$${v}M`, 'EM-SCA'] : [`$${(v / 1000).toFixed(1)}B`, 'SIGINT']} />
        <Legend formatter={(v) => v === 'emSca' ? 'EM-SCA Market' : 'Private SIGINT Market'} wrapperStyle={{ color: BRAND.textMuted, fontSize: 12 }} />
        <Area yAxisId="left" type="monotone" dataKey="emSca" stroke={BRAND.primary} strokeWidth={2} fill="url(#emScaGrad)" dot={{ fill: BRAND.primary, r: 3 }} />
        <Area yAxisId="right" type="monotone" dataKey="sigint" stroke={BRAND.info} strokeWidth={2} fill="url(#sigintGrad)" dot={{ fill: BRAND.info, r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SegmentPieChart({ data, title }: { data: typeof EMSCA_SEGMENTS; title: string }) {
  return (
    <div>
      <div className="t-label" style={{ marginBottom: 'var(--space-sm)' }}>{title}</div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`, '']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-1">
        {data.map(d => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs t-muted" style={{ fontFamily: 'var(--font-ui)' }}>
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
  const colors: Record<string, string> = { sigint: BRAND.info, 'em-sca': BRAND.primary, 'space-sigint': BRAND.accent };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 40, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} horizontal={false} />
        <XAxis type="number" tick={{ fill: BRAND.textMuted, fontSize: 10 }} axisLine={{ stroke: BRAND.borderSolid }} tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}B` : `$${v}M`} />
        <YAxis type="category" dataKey="name" width={80} tick={{ fill: BRAND.textSecondary, fontSize: 10 }} axisLine={{ stroke: BRAND.borderSolid }} />
        <Tooltip contentStyle={TT} formatter={(v: number) => [v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`, 'Revenue']} />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, i) => (
            <Cell key={i} fill={colors[entry.sector] ?? BRAND.info} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
