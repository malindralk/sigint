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

function SubItems({ items, basePath }: { items: { slug: string; label: string }[]; basePath: string }) {
  const pathname = usePathname();
  return (
    <div style={{ marginLeft: '20px', borderLeft: '1px solid var(--border)', paddingLeft: '8px', marginTop: '4px' }}>
      {items.map((item) => {
        const href = `${basePath}/${item.slug}`;
        const active = pathname === href || pathname === `${href}/`;
        return (
          <Link
            key={item.slug}
            href={href}
            className="block text-xs transition-colors"
            style={{
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: active ? 500 : 400,
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function GroupToggle({ label, expanded, onToggle }: { label: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="sidebar-item"
      style={{ justifyContent: 'space-between', width: '100%', background: 'none', border: 'none' }}
    >
      <span>{label}</span>
      <span className={`transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)', flexShrink: 0 }}>&#x203a;</span>
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    learning: pathname.startsWith('/learning'),
    'em-sca': pathname.startsWith('/em-sca'),
    sigint: pathname.startsWith('/sigint'),
  });

  const toggle = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className="sidebar hidden lg:flex">
      {/* Header */}
      <Link href="/" className="flex items-center gap-2 px-5 py-4 mb-2 border-b transition-colors hover:bg-white/[0.03]" style={{ borderColor: 'var(--border)', textDecoration: 'none' }}>
        <span className="nav-logo">MALINDRA<span className="nav-logo-dot">.</span></span>
        <span className="t-muted" style={{ fontSize: '10px' }}>SIGINT</span>
      </Link>

      {/* Nav items — flat, no nesting */}
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

        {/* Learning Path — flat toggle + sub-items */}
        <GroupToggle label="Learning Path" expanded={!!openGroups.learning} onToggle={() => toggle('learning')} />
        {openGroups.learning && (
          <SubItems items={[{ slug: 'coursera-sigint', label: 'Coursera Path' }]} basePath="/learning" />
        )}

        {/* EM Side-Channel — flat toggle + sub-items */}
        <GroupToggle label="EM Side-Channel" expanded={!!openGroups['em-sca']} onToggle={() => toggle('em-sca')} />
        {openGroups['em-sca'] && (
          <SubItems items={wikiGroups[0].items} basePath="/em-sca" />
        )}

        {/* SIGINT — flat toggle + sub-items */}
        <GroupToggle label="SIGINT" expanded={!!openGroups.sigint} onToggle={() => toggle('sigint')} />
        {openGroups.sigint && (
          <SubItems items={wikiGroups[1].items} basePath="/sigint" />
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-bottom">
        <p className="sidebar-version">Apr 2026</p>
        <p className="sidebar-edition">Kotte Heritage Edition</p>
      </div>
    </aside>
  );
}
