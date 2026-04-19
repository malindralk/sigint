'use client';

import { useState } from 'react';
import { BRAND, CHART_COLORS } from '@/lib/brand-colors';

interface Company { name: string; tier: number; sector: string; revenue: number; hq: string; focus: string; }

const SECTOR_COLORS: Record<string, string> = { 'sigint': BRAND.info, 'em-sca': BRAND.primary, 'space-sigint': BRAND.accent };
const SECTOR_LABELS: Record<string, string> = { 'sigint': 'SIGINT Defense', 'em-sca': 'EM-SCA', 'space-sigint': 'Space SIGINT' };

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
    <div className="space-y-3">
      {/* Filters — stacks vertically on mobile, wraps on tablet+ */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)' }}>Sector:</span>
          {['all', 'sigint', 'em-sca', 'space-sigint'].map(s => (
            <button key={s} onClick={() => setSector(s)}
              className="text-xs px-2.5 py-1 rounded border font-mono transition-colors"
              style={{
                borderColor: sector === s ? (SECTOR_COLORS[s] ?? 'var(--theme-text-primary)') : 'var(--theme-border-strong)',
                color: sector === s ? (SECTOR_COLORS[s] ?? 'var(--theme-text-primary)') : 'var(--theme-text-muted)',
                background: sector === s ? `${SECTOR_COLORS[s] ?? 'var(--theme-text-primary)'}11` : 'transparent',
                fontFamily: 'var(--font-ui)',
              }}>
              {s === 'all' ? 'All' : SECTOR_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)' }}>Tier:</span>
          {['all', '1', '2', '3'].map(t => (
            <button key={t} onClick={() => setTier(t)}
              className="text-xs px-2.5 py-1 rounded border font-mono transition-colors"
              style={{
                borderColor: tier === t ? 'var(--theme-text-primary)' : 'var(--theme-border-strong)',
                color: tier === t ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
                background: tier === t ? 'var(--theme-hover-bg)' : 'transparent',
                fontFamily: 'var(--font-ui)',
              }}>
              {t === 'all' ? 'All' : `Tier ${t}`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)' }}>Sort:</span>
          {(['revenue', 'name'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className="text-xs px-2.5 py-1 rounded border font-mono transition-colors"
              style={{
                borderColor: sort === s ? 'var(--theme-text-primary)' : 'var(--theme-border-strong)',
                color: sort === s ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
                background: sort === s ? 'var(--theme-hover-bg)' : 'transparent',
                fontFamily: 'var(--font-ui)',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)' }}>{filtered.length} organizations</div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <div key={c.name} className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="flex items-start justify-between gap-2" style={{ marginBottom: 'var(--space-sm)' }}>
              <div className="t-card-heading" style={{ fontSize: '14px', lineHeight: 1.3 }}>{c.name}</div>
              <span className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: SECTOR_COLORS[c.sector], color: SECTOR_COLORS[c.sector], fontFamily: 'var(--font-ui)' }}>
                T{c.tier}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs" style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="t-muted">{c.hq}</span>
              <span className="font-mono font-bold" style={{ color: SECTOR_COLORS[c.sector], fontFamily: 'var(--font-ui)' }}>
                {formatRevenue(c.revenue)}
              </span>
            </div>
            <div className="t-muted" style={{ fontSize: '12px', lineHeight: 1.5, marginBottom: 'var(--space-sm)' }}>{c.focus}</div>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${SECTOR_COLORS[c.sector]}15`, color: SECTOR_COLORS[c.sector], fontFamily: 'var(--font-ui)' }}>
              {SECTOR_LABELS[c.sector]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
