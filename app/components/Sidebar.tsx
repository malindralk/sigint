'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const vizNav = [
  { href: '/graph', icon: '◎', label: 'Knowledge Graph', color: '#39d353' },
  { href: '/market', icon: '▲', label: 'Market Intel', color: '#58a6ff' },
  { href: '/companies', icon: '◈', label: 'Companies', color: '#bc8cff' },
  { href: '/equipment', icon: '⊡', label: 'Equipment', color: '#f0883e' },
  { href: '/research', icon: '◷', label: 'Research', color: '#e3b341' },
  { href: '/learning', icon: '⊕', label: 'Learning Path', color: '#ff7b72' },
];

const wikiNav = [
  {
    id: 'em-sca', label: 'EM Side-Channel', icon: '⚡', color: '#39d353',
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
      { slug: 'sdr-tools-landscape-2026', label: 'SDR Tools Landscape' },
      { slug: 'pqc-implementation-security-2026', label: 'PQC Implementation' },
      { slug: 'contacts', label: 'Contacts' },
      { slug: 'organizations', label: 'Organizations' },
    ],
  },
  {
    id: 'sigint', label: 'SIGINT', icon: '📡', color: '#58a6ff',
    items: [
      { slug: 'sigint-academic-research-overview', label: 'Academic Research' },
      { slug: 'sigint-private-companies-em-intelligence', label: 'Private Companies' },
      { slug: 'rf-fingerprinting-device-identification', label: 'RF Fingerprinting' },
      { slug: 'sigint-machine-learning-pipeline', label: 'ML Pipeline' },
    ],
  },
  {
    id: 'infrastructure', label: 'Infrastructure', icon: '🖥', color: '#bc8cff',
    items: [
      { slug: 'proxmox-homelab', label: 'Proxmox Homelab' },
      { slug: 'community-scripts-org', label: 'Community Scripts' },
      { slug: 'malindra-lxc-setup', label: 'Malindra LXC Setup' },
    ],
  },
  {
    id: 'learning', label: 'Learning', icon: '📚', color: '#f0883e',
    items: [{ slug: 'coursera-sigint', label: 'Coursera Path' }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-bg-secondary border-r border-border-default h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col">
      <Link href="/" className="flex items-center gap-2 px-4 py-3 border-b border-border-default hover:bg-bg-tertiary transition-colors">
        <span className="text-accent-green font-mono font-bold tracking-tight">SIGINT</span>
        <span className="text-text-secondary font-mono text-xs">WIKI</span>
      </Link>

      <nav className="flex-1 py-3 px-2 space-y-5">
        {/* Visualizations */}
        <div>
          <div className="px-2 mb-1 text-xs font-mono text-text-muted uppercase tracking-widest">Visualize</div>
          <ul className="space-y-0.5">
            {vizNav.map(item => {
              const active = pathname === item.href || pathname === `${item.href}/`;
              return (
                <li key={item.href}>
                  <Link href={item.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors"
                    style={active
                      ? { background: `${item.color}15`, color: item.color, borderLeft: `2px solid ${item.color}`, paddingLeft: '6px' }
                      : { color: '#8b949e' }}
                  >
                    <span className="font-mono text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Wiki articles */}
        <div>
          <div className="px-2 mb-1 text-xs font-mono text-text-muted uppercase tracking-widest">Articles</div>
          {wikiNav.map(cat => {
            const catActive = pathname.startsWith(`/${cat.id}`);
            return (
              <div key={cat.id} className="mb-3">
                <Link href={`/${cat.id}`}
                  className="flex items-center gap-2 px-2 py-1 mb-0.5 rounded text-xs font-semibold tracking-widest uppercase transition-colors"
                  style={{ color: catActive ? cat.color : '#6e7681' }}>
                  <span>{cat.icon}</span><span>{cat.label}</span>
                </Link>
                <ul className="space-y-0.5">
                  {cat.items.map(item => {
                    const href = `/${cat.id}/${item.slug}`;
                    const active = pathname === href || pathname === `${href}/`;
                    return (
                      <li key={item.slug}>
                        <Link href={href}
                          className="block px-2 py-1 rounded text-xs transition-colors truncate"
                          style={active
                            ? { background: `${cat.color}15`, color: '#e6edf3', borderLeft: `2px solid ${cat.color}`, paddingLeft: '6px' }
                            : { color: '#6e7681' }}
                        >{item.label}</Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="px-4 py-2 border-t border-border-default">
        <p className="text-text-muted text-xs font-mono">Apr 2026</p>
      </div>
    </aside>
  );
}
