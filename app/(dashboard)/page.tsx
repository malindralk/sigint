"use client";

import { useUser, usePermissions } from "@/app/lib/auth/hooks";
import Link from "next/link";

export default function DashboardPage() {
  const user = useUser();
  const { isAdmin, isEditor } = usePermissions();

  return (
    <div>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
          color: "var(--theme-text-primary)",
        }}
      >
        Welcome back, {user?.username || user?.email}
      </h1>
      <p
        style={{
          fontSize: "1rem",
          color: "var(--theme-text-muted)",
          marginBottom: "2rem",
        }}
      >
        Here&apos;s what&apos;s happening with your wiki
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Quick Stats */}
        <div
          style={{
            backgroundColor: "var(--theme-bg-elevated)",
            border: "1px solid var(--theme-border)",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--theme-text-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Total Articles
          </h3>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              color: "var(--theme-text-primary)",
            }}
          >
            --
          </p>
        </div>

        <div
          style={{
            backgroundColor: "var(--theme-bg-elevated)",
            border: "1px solid var(--theme-border)",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--theme-text-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Total Users
          </h3>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              color: "var(--theme-text-primary)",
            }}
          >
            --
          </p>
        </div>

        <div
          style={{
            backgroundColor: "var(--theme-bg-elevated)",
            border: "1px solid var(--theme-border)",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--theme-text-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Your Role
          </h3>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              color: "var(--theme-accent)",
              textTransform: "capitalize",
            }}
          >
            {user?.role}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          backgroundColor: "var(--theme-bg-elevated)",
          border: "1px solid var(--theme-border)",
          borderRadius: "8px",
          padding: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            marginBottom: "1rem",
            color: "var(--theme-text-primary)",
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {isEditor() && (
            <Link
              href="/dashboard/articles/new"
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "var(--theme-accent)",
                color: "white",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              + New Article
            </Link>
          )}
          {isEditor() && (
            <Link
              href="/dashboard/articles"
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "var(--theme-bg-base)",
                color: "var(--theme-text-primary)",
                border: "1px solid var(--theme-border)",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Manage Articles
            </Link>
          )}
          {isAdmin() && (
            <Link
              href="/dashboard/users"
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "var(--theme-bg-base)",
                color: "var(--theme-text-primary)",
                border: "1px solid var(--theme-border)",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Manage Users
            </Link>
          )}
          {isAdmin() && (
            <Link
              href="/dashboard/settings"
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "var(--theme-bg-base)",
                color: "var(--theme-text-primary)",
                border: "1px solid var(--theme-border)",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Site Settings
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
