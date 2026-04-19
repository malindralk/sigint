'use client';
// MALINDRA PHASE 1

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useAuth, usePermissions } from '@/app/lib/auth/hooks';
import { useLocale } from '@/app/hooks/useLocale';

const vizNav = [
  { href: '/graph', key: 'knowledgeGraph' as const, shield: 'blue' as const },
  { href: '/market', key: 'marketIntel' as const, shield: 'fortress' as const },
  { href: '/companies', key: 'companies' as const, shield: 'fortress' as const },
  { href: '/equipment', key: 'equipment' as const, shield: 'gold' as const },
  { href: '/research', key: 'research' as const, shield: 'blue' as const },
];

const wikiGroups = [
  {
    id: 'em-sca',
    labelKey: 'emSideChannel' as const,
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
    labelKey: 'sigint' as const,
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { hasRole } = usePermissions();
  const { locale, toggleLocale, nav } = useLocale();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    learning: pathname.startsWith('/learning'),
    'em-sca': pathname.startsWith('/em-sca'),
    sigint: pathname.startsWith('/sigint'),
  });

  const toggle = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className="sidebar hidden lg:flex">
      {/* Header — locale-reactive wordmark */}
      <Link href="/" className="sidebar-wordmark">
        <div className="wordmark-static">
          {locale === 'si' ? (
            <>
              <span className="sidebar-wordmark-sinhala">{'\u0DB8\u0DBD\u0DD2\u0DB1\u0DCA\u0DAF\u0DCA\u200D\u0DBB'}</span>
              <span className="sidebar-wordmark-line" />
            </>
          ) : (
            <>
              <span className="sidebar-wordmark-english">MALINDRA</span>
              <span className="sidebar-wordmark-line" />
            </>
          )}
        </div>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto">
        {/* Analysis */}
        <div className="sidebar-section">{nav.analysis}</div>
        <Link href="/blog" className={`sidebar-item ${pathname === '/blog' || pathname.startsWith('/blog/') ? 'active' : ''}`}>
          {nav.analysis}
        </Link>
        <Link href="/archive" className={`sidebar-item ${pathname === '/archive' || pathname.startsWith('/archive/') ? 'active' : ''}`}>
          {nav.archive}
        </Link>

        {/* Reference */}
        <div className="sidebar-section">{nav.reference}</div>
        <GroupToggle label={nav.learningPath} expanded={!!openGroups.learning} onToggle={() => toggle('learning')} />
        {openGroups.learning && (
          <SubItems items={[{ slug: 'coursera-sigint', label: nav.courseraPath }]} basePath="/learning" />
        )}
        {wikiGroups.map((group) => (
          <div key={group.id}>
            <GroupToggle label={nav[group.labelKey]} expanded={!!openGroups[group.id]} onToggle={() => toggle(group.id)} />
            {openGroups[group.id] && (
              <SubItems items={group.items} basePath={`/${group.id}`} />
            )}
          </div>
        ))}

        {/* Data */}
        <div className="sidebar-section">{nav.data}</div>
        {vizNav.map((item) => {
          const active = pathname === item.href || pathname === `${item.href}/`;
          return (
            <Link key={item.href} href={item.href} className={`sidebar-item ${active ? 'active' : ''}`}>
              {nav[item.key]}
            </Link>
          );
        })}

        {/* Dashboard — authenticated users only */}
        {!isLoading && isAuthenticated && (
          <>
            <div className="sidebar-section">{nav.dashboard}</div>
            <Link
              href="/dashboard"
              className={`sidebar-item ${pathname === '/dashboard' || pathname === '/dashboard/' ? 'active' : ''}`}
            >
              {nav.overview}
            </Link>
            {hasRole('editor') && (
              <Link
                href="/dashboard/articles"
                className={`sidebar-item ${pathname.startsWith('/dashboard/articles') ? 'active' : ''}`}
              >
                {nav.articles}
              </Link>
            )}
            {hasRole('admin') && (
              <>
                <Link
                  href="/dashboard/users"
                  className={`sidebar-item ${pathname.startsWith('/dashboard/users') ? 'active' : ''}`}
                >
                  {nav.users}
                </Link>
                <Link
                  href="/dashboard/settings"
                  className={`sidebar-item ${pathname.startsWith('/dashboard/settings') ? 'active' : ''}`}
                >
                  {nav.settings}
                </Link>
              </>
            )}
          </>
        )}
      </nav>

      {/* Language toggle */}
      <button
        className="theme-toggle"
        onClick={toggleLocale}
        aria-label={locale === 'en' ? 'Switch to Sinhala — සිංහල' : 'Switch to English'}
        style={{ borderTop: 'none', paddingTop: '8px', paddingBottom: '8px' }}
      >
        {locale === 'en' ? (
          <span style={{ fontFamily: 'var(--font-sinhala)', fontSize: '13px' }}>සිංහල</span>
        ) : (
          <span>English</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {locale === 'en' ? 'SI' : 'EN'}
        </span>
      </button>

      {/* Auth section */}
      {!isLoading && (isAuthenticated && user ? (
        <div className="sidebar-auth-user">
          <Link href="/dashboard" className="sidebar-auth-avatar" title={nav.dashboard}>
            {(user.username?.[0] ?? user.email[0]).toUpperCase()}
          </Link>
          <div className="sidebar-auth-info">
            <span className="sidebar-auth-name">{user.username ?? user.email}</span>
            <span className="sidebar-auth-role">{user.role}</span>
          </div>
          <Link
            href={user.role === 'admin' ? '/dashboard/settings' : '/settings'}
            className="sidebar-auth-settings"
            title={nav.settings}
            aria-label={nav.settings}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <button
            className="sidebar-auth-logout"
            onClick={() => logout().then(() => { window.location.href = '/'; })}
            title={nav.signOut}
            aria-label={nav.signOut}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      ) : (
        <Link href="/login" className="sidebar-auth-login">
          {nav.signIn}
        </Link>
      ))}

      {/* Theme toggle */}
      <button className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? nav.lightMode : nav.darkMode}>
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        <span>{theme === 'dark' ? nav.lightMode : nav.darkMode}</span>
      </button>
    </aside>
  );
}
