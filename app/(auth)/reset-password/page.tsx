"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

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
      const response = await fetch(`${API_BASE}/api/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Reset failed");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            marginBottom: "1rem",
            color: "var(--theme-text-primary)",
          }}
        >
          Password reset successful
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--theme-text-muted)",
            marginBottom: "2rem",
          }}
        >
          Your password has been reset. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
          color: "var(--theme-text-primary)",
          textAlign: "center",
        }}
      >
        Set new password
      </h1>
      <p
        style={{
          fontSize: "1rem",
          color: "var(--theme-text-muted)",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        Enter your new password below
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

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label
            htmlFor="password"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--theme-text-primary)",
            }}
          >
            New Password
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
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>

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
