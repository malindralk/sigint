"use client";

import { useAuth, User } from "./context";

export { useAuth };

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: "user" | "editor" | "admin"): boolean => {
    if (!user) return false;

    const roleHierarchy = { user: 0, editor: 1, admin: 2 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[role];

    return userLevel >= requiredLevel;
  };

  const isAdmin = (): boolean => user?.role === "admin";
  const isEditor = (): boolean =>
    user?.role === "editor" || user?.role === "admin";

  return {
    hasRole,
    isAdmin,
    isEditor,
    role: user?.role || null,
  };
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
