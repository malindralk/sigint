"use client";

import { api } from "./client";

export interface User {
  id: string;
  email: string;
  username: string | null;
  role: "user" | "editor" | "admin";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UserDetail extends User {
  avatar_url: string | null;
  updated_at: string | null;
  session_count: number;
  oauth_connections: Array<{
    provider: string;
    provider_email: string | null;
  }>;
}

export interface UpdateUserRequest {
  role?: "user" | "editor" | "admin";
  is_active?: boolean;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export const usersApi = {
  // List users (admin only)
  list: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) =>
    api.get<UsersListResponse>(
      `/api/admin/users?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  // Get user details (admin only)
  get: (id: string) => api.get<UserDetail>(`/api/admin/users/${id}`),

  // Update user (admin only)
  update: (id: string, data: UpdateUserRequest) =>
    api.patch<User>(`/api/admin/users/${id}`, data),

  // Deactivate user (admin only)
  deactivate: (id: string) =>
    api.delete<{ message: string }>(`/api/admin/users/${id}`),
};
