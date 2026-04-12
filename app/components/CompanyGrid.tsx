'use client';

import { useState } from 'react';

interface Company {
  name: string;
  tier: number;
  sector: string;
  revenue: number;
  hq: string;
  focus: string;
}

const SECTOR_COLORS: Record<string, string> = {
  'sigint': '#58a6ff',
  'em-sca': '#39d353',
  'space-sigint': '#bc8cff',
};

const SECTOR_LABELS: Record<string, string> = {
  'sigint': 'SIGINT Defense',
  'em-sca': 'EM-SCA',
  'space-sigint': 'Space SIGINT',
};

function formatRevenue(r: number) {
  if (r >= 1000) return `$${(r / 1000).toFixed(1)}B`;
  return `$${r}M`;
}

export default function CompanyGrid({ companies }: { companies: Company[] }) {
  const [sector, setSector] = useState('all');
  const [tier, setTier] = useState('all');
  const [sort, setSort] = useState<'revenue' | 'name'>('revenue');

  const filtered = companies
    .filter(c => sector === 'all' || c.sector === sector)
    .filter(c => tier === 'all' || c.tier === Number(tier))
    .sort((a, b) => sort === 'revenue' ? b.revenue - a.revenue : a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">Sector:</span>
          {['all', 'sigint', 'em-sca', 'space-sigint'].map(s => (
            <button key={s} onClick={() => setSector(s)}
              className="text-xs px-2.5 py-1 rounded border font-mono transition-colors"
              style={{
                borderColor: sector === s ? (SECTOR_COLORS[s] ?? '#e6edf3') : '#30363d',
                color: sector === s ? (SECTOR_COLORS[s] ?? '#e6edf3') : '#6e7681',
                background: sector === s ? `${SECTOR_COLORS[s] ?? '#e6edf3'}11` : 'transparent',
              }}>
              {s === 'all' ? 'All' : SECTOR_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">Tier:</span>
          {['all', '1', '2', '3'].map(t => (
            <button key={t} onClick={() => setTier(t)}
              className="text-xs px-2.5 py-1 rounded border font-mono transition-colors"
              style={{
                borderColor: tier === t ? '#e6edf3' : '#30363d',
                color: tier === t ? '#e6edf3' : '#6e7681',
                background: tier === t ? '#e6edf311' : 'transparent',
              }}>
              {t === 'all' ? 'All' : `Tier ${t}`}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">Sort:</span>
          {(['revenue', 'name'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className="text-xs px-2.5 py-1 rounded border font-mono transition-colors"
              style={{
                borderColor: sort === s ? '#e6edf3' : '#30363d',
                color: sort === s ? '#e6edf3' : '#6e7681',
                background: sort === s ? '#e6edf311' : 'transparent',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-text-muted font-mono">{filtered.length} organizations</div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <div key={c.name} className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-text-primary text-sm leading-tight">{c.name}</div>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded border shrink-0"
                style={{ borderColor: SECTOR_COLORS[c.sector], color: SECTOR_COLORS[c.sector] }}>
                T{c.tier}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">{c.hq}</span>
              <span className="font-mono font-bold" style={{ color: SECTOR_COLORS[c.sector] }}>
                {formatRevenue(c.revenue)}
              </span>
            </div>

            <div className="text-xs text-text-secondary leading-relaxed">{c.focus}</div>

            <div className="pt-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: `${SECTOR_COLORS[c.sector]}15`, color: SECTOR_COLORS[c.sector] }}>
                {SECTOR_LABELS[c.sector]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
