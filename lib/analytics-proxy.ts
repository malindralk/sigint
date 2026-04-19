// MALINDRA PHASE 3
// lib/analytics-proxy.ts
// Client-side analytics via FastAPI proxy.
// Zero third-party scripts. Full CSP compliance.
// Batches events and POSTs to /api/analytics/event.
// Checks localStorage malindra-consent before tracking.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // ms

interface AnalyticsEvent {
  name: string;
  url: string;
  referrer?: string;
  props?: Record<string, string | number | boolean>;
  timestamp: number;
}

let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('malindra-consent') === 'granted';
  } catch {
    return false;
  }
}

async function flush(): Promise<void> {
  if (queue.length === 0 || !hasConsent()) {
    queue = [];
    return;
  }

  const batch = queue.splice(0, BATCH_SIZE);

  try {
    await fetch(`${API_BASE}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Analytics failures are silent — never interrupt user
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL);
}

export function trackPageview(url?: string): void {
  if (typeof window === 'undefined' || !hasConsent()) return;
  enqueue({ name: 'pageview', props: {} }, url);
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>, url?: string): void {
  if (typeof window === 'undefined' || !hasConsent()) return;
  enqueue({ name, props: props ?? {} }, url);
}

function enqueue(event: Pick<AnalyticsEvent, 'name' | 'props'>, url?: string): void {
  queue.push({
    ...event,
    url: url ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    timestamp: Date.now(),
  });

  if (queue.length >= BATCH_SIZE) {
    void flush();
  } else {
    scheduleFlush();
  }
}

// Auto-flush on page hide (mobile-safe)
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flush();
    }
  });
  window.addEventListener('beforeunload', () => {
    void flush();
  });
}
