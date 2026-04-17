"use client";

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
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "var(--theme-text-primary)",
            }}
          >
            Sign in
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>
            Use your Google account to access Malindra
          </p>
        </div>

        <OAuthButtons />
      </div>
    </div>
  );
}
