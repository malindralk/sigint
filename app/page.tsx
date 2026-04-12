import Link from 'next/link';
import { categories } from '@/lib/content';
import { getArticles } from '@/lib/content';

const stats = [
  { label: 'Articles', value: '17' },
  { label: 'EM-SCA Market', value: '$500M' },
  { label: 'SIGINT Market', value: '$12B' },
  { label: 'Updated', value: 'Apr 2026' },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="pt-4">
        <div className="font-mono text-accent-green text-sm mb-3 tracking-widest uppercase">
          &gt; Knowledge Base / Initialized
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-4 leading-tight">
          SIGINT & EM-SCA<br />
          <span className="text-accent-cyan">Research Wiki</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
          A comprehensive knowledge base covering electromagnetic side-channel analysis,
          signals intelligence, hardware security research, and RF engineering.
          Current through 2026.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <div className="text-2xl font-bold font-mono text-accent-green">{s.value}</div>
            <div className="text-text-muted text-xs mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-semibold text-text-secondary uppercase tracking-widest mb-6 font-mono">
          / Domains
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((cat) => {
            const articles = getArticles(cat.id);
            return (
              <Link
                key={cat.id}
                href={`/${cat.id}`}
                className="group bg-bg-secondary border border-border-default rounded-lg p-6 hover:border-border-default hover:bg-bg-hover transition-all"
                style={{ '--accent': cat.accent } as React.CSSProperties}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-xs font-mono text-text-muted border border-border-muted rounded px-2 py-0.5">
                    {articles.length} articles
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-white transition-colors" style={{ color: cat.accent }}>
                  {cat.label}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {cat.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {articles.slice(0, 3).map((a) => (
                    <span key={a.slug} className="text-xs text-text-muted bg-bg-tertiary border border-border-muted rounded px-2 py-0.5 truncate max-w-[150px]">
                      {a.title}
                    </span>
                  ))}
                  {articles.length > 3 && (
                    <span className="text-xs text-text-muted">+{articles.length - 3} more</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-text-secondary uppercase tracking-widest mb-6 font-mono">
          / Quick Access
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: '/em-sca/electromagnetic-side-channel-analysis', label: 'EM-SCA Theory', tag: 'Foundational' },
            { href: '/em-sca/entry-level-em-sca-setup', label: 'Entry-Level Setup', tag: 'Practical' },
            { href: '/em-sca/tempest-standards-reference', label: 'TEMPEST Standards', tag: 'Reference' },
            { href: '/em-sca/pqc-em-sca', label: 'Post-Quantum Attacks', tag: 'Research' },
            { href: '/sigint/sigint-academic-research-overview', label: 'SIGINT Research', tag: 'Academic' },
            { href: '/em-sca/professional-em-sca-facility', label: 'Pro Facility Guide', tag: 'Advanced' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between bg-bg-secondary border border-border-default rounded-lg px-4 py-3 hover:bg-bg-hover hover:border-border-default transition-all group"
            >
              <span className="text-text-primary text-sm group-hover:text-white transition-colors">{link.label}</span>
              <span className="text-xs text-text-muted border border-border-muted rounded px-1.5 py-0.5 ml-2 shrink-0">{link.tag}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
