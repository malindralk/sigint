"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import DashboardSidebar from "@/app/components/dashboard/Sidebar";
import DashboardHeader from "@/app/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <DashboardSidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <DashboardHeader />
          <main
            style={{
              flex: 1,
              overflow: "auto",
              padding: "var(--spacing-xl) var(--spacing-2xl)",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                width: "100%",
                margin: "0 auto",
              }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
