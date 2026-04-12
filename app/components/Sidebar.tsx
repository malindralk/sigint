"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface WikiNavItem {
  slug: string;
  label: string;
}

interface WikiCategory {
  id: string;
  items: WikiNavItem[];
}

interface VizNavItem {
  href: string;
  icon: string;
  label: string;
  color: string;
}

const vizNav: VizNavItem[] = [
  { href: "/graph", icon: "◎", label: "Knowledge Graph", color: "#39d353" },
  { href: "/market", icon: "▲", label: "Market Intel", color: "#58a6ff" },
  { href: "/companies", icon: "◈", label: "Companies", color: "#bc8cff" },
  { href: "/equipment", icon: "⊡", label: "Equipment", color: "#f0883e" },
  { href: "/research", icon: "◷", label: "Research", color: "#e3b341" },
  { href: "/learning", icon: "⊕", label: "Learning Path", color: "#ff7b72" },
];

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  "em-sca": { label: "EM Side-Channel", icon: "⚡", color: "#39d353" },
  sigint: { label: "SIGINT", icon: "📡", color: "#58a6ff" },
  learning: { label: "Learning", icon: "📚", color: "#f0883e" },
};

export default function Sidebar({
  wikiNav,
}: {
  wikiNav: WikiCategory[];
}) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-bg-secondary border-r border-border-default h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col">
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-3 border-b border-border-default hover:bg-bg-tertiary transition-colors"
      >
        <span className="text-accent-green font-mono font-bold tracking-tight">
          SIGINT
        </span>
        <span className="text-text-secondary font-mono text-xs">WIKI</span>
      </Link>

      <nav className="flex-1 py-3 px-2 space-y-5">
        <div>
          <div className="px-2 mb-1 text-xs font-mono text-text-muted uppercase tracking-widest">
            Visualize
          </div>
          <ul className="space-y-0.5">
            {vizNav.map((item) => {
              const active =
                pathname === item.href || pathname === `${item.href}/`;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors"
                    style={
                      active
                        ? {
                            background: `${item.color}15`,
                            color: item.color,
                            borderLeft: `2px solid ${item.color}`,
                            paddingLeft: "6px",
                          }
                        : { color: "#8b949e" }
                    }
                  >
                    <span className="font-mono text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="px-2 mb-1 text-xs font-mono text-text-muted uppercase tracking-widest">
            Articles
          </div>
          {wikiNav.map((cat) => {
            const meta = CATEGORY_META[cat.id] ?? {
              label: cat.id,
              icon: "📄",
              color: "#6e7681",
            };
            const catActive = pathname.startsWith(`/${cat.id}`);
            return (
              <div key={cat.id} className="mb-3">
                <Link
                  href={`/${cat.id}`}
                  className="flex items-center gap-2 px-2 py-1 mb-0.5 rounded text-xs font-semibold tracking-widest uppercase transition-colors"
                  style={{ color: catActive ? meta.color : "#6e7681" }}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </Link>
                <ul className="space-y-0.5">
                  {cat.items.map((item) => {
                    const href = `/${cat.id}/${item.slug}`;
                    const active =
                      pathname === href || pathname === `${href}/`;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={href}
                          className="block px-2 py-1 rounded text-xs transition-colors truncate"
                          style={
                            active
                              ? {
                                  background: `${meta.color}15`,
                                  color: "#e6edf3",
                                  borderLeft: `2px solid ${meta.color}`,
                                  paddingLeft: "6px",
                                }
                              : { color: "#6e7681" }
                          }
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="px-4 py-2 border-t border-border-default">
        <p className="text-text-muted text-xs font-mono">Apr 2026</p>
      </div>
    </aside>
  );
}
