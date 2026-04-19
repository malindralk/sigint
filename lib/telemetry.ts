// MALINDRA PHASE 5
// lib/telemetry.ts
// Privacy-first telemetry client for static Next.js export.
// Cookieless session IDs, consent-based event firing, A/B variant resolution.
// Zero external SDK dependencies.

"use client";

export type ConsentLevel = "none" | "analytics" | "full";

interface TelemetryConfig {
  endpoint: string;
  consent: ConsentLevel;
  sessionId?: string;
}

let _config: TelemetryConfig = {
  endpoint: "/api/telemetry",
  consent: "none",
};

let _sessionId: string | null = null;
let _abCache: Record<string, string> = {};

// ── Session ───────────────────────────────────────────────────────────────────

/**
 * Generate a privacy-safe in-memory session ID.
 * Never stored in cookies. Resets on tab close.
 */
function generateSessionId(): string {
  const arr = new Uint8Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    arr.forEach((_, i) => { arr[i] = Math.floor(Math.random() * 256); });
  }
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getSessionId(): string {
  if (!_sessionId) _sessionId = generateSessionId();
  return _sessionId;
}

// ── Consent ───────────────────────────────────────────────────────────────────

export function setConsent(level: ConsentLevel): void {
  _config.consent = level;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("malindra_consent", level);
    }
  } catch { /* storage blocked */ }
}

export function getConsent(): ConsentLevel {
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("malindra_consent") as ConsentLevel | null;
      if (stored) {
        _config.consent = stored;
        return stored;
      }
    }
  } catch { /* storage blocked */ }
  return _config.consent;
}

function hasAnalyticsConsent(): boolean {
  return getConsent() === "analytics" || getConsent() === "full";
}

// ── Event tracking ────────────────────────────────────────────────────────────

export interface TrackEventOptions {
  path?: string;
  referrer?: string;
  variant?: string;
  experiment?: string;
  duration_ms?: number;
  scroll_depth?: number;
  properties?: Record<string, unknown>;
}

export async function trackEvent(
  event: string,
  options: TrackEventOptions = {}
): Promise<void> {
  if (!hasAnalyticsConsent()) return;
  if (typeof window === "undefined") return;

  try {
    await fetch(`${_config.endpoint}/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Consent": "analytics",
      },
      body: JSON.stringify({
        event,
        session_id: getSessionId(),
        path: options.path ?? window.location.pathname,
        referrer: options.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined),
        ...options,
      }),
      keepalive: true,
    });
  } catch {
    /* non-blocking */
  }
}

export async function trackPageView(path?: string): Promise<void> {
  await trackEvent("page_view", {
    path: path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
  });
}

export async function trackConversion(
  goal: string,
  opts: { experiment?: string; variant?: string; value_usd?: number } = {}
): Promise<void> {
  if (!hasAnalyticsConsent()) return;
  if (typeof window === "undefined") return;

  try {
    await fetch(`${_config.endpoint}/conversion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Consent": "analytics",
      },
      body: JSON.stringify({
        goal,
        session_id: getSessionId(),
        ...opts,
      }),
      keepalive: true,
    });
  } catch {
    /* non-blocking */
  }
}

// ── A/B testing ───────────────────────────────────────────────────────────────

export async function getVariant(experiment: string): Promise<string> {
  if (_abCache[experiment]) return _abCache[experiment];
  if (typeof window === "undefined") return "control";

  try {
    const res = await fetch(`${_config.endpoint}/ab/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experiment, session_id: getSessionId() }),
    });
    if (res.ok) {
      const data = await res.json();
      const variant: string = data.variant ?? "control";
      _abCache[experiment] = variant;
      return variant;
    }
  } catch {
    /* fallback to control */
  }

  _abCache[experiment] = "control";
  return "control";
}

// ── Scroll depth tracking ─────────────────────────────────────────────────────

let _scrollTracked = false;
let _scrollMilestones = new Set<number>();

export function initScrollTracking(path?: string): () => void {
  if (typeof window === "undefined" || _scrollTracked) return () => {};
  _scrollTracked = true;
  _scrollMilestones = new Set();

  const handler = () => {
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    const pct = total > 0 ? (scrolled / total) * 100 : 0;

    for (const milestone of [25, 50, 75, 90, 100]) {
      if (pct >= milestone && !_scrollMilestones.has(milestone)) {
        _scrollMilestones.add(milestone);
        void trackEvent("scroll_depth", {
          scroll_depth: milestone,
          path,
        });
      }
    }
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => {
    window.removeEventListener("scroll", handler);
    _scrollTracked = false;
  };
}

// ── Time-on-page tracking ─────────────────────────────────────────────────────

export function initTimeOnPage(path?: string): () => void {
  if (typeof window === "undefined") return () => {};
  const startTime = Date.now();

  const reportTime = () => {
    const duration_ms = Date.now() - startTime;
    if (duration_ms > 3000) {
      void trackEvent("time_on_page", { duration_ms, path });
    }
  };

  window.addEventListener("beforeunload", reportTime);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reportTime();
  });

  return () => {
    window.removeEventListener("beforeunload", reportTime);
  };
}

// ── Configure ─────────────────────────────────────────────────────────────────

export function configureTelemetry(opts: Partial<TelemetryConfig>): void {
  _config = { ..._config, ...opts };
}
