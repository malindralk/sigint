import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { RESEARCH_PAPERS, ATTACK_TAXONOMY } from '@/lib/viz-data';

const ResearchCharts = dynamic(() => import('@/app/components/ResearchCharts'));

export const metadata: Metadata = { title: 'Research Timeline' };

const VENUE_COLORS: Record<string, string> = {
  'IEEE S&P': 'var(--brand-primary)',
  'CCS': 'var(--info)',
  'USENIX': 'var(--brand-accent)',
  'CHES': 'var(--danger)',
  'TCHES': 'var(--success)',
  'IEEE': 'var(--text-muted)',
};

export default function ResearchPage() {
  const byYear = RESEARCH_PAPERS.reduce((acc, p) => {
    acc[p.year] = (acc[p.year] ?? []).concat(p);
    return acc;
  }, {} as Record<number, typeof RESEARCH_PAPERS>);

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div>
        <div className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', marginBottom: 'var(--space-xs)' }}>&gt; research_timeline / {RESEARCH_PAPERS.length} papers / 2021–2026</div>
        <h1 className="t-heading" style={{ color: 'var(--brand-accent)' }}>Research Timeline</h1>
        <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>
          Published EM-SCA and PQC side-channel attacks — sorted by year, venue, and traces required.
        </p>
      </div>

      {/* Venue legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(VENUE_COLORS).map(([v, c]) => (
          <span key={v} className="flex items-center gap-1.5 text-xs t-muted" style={{ fontFamily: 'var(--font-ui)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: c }} />{v}
          </span>
        ))}
      </div>

      {/* Charts */}
      <ResearchCharts papers={RESEARCH_PAPERS} />

      {/* Attack taxonomy */}
      <section>
        <div className="t-eyebrow">/ Attack Taxonomy</div>
        <div className="grid gap-3 sm:grid-cols-3" style={{ marginTop: 'var(--space-sm)' }}>
          {ATTACK_TAXONOMY.map(cat => (
            <div key={cat.name} className="card" style={{ padding: 'var(--space-md)' }}>
              <div className="t-card-heading" style={{ fontSize: '13px', color: cat.color, marginBottom: 'var(--space-sm)' }}>{cat.name}</div>
              <ul className="space-y-2">
                {cat.children.map(a => (
                  <li key={a.name}>
                    <div className="t-body" style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>{a.name}</div>
                    <div className="t-muted" style={{ fontSize: '11px', lineHeight: 1.4 }}>{a.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline list */}
      <section className="space-y-6">
        <div className="t-eyebrow">/ Paper Timeline</div>
        {years.map(year => (
          <div key={year}>
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="t-heading" style={{ fontSize: '16px' }}>{year}</span>
              <span className="t-muted" style={{ fontSize: '11px' }}>({byYear[year].length} papers)</span>
              <div className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="space-y-2">
              {byYear[year].map((p, i) => (
                <div key={i} className="card" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                  <div className="flex flex-wrap items-start gap-2" style={{ marginBottom: 'var(--space-xs)' }}>
                    <span className="text-xs px-2 py-0.5 rounded border shrink-0"
                      style={{ borderColor: VENUE_COLORS[p.venue] ?? 'var(--border)', color: VENUE_COLORS[p.venue] ?? 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                      {p.venue}
                    </span>
                    <span className="text-right shrink-0 sm:hidden t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)', color: p.traces === 1 ? 'var(--danger)' : p.traces < 1000 ? 'var(--brand-accent)' : 'var(--text-muted)', marginLeft: 'auto' }}>
                      {p.traces === 1 ? '1 trace' : `${p.traces.toLocaleString()} traces`}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="t-body" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{p.title}</div>
                      <div className="t-muted" style={{ fontSize: '11px', marginTop: 'var(--space-xs)' }}>
                        {p.attack} · <span style={{ color: 'var(--info)' }}>{p.target}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)', color: p.traces === 1 ? 'var(--danger)' : p.traces < 1000 ? 'var(--brand-accent)' : 'var(--text-muted)' }}>
                        {p.traces === 1 ? '1 trace' : `${p.traces.toLocaleString()}`}
                      </div>
                      <div className="t-muted" style={{ fontSize: '10px' }}>traces</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
