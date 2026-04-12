'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mobileNav = [
  { href: '/em-sca', label: '⚡ EM-SCA' },
  { href: '/sigint', label: '📡 SIGINT' },
  { href: '/learning', label: '📚 Learn' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', backdropFilter: 'blur(8px)' }}>
      <div className="flex items-center justify-between px-4 h-12">
        <Link href="/" className="lg:hidden font-bold tracking-tight" style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontSize: '18px' }}>
          MALINDRA<span style={{ color: 'var(--brand-accent)' }}>.</span>
        </Link>

        <nav className="lg:hidden flex items-center gap-1 overflow-x-auto">
          {mobileNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
                style={{
                  background: active ? 'var(--bg-elevated)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-ui)',
                }}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 text-sm font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
          {pathname === '/' ? (
            <span style={{ color: 'var(--text-primary)' }}>Home</span>
          ) : (
            pathname.split('/').filter(Boolean).map((seg, i, arr) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: 'var(--border-strong)' }}>/</span>}
                <span style={i === arr.length - 1 ? { color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}>
                  {seg.replace(/-/g, ' ')}
                </span>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-ui)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand-primary)' }} />
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
