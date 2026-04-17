"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth/hooks";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "400px",
        width: "100%",
      }}
    >
      {error && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "4px",
            color: "#ef4444",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label
          htmlFor="email"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--theme-text-primary)" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "0.75rem",
            border: "1px solid var(--theme-border)",
            borderRadius: "4px",
            backgroundColor: "var(--theme-bg-elevated)",
            color: "var(--theme-text-primary)",
            fontSize: "1rem",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label
          htmlFor="password"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--theme-text-primary)" }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "0.75rem",
            border: "1px solid var(--theme-border)",
            borderRadius: "4px",
            backgroundColor: "var(--theme-bg-elevated)",
            color: "var(--theme-text-primary)",
            fontSize: "1rem",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--theme-accent)",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          fontWeight: 500,
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
          marginTop: "0.5rem",
        }}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
