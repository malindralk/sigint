"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    username?: string
  ) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      // Try to refresh token on page load
      await refreshToken();
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshToken() {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // Include refresh token cookie
    });

    if (response.ok) {
      const data = await response.json();
      setAccessToken(data.access_token);
      await fetchUser(data.access_token);
    } else {
      throw new Error("Token refresh failed");
    }
  }

  async function fetchUser(token: string) {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const userData = await response.json();
      setUser({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        avatarUrl: userData.avatar_url,
        isVerified: userData.is_verified,
      });
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    const data = await response.json();
    setAccessToken(data.access_token);
    setUser(data.user);
  }

  async function register(email: string, password: string, username?: string) {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }

    // After successful registration, login
    await login(email, password);
  }

  async function logout() {
    if (accessToken) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
    }
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
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
