"use client";

import { useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/password/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Request failed");
      }

      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          backgroundColor: "var(--theme-bg-base)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "var(--theme-text-primary)",
            }}
          >
            Check your email
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--theme-text-muted)",
              marginBottom: "2rem",
            }}
          >
            If an account exists with that email, we&apos;ve sent password reset
            instructions.
          </p>
          <Link
            href="/login"
            style={{
              color: "var(--theme-accent)",
              textDecoration: "none",
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        backgroundColor: "var(--theme-bg-base)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--theme-text-primary)",
            textAlign: "center",
          }}
        >
          Reset password
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--theme-text-muted)",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Enter your email and we&apos;ll send you reset instructions
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
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

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
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
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.875rem",
          }}
        >
          <Link
            href="/login"
            style={{
              color: "var(--theme-text-muted)",
              textDecoration: "none",
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
