'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const vizNav = [
  { href: '/graph', label: 'Knowledge Graph' },
  { href: '/market', label: 'Market Intel' },
  { href: '/companies', label: 'Companies' },
  { href: '/equipment', label: 'Equipment' },
  { href: '/research', label: 'Research' },
];

const wikiGroups = [
  {
    id: 'em-sca',
    label: 'EM Side-Channel',
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
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        style={{ justifyContent: 'space-between' }}
      >
        <span>{group.label}</span>
        <span className={`transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)', flexShrink: 0 }}>&#x203a;</span>
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
                  style={{
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    ...(active ? { background: 'rgba(44, 95, 138, 0.08)', fontWeight: 500 } : {}),
                  }}
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
      <div className="flex items-center">
        <Link href="/learning" className={`sidebar-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
          Learning Path
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center mr-1"
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
              style={{
                color: pathname.startsWith('/learning/coursera-sigint') ? 'var(--text-primary)' : 'var(--text-muted)',
                ...(pathname.startsWith('/learning/coursera-sigint') ? { background: 'rgba(44, 95, 138, 0.08)', fontWeight: 500 } : {}),
              }}
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
      <Link href="/" className="flex items-center gap-2 px-5 py-4 mb-2 border-b transition-colors hover:bg-white/[0.03]" style={{ borderColor: 'var(--border)', textDecoration: 'none' }}>
        <span className="nav-logo">MALINDRA<span className="nav-logo-dot">.</span></span>
        <span className="t-muted" style={{ fontSize: '10px' }}>SIGINT</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        {/* Visualize */}
        <div className="sidebar-section">Visualize</div>
        {vizNav.map((item) => {
          const active = pathname === item.href || pathname === `${item.href}/`;
          return (
            <Link key={item.href} href={item.href} className={`sidebar-item ${active ? 'active' : ''}`}>
              {item.label}
            </Link>
          );
        })}

        {/* Articles */}
        <div className="sidebar-section">Articles</div>

        {/* Learning */}
        <LearningGroup pathname={pathname} />

        {/* Wiki groups */}
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
