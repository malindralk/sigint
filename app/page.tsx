import Link from 'next/link';
import { MARKET_GROWTH, COMPANIES, RESEARCH_PAPERS } from '@/lib/viz-data';
import { getAllArticles } from '@/lib/content';

const views = [
  { href: '/graph', label: 'Knowledge Graph', desc: 'Force-directed map of all wiki articles and cross-links' },
  { href: '/market', label: 'Market Intel', desc: 'EM-SCA and SIGINT market growth, segments, geography' },
  { href: '/companies', label: 'Company Explorer', desc: 'All organizations by tier — defense, EM-SCA, space' },
  { href: '/equipment', label: 'Equipment Compare', desc: 'SDR hardware specs, price vs. bandwidth scatter' },
  { href: '/research', label: 'Research Timeline', desc: 'Published attacks 2021–2026 by venue, target, traces' },
  { href: '/learning', label: 'Learning Path', desc: '26-week Coursera curriculum with Gantt chart' },
];

const latestPapers = RESEARCH_PAPERS.filter(p => p.year >= 2026).slice(0, 4);
const articles = getAllArticles();
const articleCount = articles.length;
const marketEntry = MARKET_GROWTH.find(m => m.year === '2026') ?? MARKET_GROWTH[MARKET_GROWTH.length - 1];
const emScaRevenue = marketEntry.emSca;
const sigintRevenue = marketEntry.sigint;

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {/* Hero */}
      <div>
        <div className="t-eyebrow">&gt; SIGINT_WIKI / VISUALIZER / v2.0</div>
        <h1 className="t-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 'var(--space-sm)' }}>
          SIGINT & EM-SCA<br />
          <span style={{ color: 'var(--brand-accent)' }}>Intelligence Visualizer</span>
        </h1>
        <p className="t-body" style={{ maxWidth: '640px', marginTop: 'var(--space-sm)' }}>
          Interactive knowledge base covering electromagnetic side-channel analysis,
          signals intelligence, and hardware security research. {articleCount} articles · 60+ organizations · 18 attack papers · Current through April 2026.
        </p>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Wiki Articles', value: String(articleCount), sub: 'cross-linked' },
          { label: 'EM-SCA Market', value: `$${emScaRevenue}M`, sub: '2026 est.' },
          { label: 'SIGINT Market', value: `$${(sigintRevenue / 1000).toFixed(0)}B`, sub: 'private sector' },
          { label: 'Research Papers', value: `${RESEARCH_PAPERS.length}`, sub: '2021–2026' },
        ].map((s, i) => (
          <div key={s.label} className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="t-stat" style={{ color: [
              'var(--brand-primary)', 'var(--info)', 'var(--brand-accent)', 'var(--danger)'
            ][i] }}>{s.value}</div>
            <div className="t-label" style={{ marginBottom: 0 }}>{s.label}</div>
            <div className="card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Visualization views */}
      <div>
        <div className="t-eyebrow">/ Visualizations</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ marginTop: 'var(--space-sm)' }}>
          {views.map(v => (
            <Link key={v.href} href={v.href}
              className="card group" style={{ display: 'block', textDecoration: 'none', padding: 'var(--space-md)' }}>
              <div className="t-card-heading" style={{ fontSize: '15px', marginBottom: 'var(--space-xs)' }}>{v.label}</div>
              <p className="t-muted" style={{ fontSize: '12px', lineHeight: 1.5 }}>{v.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest research */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
          <div className="t-eyebrow">/ Latest Research (2026)</div>
          <Link href="/research" className="t-muted" style={{ fontSize: '11px' }}>View timeline →</Link>
        </div>
        <div className="space-y-2">
          {latestPapers.map((p, i) => (
            <div key={i} className="card" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="badge badge-gold" style={{ fontSize: '9px' }}>{p.venue}</span>
              <div className="flex-1 min-w-0">
                <span className="t-body" style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>{p.title}</span>
                <span className="t-muted" style={{ fontSize: '11px' }}>{p.target}</span>
              </div>
              <span className="t-muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                {p.traces === 1 ? '1 trace' : `${p.traces.toLocaleString()} traces`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Market snapshot */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
          <div className="t-eyebrow">/ Market Snapshot</div>
          <Link href="/market" className="t-muted" style={{ fontSize: '11px' }}>Full analysis →</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="t-label">EM-SCA MARKET CAGR</div>
            <div className="t-stat" style={{ color: 'var(--success)' }}>12–18%</div>
            <div className="t-body" style={{ fontSize: '13px' }}>$380M (2026) → $870M (2035)</div>
            <div className="flex gap-2 flex-wrap" style={{ marginTop: 'var(--space-sm)' }}>
              {['UN R155', 'NIST PQC', 'CHIPS Act', 'ETSI EN 303 645'].map(d => (
                <span key={d} className="badge badge-blue">{d}</span>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="t-label">PRIVATE SIGINT MARKET</div>
            <div className="t-stat" style={{ color: 'var(--info)' }}>$8–12B</div>
            <div className="t-body" style={{ fontSize: '13px' }}>4 Tier-1 contractors · 6 specialists · Space-based growth</div>
            <div className="flex gap-2 flex-wrap" style={{ marginTop: 'var(--space-sm)' }}>
              {['Lockheed', 'Northrop', 'RTX', 'BAE', 'L3Harris'].map(c => (
                <span key={c} className="badge badge-blue">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wiki articles quick access */}
      <div>
        <div className="t-eyebrow">/ Wiki Articles</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ marginTop: 'var(--space-sm)' }}>
          {[
            { href: '/em-sca/electromagnetic-side-channel-analysis', label: 'EM-SCA Theory', tag: 'Foundation' },
            { href: '/em-sca/em-sca-2026-developments', label: '2026 Developments', tag: 'New' },
            { href: '/em-sca/pqc-implementation-security-2026', label: 'PQC Attack Analysis', tag: 'New' },
            { href: '/sigint/rf-fingerprinting-device-identification', label: 'RF Fingerprinting', tag: 'New' },
            { href: '/sigint/sigint-machine-learning-pipeline', label: 'ML Pipeline', tag: 'New' },
            { href: '/em-sca/organizations', label: 'Organizations', tag: 'Directory' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="card group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)', textDecoration: 'none' }}>
              <span className="t-body" style={{ fontSize: '13px' }}>{l.label}</span>
              <span className={`badge ${l.tag === 'New' ? 'badge-gold' : l.tag === 'Foundation' ? 'badge-maroon' : 'badge-blue'}`}>{l.tag}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
