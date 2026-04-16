'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';

const vizNav = [
  { href: '/graph', label: 'Knowledge Graph', shield: 'blue' as const },
  { href: '/market', label: 'Market Intel', shield: 'fortress' as const },
  { href: '/companies', label: 'Companies', shield: 'fortress' as const },
  { href: '/equipment', label: 'Equipment', shield: 'gold' as const },
  { href: '/research', label: 'Research', shield: 'blue' as const },
];

const wikiGroups = [
  {
    id: 'em-sca',
    label: 'EM Side-Channel',
    shield: 'gold' as const,
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
    shield: 'blue' as const,
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
    <div className="sidebar-subtree">
      {items.map((item) => {
        const href = `${basePath}/${item.slug}`;
        const active = pathname === href || pathname === `${href}/`;
        return (
          <Link
            key={item.slug}
            href={href}
            className={`sidebar-subitem ${active ? 'active' : ''}`}
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
      aria-expanded={expanded}
      className="sidebar-item sidebar-group-toggle"
    >
      {label}
      <span className={`transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`} style={{ color: 'var(--theme-text-muted)', flexShrink: 0, marginLeft: 'auto' }}>{'\u203a'}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    learning: pathname.startsWith('/learning'),
    'em-sca': pathname.startsWith('/em-sca'),
    sigint: pathname.startsWith('/sigint'),
  });

  const toggle = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className="sidebar hidden lg:flex">
      {/* Header -- rotating wordmark (Sinhala / English) */}
      <Link href="/" className="sidebar-wordmark">
        <div className="wordmark-coin">
          <div className="wordmark-face wordmark-front">
            <span className="sidebar-wordmark-sinhala">{'\u0DB8\u0DBD\u0DD2\u0DB1\u0DCA\u0DAF\u0DCA\u200D\u0DBB'}</span>
            <span className="sidebar-wordmark-line" />
          </div>
          <div className="wordmark-face wordmark-back">
            <span className="sidebar-wordmark-english">MALINDRA</span>
            <span className="sidebar-wordmark-line" />
          </div>
        </div>
      </Link>

      {/* Nav items */}
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

        {/* Learning Path */}
        <GroupToggle label="Learning Path" expanded={!!openGroups.learning} onToggle={() => toggle('learning')} />
        {openGroups.learning && (
          <SubItems items={[{ slug: 'coursera-sigint', label: 'Coursera Path' }]} basePath="/learning" />
        )}

        {/* Wiki groups -- lookup by id, not array index */}
        {wikiGroups.map((group) => (
          <div key={group.id}>
            <GroupToggle label={group.label} expanded={!!openGroups[group.id]} onToggle={() => toggle(group.id)} />
            {openGroups[group.id] && (
              <SubItems items={group.items} basePath={`/${group.id}`} />
            )}
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <button className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* Footer */}
      <div className="sidebar-bottom">
        <p className="sidebar-version">Apr 2026</p>
        <p className="sidebar-edition">Kotte Heritage Edition</p>
      </div>
    </aside>
  );
}
