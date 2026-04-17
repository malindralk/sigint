'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/app/lib/auth/hooks';

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

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <line x1="4" y1="4" x2="18" y2="18" />
          <line x1="18" y1="4" x2="4" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="19" y2="6" />
          <line x1="3" y1="11" x2="19" y2="11" />
          <line x1="3" y1="16" x2="19" y2="16" />
        </>
      )}
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function MobileHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const toggle = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="mobile-header lg:hidden">
        <Link href="/" className="mobile-header-wordmark">
          <span className="mobile-header-sinhala">{'\u0DB8\u0DBD\u0DD2\u0DB1\u0DCA\u0DAF\u0DCA\u200D\u0DBB'}</span>
          <span className="mobile-header-wordmark-line" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="mobile-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="mobile-icon-btn"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <HamburgerIcon open={open} />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="mobile-drawer-backdrop lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <nav
        className={`mobile-drawer lg:hidden ${open ? 'mobile-drawer-open' : ''}`}
        aria-label="Navigation"
      >
        <div className="mobile-drawer-scroll">
          {/* Visualize section */}
          <div className="mobile-nav-section">Visualize</div>
          {vizNav.map(item => {
            const active = pathname === item.href || pathname === `${item.href}/`;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item ${active ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Articles section */}
          <div className="mobile-nav-section">Articles</div>

          {/* Learning Path */}
          <button
            className="mobile-nav-item mobile-nav-toggle"
            onClick={() => toggle('learning')}
            aria-expanded={!!openGroups.learning}
          >
            Learning Path
            <span className={`mobile-nav-chevron ${openGroups.learning ? 'rotated' : ''}`}>›</span>
          </button>
          {openGroups.learning && (
            <div className="mobile-nav-subtree">
              <Link
                href="/learning/coursera-sigint"
                className={`mobile-nav-subitem ${pathname === '/learning/coursera-sigint' ? 'active' : ''}`}
              >
                Coursera Path
              </Link>
            </div>
          )}

          {/* Wiki groups */}
          {wikiGroups.map(group => (
            <div key={group.id}>
              <button
                className="mobile-nav-item mobile-nav-toggle"
                onClick={() => toggle(group.id)}
                aria-expanded={!!openGroups[group.id]}
              >
                {group.label}
                <span className={`mobile-nav-chevron ${openGroups[group.id] ? 'rotated' : ''}`}>›</span>
              </button>
              {openGroups[group.id] && (
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
              )}
            </div>
          ))}

          {/* Auth section */}
          <div className="mobile-nav-section">Account</div>
          {!isLoading && (isAuthenticated && user ? (
            <>
              <Link href="/dashboard" className="mobile-nav-item">
                Dashboard
                <span className="mobile-nav-user-badge">{user.role}</span>
              </Link>
              <button
                className="mobile-nav-item"
                onClick={() => logout().then(() => { window.location.href = '/'; })}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="mobile-nav-item">Sign in</Link>
              <Link href="/register" className="mobile-nav-item">Create account</Link>
            </>
          ))}

          {/* Legal footer */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-sm)', marginTop: 'var(--space-sm)' }}>
            <Link href="/privacy" style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
          </div>
        </div>
      </nav>
    </>
  );
}
