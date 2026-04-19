'use client';
// MALINDRA PHASE 1
// MobileHeader.tsx
// Mobile navigation with locale-aware translated strings

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useAuth, usePermissions } from '@/app/lib/auth/hooks';
import { useLocale } from '@/app/hooks/useLocale';

const vizNav = [
  { href: '/graph', key: 'knowledgeGraph' as const },
  { href: '/market', key: 'marketIntel' as const },
  { href: '/companies', key: 'companies' as const },
  { href: '/equipment', key: 'equipment' as const },
  { href: '/research', key: 'research' as const },
];

const wikiGroups = [
  {
    id: 'em-sca',
    labelKey: 'emSideChannel' as const,
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
    items: [
      { slug: 'sigint-academic-research-overview', label: 'Academic Research' },
      { slug: 'sigint-private-companies-em-intelligence', label: 'Private Companies' },
      { slug: 'rf-fingerprinting-device-identification', label: 'RF Fingerprinting' },
      { slug: 'sigint-machine-learning-pipeline', label: 'ML Pipeline' },
    ],
  },
];

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="transition-transform duration-200"
    >
      {open ? (
        <>
          <line x1="4" y1="4" x2="16" y2="16" className="origin-center" />
          <line x1="16" y1="4" x2="4" y2="16" className="origin-center" />
        </>
      ) : (
        <>
          <line x1="2" y1="6" x2="18" y2="6" />
          <line x1="2" y1="10" x2="18" y2="10" />
          <line x1="2" y1="14" x2="18" y2="14" />
        </>
      )}
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function MobileHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { hasRole } = usePermissions();
  const { locale, toggleLocale, nav, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    learning: pathname.startsWith('/learning'),
    'em-sca': pathname.startsWith('/em-sca'),
    sigint: pathname.startsWith('/sigint'),
  });

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const toggle = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="mobile-header lg:hidden">
        <Link href="/" className="mobile-header-wordmark">
          {locale === 'si' ? (
            <span className="mobile-header-sinhala">{'මලින්ද්‍ර'}</span>
          ) : (
            <span className="mobile-header-english">MALINDRA</span>
          )}
          <span className="mobile-header-wordmark-line" />
        </Link>

        <div className="mobile-header-actions">
          <button
            className="mobile-icon-btn mobile-locale-btn"
            onClick={toggleLocale}
            aria-label={locale === 'en' ? 'Switch to Sinhala — සිංහල' : 'Switch to English'}
          >
            {locale === 'en' ? 'සි' : 'EN'}
          </button>
          <button
            className="mobile-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? nav.lightMode : nav.darkMode}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="mobile-icon-btn mobile-menu-btn"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
          >
            <HamburgerIcon open={open} />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`mobile-drawer-backdrop lg:hidden ${open ? 'mobile-drawer-backdrop-visible' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer */}
      <nav
        className={`mobile-drawer lg:hidden ${open ? 'mobile-drawer-open' : ''}`}
        aria-label="Navigation"
      >
        <div className="mobile-drawer-scroll">
          {/* Analysis section */}
          <div className="mobile-nav-section">
            <span className="mobile-nav-section-line" />
            {nav.analysis}
          </div>
          <div className="mobile-nav-group">
            <Link
              href="/blog"
              className={`mobile-nav-item ${pathname === '/blog' || pathname.startsWith('/blog/') ? 'active' : ''}`}
            >
              <span className="mobile-nav-item-text">{nav.analysis}</span>
              {(pathname === '/blog' || pathname.startsWith('/blog/')) && <span className="mobile-nav-active-indicator" />}
            </Link>
            <Link
              href="/archive"
              className={`mobile-nav-item ${pathname === '/archive' || pathname.startsWith('/archive/') ? 'active' : ''}`}
            >
              <span className="mobile-nav-item-text">{nav.archive}</span>
              {(pathname === '/archive' || pathname.startsWith('/archive/')) && <span className="mobile-nav-active-indicator" />}
            </Link>
          </div>

          {/* Reference section */}
          <div className="mobile-nav-section">
            <span className="mobile-nav-section-line" />
            {nav.reference}
          </div>
          <div className="mobile-nav-group">
            {/* Learning Path */}
            <button
              className="mobile-nav-item mobile-nav-toggle"
              onClick={() => toggle('learning')}
              aria-expanded={!!openGroups.learning}
            >
              <span className="mobile-nav-item-text">{nav.learningPath}</span>
              <ChevronIcon open={!!openGroups.learning} />
            </button>
            <div className={`mobile-nav-subtree-wrapper ${openGroups.learning ? 'mobile-nav-subtree-expanded' : ''}`}>
              <div className="mobile-nav-subtree">
                <Link
                  href="/learning/coursera-sigint"
                  className={`mobile-nav-subitem ${pathname === '/learning/coursera-sigint' ? 'active' : ''}`}
                >
                  {nav.courseraPath}
                </Link>
              </div>
            </div>

            {/* Wiki groups */}
            {wikiGroups.map(group => (
              <div key={group.id}>
                <button
                  className="mobile-nav-item mobile-nav-toggle"
                  onClick={() => toggle(group.id)}
                  aria-expanded={!!openGroups[group.id]}
                >
                  <span className="mobile-nav-item-text">{nav[group.labelKey]}</span>
                  <ChevronIcon open={!!openGroups[group.id]} />
                </button>
                <div className={`mobile-nav-subtree-wrapper ${openGroups[group.id] ? 'mobile-nav-subtree-expanded' : ''}`}>
                  <div className="mobile-nav-subtree">
                    {group.items.map(item => {
                      const href = `/${group.id}/${item.slug}`;
                      const active = pathname === href || pathname === `${href}/`;
                      return (
                        <Link
                          key={item.slug}
                          href={href}
                          className={`mobile-nav-subitem ${active ? 'active' : ''}`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Data section */}
          <div className="mobile-nav-section">
            <span className="mobile-nav-section-line" />
            {nav.data}
          </div>
          <div className="mobile-nav-group">
            {vizNav.map((item, index) => {
              const active = pathname === item.href || pathname === `${item.href}/`;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-nav-item ${active ? 'active' : ''}`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="mobile-nav-item-text">{nav[item.key]}</span>
                  {active && <span className="mobile-nav-active-indicator" />}
                </Link>
              );
            })}
          </div>

          {/* Auth section */}
          <div className="mobile-nav-section">
            <span className="mobile-nav-section-line" />
            {nav.account}
          </div>
          <div className="mobile-nav-group">
            {!isLoading && (isAuthenticated && user ? (
              <>
                <Link href="/dashboard" className="mobile-nav-item mobile-nav-user">
                  <span className="mobile-nav-item-text">{nav.dashboard}</span>
                  <span className="mobile-nav-user-badge">{user.role}</span>
                </Link>
                {hasRole('editor') && (
                  <Link
                    href="/dashboard/articles"
                    className={`mobile-nav-item ${pathname.startsWith('/dashboard/articles') ? 'active' : ''}`}
                  >
                    <span className="mobile-nav-item-text">{nav.articles}</span>
                  </Link>
                )}
                {hasRole('admin') && (
                  <>
                    <Link
                      href="/dashboard/users"
                      className={`mobile-nav-item ${pathname.startsWith('/dashboard/users') ? 'active' : ''}`}
                    >
                      <span className="mobile-nav-item-text">{nav.users}</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className={`mobile-nav-item ${pathname.startsWith('/dashboard/settings') ? 'active' : ''}`}
                    >
                      <span className="mobile-nav-item-text">{nav.settings}</span>
                    </Link>
                  </>
                )}
                <button
                  className="mobile-nav-item mobile-nav-logout"
                  onClick={() => logout().then(() => { window.location.href = '/'; })}
                >
                  <span className="mobile-nav-item-text">{nav.signOut}</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="mobile-nav-item">
                  <span className="mobile-nav-item-text">{nav.signIn}</span>
                </Link>
              </>
            ))}
          </div>

        </div>
      </nav>
    </>
  );
}
