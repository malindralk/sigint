"use client";

import { useAuth } from "@/app/lib/auth/hooks";
import Link from "next/link";

export default function DashboardHeader() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "var(--theme-bg-base)",
        borderBottom: "1px solid var(--theme-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "0.875rem",
            color: "var(--theme-text-muted)",
            textDecoration: "none",
          }}
        >
          ← Back to site
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            color: "var(--theme-text-muted)",
            border: "1px solid var(--theme-border)",
            borderRadius: "4px",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--theme-text-primary)";
            e.currentTarget.style.borderColor = "var(--theme-text-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--theme-text-muted)";
            e.currentTarget.style.borderColor = "var(--theme-border)";
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
