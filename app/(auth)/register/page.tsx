"use client";

import Link from "next/link";
import RegisterForm from "@/app/components/auth/RegisterForm";
import OAuthButtons from "@/app/components/auth/OAuthButtons";

export default function RegisterPage() {
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
          Create account
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--theme-text-muted)",
            marginBottom: "2rem",
          }}
        >
          Join the SIGINT Wiki community
        </p>

        <RegisterForm />

        <OAuthButtons />

        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--theme-text-muted)",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--theme-accent)",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
