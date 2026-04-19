"use client";
// MALINDRA PHASE 1 — Dashboard uses root layout sidebar; no separate nav.

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
