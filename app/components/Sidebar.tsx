'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const vizNav = [
  { href: '/graph', label: 'Knowledge Graph', color: 'var(--brand-primary)' },
  { href: '/market', label: 'Market Intel', color: 'var(--info)' },
  { href: '/companies', label: 'Companies', color: 'var(--brand-accent)' },
  { href: '/equipment', label: 'Equipment', color: 'var(--success)' },
  { href: '/research', label: 'Research', color: 'var(--danger)' },
];

const wikiGroups = [
  {
    id: 'em-sca',
    label: 'EM Side-Channel',
    color: 'var(--brand-primary)',
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
    color: 'var(--info)',
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
        className="sidebar-item"
        style={{ padding: '9px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: isActive ? group.color : 'var(--text-muted)', fontWeight: isActive ? 500 : 400 }}
      >
        <span className="flex-1 text-left">{group.label}</span>
        <span className={`transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)' }}>&#x203a;</span>
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
                    ? { background: 'rgba(44, 95, 138, 0.08)', color: 'var(--text-primary)', borderLeft: `2px solid ${group.color}`, marginLeft: '-3px', paddingLeft: '5px' }
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
          className="sidebar-item"
          style={{ padding: '9px 20px', width: '100%', color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)', fontWeight: isActive ? 500 : 400 }}
        >
          <span className="flex-1 text-left">Learning Path</span>
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors mr-1"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span className={`transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`}>&#x203a;</span>
        </button>
      </div>
      {expanded && (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
          <li>
            <Link
              href="/learning/coursera-sigint"
              className="block px-2 py-1 rounded text-xs transition-colors truncate"
              style={pathname.startsWith('/learning/coursera-sigint')
                ? { background: 'rgba(44, 95, 138, 0.08)', color: 'var(--text-primary)', borderLeft: '2px solid var(--brand-primary)', marginLeft: '-3px', paddingLeft: '5px' }
                : { color: 'var(--text-muted)' }
              }
            >
              Coursera Path
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
    <aside className="sidebar hidden lg:flex">
      {/* Header */}
      <Link href="/" className="flex items-center gap-2 px-5 py-4 mb-2 border-b transition-colors hover:bg-white/[0.03]" style={{ borderColor: 'var(--border)' }}>
        <span className="nav-logo">MALINDRA<span className="nav-logo-dot">.</span></span>
        <span className="t-muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '10px' }}>SIGINT</span>
      </Link>

      <nav className="flex-1 overflow-y-auto">
        {/* Visualizations */}
        <div className="sidebar-section">Visualize</div>
        {vizNav.map((item) => {
          const active = pathname === item.href || pathname === `${item.href}/`;
          return (
            <Link key={item.href} href={item.href}
              className={`sidebar-item ${active ? 'active' : ''}`}
              style={active ? { borderLeftColor: item.color } : {}}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px' }}>{item.label}</span>
            </Link>
          );
        })}

        {/* Articles */}
        <div className="sidebar-section">Articles</div>

        {/* Learning */}
        <LearningGroup pathname={pathname} />

        {/* EM-SCA & SIGINT */}
        {wikiGroups.map((group) => (
          <CollapsibleGroup key={group.id} group={group} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-bottom">
        <p className="sidebar-version">Apr 2026</p>
        <p className="sidebar-edition">Kotte Heritage Edition</p>
      </div>
    </aside>
  );
}
