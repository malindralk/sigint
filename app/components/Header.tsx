'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="nav">
      <nav className="hidden md:flex items-center gap-0">
        {[
          { href: '/graph', label: 'Graph' },
          { href: '/market', label: 'Market' },
          { href: '/companies', label: 'Companies' },
          { href: '/equipment', label: 'Equipment' },
          { href: '/research', label: 'Research' },
          { href: '/learning', label: 'Learning' },
        ].map((item) => {
          const active = pathname === item.href || pathname === `${item.href}/` || pathname.startsWith(`/${item.href}/`);
          return (
            <Link key={item.href} href={item.href}
              className={`nav-link ${active ? 'active' : ''}`}>
              {active && <span className="nav-shield" />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-ui)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand-primary)' }} />
          LIVE
        </span>
      </div>
    </header>
  );
}
