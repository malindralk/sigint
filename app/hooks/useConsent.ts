'use client';

import { useCallback, useEffect, useState } from 'react';

export type ConsentDecision = 'granted' | 'declined' | null;

const CONSENT_STORAGE_KEY = 'malindra-privacy-consent';
const CONSENT_VERSION = 'v1';

interface ConsentState {
  decision: ConsentDecision;
  timestamp: string | null;
  version: string;
}

export function useConsent() {
  const [consent, setConsentState] = useState<ConsentState>({
    decision: null,
    timestamp: null,
    version: CONSENT_VERSION,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ConsentState;
        // Check version - if different, reset consent
        if (parsed.version === CONSENT_VERSION) {
          setConsentState(parsed);
        } else {
          // Version mismatch - reset consent
          localStorage.removeItem(CONSENT_STORAGE_KEY);
        }
      }
    } catch {
      // localStorage unavailable or invalid JSON
    }
    setIsLoaded(true);
  }, []);

  const setConsent = useCallback((decision: ConsentDecision) => {
    const newState: ConsentState = {
      decision,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // localStorage unavailable
    }

    setConsentState(newState);

    // Log consent to backend for audit trail (if granted or declined)
    if (decision) {
      fetch('/api/consent/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          version: CONSENT_VERSION,
          timestamp: newState.timestamp,
        }),
      }).catch(() => {
        // Silent fail - don't block UI on logging failure
      });
    }
  }, []);

  const acceptConsent = useCallback(() => {
    setConsent('granted');
  }, [setConsent]);

  const declineConsent = useCallback(() => {
    setConsent('declined');
  }, [setConsent]);

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
    setConsentState({
      decision: null,
      timestamp: null,
      version: CONSENT_VERSION,
    });
  }, []);

  const hasConsent = consent.decision === 'granted';
  const hasDecided = consent.decision !== null;
  const showConsentDialog = isLoaded && !hasDecided;

  return {
    consent,
    hasConsent,
    hasDecided,
    showConsentDialog,
    acceptConsent,
    declineConsent,
    resetConsent,
    isLoaded,
  };
}
