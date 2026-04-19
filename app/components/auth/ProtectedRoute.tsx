'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth, usePermissions } from '@/app/lib/auth/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'editor' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole) {
      if (!hasRole(requiredRole)) {
        router.push('/dashboard?error=insufficient_permissions');
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, hasRole, router]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--theme-border)',
            borderTop: '3px solid var(--theme-accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
