'use client';
// MALINDRA PHASE 1
// app/hooks/useLocale.tsx
// Lightweight EN/SI locale context with localStorage persistence.
// Only two languages: English and Sinhala.

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { type Locale, ui } from '@/lib/i18n';

type NavStrings = typeof ui.en.nav;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: typeof ui.en;
  nav: NavStrings;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = 'malindra-locale';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'si') {
        setLocaleState('si');
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    // Only allow en/si
    const safe: Locale = l === 'si' ? 'si' : 'en';
    setLocaleState(safe);
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === 'en' ? 'si' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  // Get translations for current locale (only en/si supported)
  const t = locale === 'si' ? (ui.si as typeof ui.en) : ui.en;
  const nav = t.nav as NavStrings;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, t, nav }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}
