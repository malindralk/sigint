"use client";

// Access token is stored in memory (not localStorage for security)
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Refresh token is automatically sent via HTTP-only cookie
// No client-side storage needed

// Auto-refresh token before expiry
export function setupTokenRefresh(
  expiresIn: number,
  refreshFn: () => Promise<void>
): NodeJS.Timeout {
  // Refresh 5 minutes before expiry
  const refreshTime = (expiresIn - 300) * 1000;

  return setTimeout(() => {
    refreshFn().catch(console.error);
  }, Math.max(refreshTime, 0));
}

// Clear all tokens (for logout)
export function clearTokens(): void {
  accessToken = null;
}
