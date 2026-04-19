"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { setAccessToken, clearTokens, setupTokenRefresh } from "./tokens";

export interface User {
  id: string;
  email: string;
  username: string | null;
  role: "user" | "editor" | "admin";
  avatarUrl: string | null;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const IS_DEV = process.env.NODE_ENV === "development";

// Debug logging in development
const debug = (...args: unknown[]) => {
  if (IS_DEV) {
    console.log("[Auth]", ...args);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    debug("Initializing auth...");
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      // Try to refresh token on page load
      await refreshToken();
    } catch (err) {
      debug("Auth initialization failed:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshToken() {
    debug("Refreshing token...");
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // Include refresh token cookie
    });

    if (response.ok) {
      const data = await response.json();
      debug("Token refreshed successfully");
      setAccessTokenState(data.access_token);
      setAccessToken(data.access_token); // Sync with tokens module for API client
      // Schedule proactive refresh before token expires
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (data.expires_in) {
        refreshTimerRef.current = setupTokenRefresh(data.expires_in, refreshToken);
      }
      await fetchUser(data.access_token);
    } else {
      debug("Token refresh failed:", response.status);
      throw new Error("Token refresh failed");
    }
  }

  async function fetchUser(token: string) {
    debug("Fetching user...");
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const userData = await response.json();
      debug("User fetched:", userData.email, "Role:", userData.role);
      setUser({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        avatarUrl: userData.avatar_url,
        isVerified: userData.is_verified,
      });
    } else {
      debug("Failed to fetch user:", response.status);
    }
  }

  async function logout() {
    debug("Logging out...");
    if (accessToken) {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      debug("Logout response:", response.status);
    }
    setUser(null);
    setAccessTokenState(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    clearTokens(); // Clear tokens module for API client
    debug("Logout complete");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
