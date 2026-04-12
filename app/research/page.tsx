import type { Metadata } from 'next';
import { RESEARCH_PAPERS, ATTACK_TAXONOMY } from '@/lib/viz-data';
import ResearchCharts from '@/app/components/ResearchCharts';

export const metadata: Metadata = { title: 'Research Timeline' };

const VENUE_COLORS: Record<string, string> = {
  'IEEE S&P': '#39d353',
  'CCS': '#58a6ff',
  'USENIX': '#bc8cff',
  'CHES': '#f0883e',
  'TCHES': '#e3b341',
  'IEEE': '#adbac7',
};

export default function ResearchPage() {
  const byYear = RESEARCH_PAPERS.reduce((acc, p) => {
    acc[p.year] = (acc[p.year] ?? []).concat(p);
    return acc;
  }, {} as Record<number, typeof RESEARCH_PAPERS>);

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">&gt; research_timeline / {RESEARCH_PAPERS.length} papers / 2021–2026</div>
        <h1 className="text-2xl font-bold text-accent-yellow">Research Timeline</h1>
        <p className="text-text-secondary text-sm mt-1">
          Published EM-SCA and PQC side-channel attacks — sorted by year, venue, and traces required.
        </p>
      </div>

      {/* Venue legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(VENUE_COLORS).map(([v, c]) => (
          <span key={v} className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
            <span className="w-2 h-2 rounded-full" style={{ background: c }} />{v}
          </span>
        ))}
      </div>

      {/* Charts */}
      <ResearchCharts papers={RESEARCH_PAPERS} />

      {/* Attack taxonomy */}
      <section>
        <div className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">/ Attack Taxonomy</div>
        <div className="grid gap-4 sm:grid-cols-3">
          {ATTACK_TAXONOMY.map(cat => (
            <div key={cat.name} className="bg-bg-secondary border border-border-default rounded-lg p-4">
              <div className="font-semibold text-sm mb-3 font-mono" style={{ color: cat.color }}>{cat.name}</div>
              <ul className="space-y-2">
                {cat.children.map(a => (
                  <li key={a.name}>
                    <div className="text-xs font-mono text-text-primary">{a.name}</div>
                    <div className="text-xs text-text-muted leading-relaxed">{a.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline list */}
      <section className="space-y-6">
        <div className="text-xs font-mono text-text-muted uppercase tracking-widest">/ Paper Timeline</div>
        {years.map(year => (
          <div key={year}>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono font-bold text-text-primary">{year}</span>
              <span className="text-xs text-text-muted">({byYear[year].length} papers)</span>
              <div className="flex-1 border-t border-border-muted" />
            </div>
            <div className="space-y-2">
              {byYear[year].map((p, i) => (
                <div key={i} className="flex items-start gap-3 bg-bg-secondary border border-border-default rounded-lg px-4 py-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded border shrink-0 mt-0.5"
                    style={{ borderColor: VENUE_COLORS[p.venue] ?? '#30363d', color: VENUE_COLORS[p.venue] ?? '#adbac7' }}>
                    {p.venue}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary text-sm font-medium">{p.title}</div>
                    <div className="text-text-muted text-xs mt-0.5">
                      {p.attack} · <span className="text-accent-cyan">{p.target}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs" style={{ color: p.traces === 1 ? '#f85149' : p.traces < 1000 ? '#f0883e' : '#8b949e' }}>
                      {p.traces === 1 ? '1 trace' : `${p.traces.toLocaleString()}`}
                    </div>
                    <div className="text-text-muted text-xs">traces</div>
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
