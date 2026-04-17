"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth/hooks";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 12) return "Password must be at least 12 characters";
    if (!/[A-Z]/.test(pass)) return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(pass)) return "Password must contain a lowercase letter";
    if (!/\d/.test(pass)) return "Password must contain a digit";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass))
      return "Password must contain a special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, username || undefined);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--theme-text-primary)",
          }}
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
          htmlFor="username"
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--theme-text-primary)",
          }}
        >
          Username (optional)
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--theme-text-primary)",
          }}
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
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--theme-text-muted)",
          }}
        >
          Must be at least 12 characters with uppercase, lowercase, digit, and
          special character
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label
          htmlFor="confirmPassword"
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--theme-text-primary)",
          }}
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        {isLoading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
