import Link from 'next/link';
import { MARKET_GROWTH, COMPANIES, RESEARCH_PAPERS } from '@/lib/viz-data';
import { getAllArticles } from '@/lib/content';

const views = [
  { href: '/graph', icon: '◎', label: 'Knowledge Graph', desc: 'Interactive force-directed map of all wiki articles and cross-links', color: '#39d353' },
  { href: '/market', icon: '▲', label: 'Market Intelligence', desc: 'EM-SCA and SIGINT market growth, segments, and geographic breakdown', color: '#58a6ff' },
  { href: '/companies', icon: '◈', label: 'Company Explorer', desc: 'All organizations by tier — defense contractors, EM-SCA vendors, space SIGINT', color: '#bc8cff' },
  { href: '/equipment', icon: '⊡', label: 'Equipment Compare', desc: 'SDR hardware specs, price vs. capability scatter, upgrade path visualization', color: '#f0883e' },
  { href: '/research', icon: '◷', label: 'Research Timeline', desc: 'Published attacks 2021–2026 by venue, target, and trace count', color: '#e3b341' },
  { href: '/learning', icon: '⊕', label: 'Learning Path', desc: '26-week Coursera curriculum — Gantt chart with phase breakdown', color: '#ff7b72' },
];

const latestPapers = RESEARCH_PAPERS.filter(p => p.year >= 2026).slice(0, 4);
const articles = getAllArticles();
const articleCount = articles.length;
const marketEntry = MARKET_GROWTH.find(m => m.year === '2026') ?? MARKET_GROWTH[MARKET_GROWTH.length - 1];
const emScaRevenue = marketEntry.emSca;
const sigintRevenue = marketEntry.sigint;

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="pt-2">
        <div className="font-mono text-xs text-accent-green mb-3 tracking-widest">
          &gt; SIGINT_WIKI / VISUALIZER / v2.0 / INITIALIZED
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          SIGINT & EM-SCA<br />
          <span className="text-accent-cyan">Intelligence Visualizer</span>
        </h1>
        <p className="text-text-secondary text-base max-w-2xl leading-relaxed">
          Interactive knowledge base covering electromagnetic side-channel analysis,
          signals intelligence, and hardware security research. {articleCount} articles · 60+ organizations · 18 attack papers · Current through April 2026.
        </p>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Wiki Articles', value: String(articleCount), sub: 'cross-linked', color: 'text-accent-green' },
          { label: 'EM-SCA Market', value: `$${emScaRevenue}M`, sub: '2026 est.', color: 'text-accent-cyan' },
          { label: 'SIGINT Market', value: `$${(sigintRevenue / 1000).toFixed(0)}B`, sub: 'private sector', color: 'text-accent-purple' },
          { label: 'Research Papers', value: `${RESEARCH_PAPERS.length}`, sub: '2021–2026', color: 'text-accent-orange' },
        ].map(s => (
          <div key={s.label} className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-text-primary text-sm font-medium mt-0.5">{s.label}</div>
            <div className="text-text-muted text-xs">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Visualization views */}
      <div>
        <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">/ Visualizations</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {views.map(v => (
            <Link
              key={v.href}
              href={v.href}
              className="group bg-bg-secondary border border-border-default rounded-lg p-5 hover:bg-bg-hover transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-mono" style={{ color: v.color }}>{v.icon}</span>
                <span className="font-semibold text-text-primary group-hover:text-white transition-colors" style={{ color: v.color }}>
                  {v.label}
                </span>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">{v.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest research */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest">/ Latest Research (2026)</h2>
          <Link href="/research" className="text-xs text-accent-cyan font-mono hover:underline">View timeline →</Link>
        </div>
        <div className="space-y-2">
          {latestPapers.map((p, i) => (
            <div key={i} className="flex items-start gap-4 bg-bg-secondary border border-border-default rounded-lg px-4 py-3">
              <span className="font-mono text-xs text-accent-orange border border-border-muted rounded px-1.5 py-0.5 shrink-0 mt-0.5">{p.venue}</span>
              <div className="flex-1 min-w-0">
                <span className="text-text-primary text-sm">{p.title}</span>
                <span className="text-text-muted text-xs ml-2">· {p.target}</span>
              </div>
              <span className="text-text-muted text-xs font-mono shrink-0">
                {p.traces === 1 ? '1 trace' : `${p.traces.toLocaleString()} traces`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Market snapshot */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest">/ Market Snapshot</h2>
          <Link href="/market" className="text-xs text-accent-cyan font-mono hover:underline">Full analysis →</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-5">
            <div className="text-xs font-mono text-text-muted mb-2">EM-SCA MARKET CAGR</div>
            <div className="text-3xl font-bold text-accent-green font-mono mb-1">12–18%</div>
            <div className="text-text-secondary text-sm">$380M (2026) → $870M (2035)</div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {['UN R155', 'NIST PQC', 'CHIPS Act', 'ETSI EN 303 645'].map(d => (
                <span key={d} className="text-xs text-text-muted border border-border-muted rounded px-1.5 py-0.5">{d}</span>
              ))}
            </div>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-5">
            <div className="text-xs font-mono text-text-muted mb-2">PRIVATE SIGINT MARKET</div>
            <div className="text-3xl font-bold text-accent-cyan font-mono mb-1">$8–12B</div>
            <div className="text-text-secondary text-sm">4 Tier-1 contractors · 6 specialists · Space-based growth</div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {['Lockheed', 'Northrop', 'RTX', 'BAE', 'L3Harris'].map(c => (
                <span key={c} className="text-xs text-text-muted border border-border-muted rounded px-1.5 py-0.5">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wiki articles quick access */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest">/ Wiki Articles</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: '/em-sca/electromagnetic-side-channel-analysis', label: 'EM-SCA Theory', tag: 'Foundation' },
            { href: '/em-sca/em-sca-2026-developments', label: '2026 Developments', tag: 'New' },
            { href: '/em-sca/pqc-implementation-security-2026', label: 'PQC Attack Analysis', tag: 'New' },
            { href: '/sigint/rf-fingerprinting-device-identification', label: 'RF Fingerprinting', tag: 'New' },
            { href: '/sigint/sigint-machine-learning-pipeline', label: 'ML Pipeline', tag: 'New' },
            { href: '/em-sca/organizations', label: 'Organizations', tag: 'Directory' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center justify-between bg-bg-secondary border border-border-default rounded px-3 py-2.5 hover:bg-bg-hover transition-all group text-sm">
              <span className="text-text-secondary group-hover:text-text-primary transition-colors">{l.label}</span>
              <span className="text-xs font-mono text-text-muted border border-border-muted rounded px-1.5 py-0.5">{l.tag}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
