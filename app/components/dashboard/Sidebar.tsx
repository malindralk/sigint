"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions, useUser } from "@/app/lib/auth/hooks";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  requiredRole?: "editor" | "admin";
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/articles", label: "Articles", icon: "📝", requiredRole: "editor" },
  { href: "/dashboard/users", label: "Users", icon: "👥", requiredRole: "admin" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️", requiredRole: "admin" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { hasRole } = usePermissions();
  const user = useUser();

  const filteredNavItems = navItems.filter(
    (item) => !item.requiredRole || hasRole(item.requiredRole)
  );

  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "var(--theme-bg-elevated)",
        borderRight: "1px solid var(--theme-border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid var(--theme-border)",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "var(--theme-text-primary)",
            textDecoration: "none",
          }}
        >
          SIGINT Wiki
        </Link>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--theme-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          Admin Dashboard
        </p>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "1rem 0",
          overflowY: "auto",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1.5rem",
                    color: isActive
                      ? "var(--theme-accent)"
                      : "var(--theme-text-primary)",
                    backgroundColor: isActive
                      ? "rgba(139, 92, 246, 0.1)"
                      : "transparent",
                    textDecoration: "none",
                    fontSize: "0.9375rem",
                    fontWeight: isActive ? 500 : 400,
                    borderLeft: isActive
                      ? "3px solid var(--theme-accent)"
                      : "3px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--theme-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--theme-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "white",
            }}
          >
            {user?.username?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase() ||
              "?"}
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--theme-text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.username || user?.email}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--theme-text-muted)",
                textTransform: "capitalize",
              }}
            >
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
