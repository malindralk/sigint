'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const vizNav = [
  { href: '/graph', label: 'Knowledge Graph', icon: '◎', color: '#7A1E2E' },
  { href: '/market', label: 'Market Intel', icon: '▲', color: '#2C5F8A' },
  { href: '/companies', label: 'Companies', icon: '◈', color: '#C4881E' },
  { href: '/equipment', label: 'Equipment', icon: '⊡', color: '#1E6B52' },
  { href: '/research', label: 'Research', icon: '◷', color: '#A8293C' },
];

const wikiGroups = [
  {
    id: 'em-sca',
    label: 'EM Side-Channel',
    icon: '⚡',
    color: '#7A1E2E',
    items: [
      { slug: 'electromagnetic-side-channel-analysis', label: 'Overview & Theory' },
      { slug: 'tempest-standards-reference', label: 'TEMPEST Standards' },
      { slug: 'pqc-em-sca', label: 'Post-Quantum Crypto' },
      { slug: 'electromagnetic-side-channel-practical-guide', label: 'Practical Guide' },
      { slug: 'entry-level-em-sca-setup', label: 'Entry-Level Setup' },
      { slug: 'research-grade-em-sca-lab', label: 'Research-Grade Lab' },
      { slug: 'professional-em-sca-facility', label: 'Professional Facility' },
      { slug: 'em-sca-market-analysis-overview', label: 'Market Analysis' },
      { slug: 'em-sca-key-players-companies', label: 'Key Players' },
      { slug: 'em-sca-consumer-applications', label: 'Consumer Applications' },
      { slug: 'em-sca-index', label: 'Index & Cross-Refs' },
      { slug: 'em-sca-2026-developments', label: '2026 Developments' },
      { slug: 'sdr-tools-landscape-2026', label: 'SDR Tools' },
      { slug: 'pqc-implementation-security-2026', label: 'PQC Implementation' },
      { slug: 'contacts', label: 'Contacts' },
      { slug: 'organizations', label: 'Organizations' },
    ],
  },
  {
    id: 'sigint',
    label: 'SIGINT',
    icon: '📡',
    color: '#2C5F8A',
    items: [
      { slug: 'sigint-academic-research-overview', label: 'Academic Research' },
      { slug: 'sigint-private-companies-em-intelligence', label: 'Private Companies' },
      { slug: 'rf-fingerprinting-device-identification', label: 'RF Fingerprinting' },
      { slug: 'sigint-machine-learning-pipeline', label: 'ML Pipeline' },
    ],
  },
];

function CollapsibleGroup({ group, pathname }: { group: typeof wikiGroups[number]; pathname: string }) {
  const [expanded, setExpanded] = useState(pathname.startsWith(`/${group.id}`));
  const isActive = pathname.startsWith(`/${group.id}`);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/[0.03]"
        style={{ color: isActive ? group.color : 'var(--text-muted)' }}
      >
        <span className="font-mono text-base">{group.icon}</span>
        <span className="flex-1 text-left">{group.label}</span>
        <span className={`transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`}>&#x203a;</span>
      </button>
      {expanded && (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
          {group.items.map((item) => {
            const href = `/${group.id}/${item.slug}`;
            const active = pathname === href || pathname === `${href}/`;
            return (
              <li key={item.slug}>
                <Link
                  href={href}
                  className="block px-2 py-1 rounded text-xs transition-colors truncate"
                  style={active
                    ? { background: `${group.color}22`, color: 'var(--text-primary)', borderLeft: `2px solid ${group.color}`, marginLeft: '-3px', paddingLeft: '5px' }
                    : { color: 'var(--text-muted)' }
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LearningGroup({ pathname }: { pathname: string }) {
  const [expanded, setExpanded] = useState(pathname.startsWith('/learning'));
  const isActive = pathname.startsWith('/learning');

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link
          href="/learning"
          className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/[0.03]"
          style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)' }}
        >
          <span className="font-mono text-base">⊕</span>
          <span className="flex-1">Learning Path</span>
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:text-text-secondary mr-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className={`transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`}>&#x203a;</span>
        </button>
      </div>
      {expanded && (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
          <li>
            <Link
              href="/learning/coursera-sigint"
              className="block px-2 py-1 rounded text-xs transition-colors truncate flex items-center gap-1.5"
              style={pathname.startsWith('/learning/coursera-sigint')
                ? { background: 'var(--brand-primary)22', color: 'var(--text-primary)', borderLeft: '2px solid var(--brand-primary)', marginLeft: '-3px', paddingLeft: '5px' }
                : { color: 'var(--text-muted)' }
              }
            >
              <span className="text-xs">🎓</span>
              <span>Coursera Path</span>
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 shrink-0 border-r h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <Link href="/" className="flex items-center gap-2 px-4 py-3 border-b transition-colors hover:bg-white/[0.03]" style={{ borderColor: 'var(--border)' }}>
        <span className="font-display font-bold tracking-tight text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>MALINDRA</span>
        <span className="text-xs font-mono" style={{ color: 'var(--brand-primary)' }}>●</span>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: '10px' }}>SIGINT</span>
      </Link>

      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {/* Visualizations */}
        <div>
          <div className="px-2 mb-1 text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', letterSpacing: '0.2em', fontSize: '9px', fontWeight: 600 }}>Visualize</div>
          <ul className="space-y-0.5">
            {vizNav.map((item) => {
              const active = pathname === item.href || pathname === `${item.href}/`;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors relative"
                    style={active
                      ? { background: `${item.color}18`, color: 'var(--text-primary)', borderLeft: `3px solid ${item.color}`, paddingLeft: '5px' }
                      : { color: 'var(--text-muted)' }
                    }
                  >
                    <span className="font-mono text-base">{item.icon}</span>
                    <span style={{ fontFamily: 'var(--font-ui)' }}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Wiki articles */}
        <div>
          <div className="px-2 mb-1 text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', letterSpacing: '0.2em', fontSize: '9px', fontWeight: 600 }}>Articles</div>
          <ul className="space-y-0.5">
            {/* Learning — with submenu */}
            <li><LearningGroup pathname={pathname} /></li>
            {/* EM-SCA & SIGINT — collapsible */}
            {wikiGroups.map((group) => (
              <li key={group.id}>
                <CollapsibleGroup group={group} pathname={pathname} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-2 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: '10px' }}>Apr 2026</p>
      </div>
    </aside>
  );
}
