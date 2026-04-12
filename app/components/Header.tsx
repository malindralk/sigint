'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mobileNav = [
  { href: '/em-sca', label: '⚡ EM-SCA' },
  { href: '/sigint', label: '📡 SIGINT' },
  { href: '/infrastructure', label: '🖥 Infra' },
  { href: '/learning', label: '📚 Learn' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border-default bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Mobile brand */}
        <Link href="/" className="lg:hidden font-mono font-bold text-accent-green tracking-tight">
          SIGINT WIKI
        </Link>

        {/* Mobile nav */}
        <nav className="lg:hidden flex items-center gap-1 overflow-x-auto">
          {mobileNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors ${
                  active ? 'bg-bg-hover text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Breadcrumb (desktop) */}
        <div className="hidden lg:flex items-center gap-2 text-sm text-text-secondary font-mono">
          {pathname === '/' ? (
            <span className="text-text-primary">Home</span>
          ) : (
            pathname.split('/').filter(Boolean).map((seg, i, arr) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-border-default">/</span>}
                <span className={i === arr.length - 1 ? 'text-text-primary' : 'text-text-secondary'}>
                  {seg.replace(/-/g, ' ')}
                </span>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
