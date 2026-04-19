// MALINDRA PHASE 2
// components/LanguageToggle.tsx
// Client-side language toggle.
// Stores preference to localStorage; swaps /en/ ↔ /si/ locale prefix in URL.
// Static-export safe: uses next/navigation only for client-side router.push.

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type Locale, swapLocale } from '@/lib/i18n';

interface LanguageToggleProps {
  currentLocale: Locale;
}

export default function LanguageToggle({ currentLocale }: LanguageToggleProps) {
  const pathname = usePathname();
  const router = useRouter();

  function toggle() {
    const newPath = swapLocale(pathname, currentLocale);
    try {
      const next: Locale = currentLocale === 'en' ? 'si' : 'en';
      localStorage.setItem('malindra-locale', next);
    } catch {
      // localStorage unavailable — proceed without storage
    }
    router.push(newPath);
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost"
      style={{ padding: '6px 14px', fontSize: '12px', letterSpacing: '0.06em' }}
      aria-label={
        currentLocale === 'en'
          ? 'Switch to Sinhala — සිංහල'
          : 'Switch to English'
      }
    >
      {currentLocale === 'en' ? (
        <span style={{ fontFamily: 'var(--font-sinhala)' }}>සිංහල</span>
      ) : (
        'English'
      )}
    </button>
  );
}
