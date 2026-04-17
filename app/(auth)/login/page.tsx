"use client";

import Link from "next/link";
import LoginForm from "@/app/components/auth/LoginForm";
import OAuthButtons from "@/app/components/auth/OAuthButtons";

export default function LoginPage() {
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--theme-text-primary)",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--theme-text-muted)",
            marginBottom: "2rem",
          }}
        >
          Sign in to your SIGINT Wiki account
        </p>

        <LoginForm />

        <OAuthButtons />

        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--theme-text-muted)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--theme-accent)",
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </div>

        <div
          style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.875rem",
          }}
        >
          <Link
            href="/forgot-password"
            style={{
              color: "var(--theme-text-muted)",
              textDecoration: "none",
            }}
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
