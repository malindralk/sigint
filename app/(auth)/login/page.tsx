'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import OAuthButtons from '@/app/components/auth/OAuthButtons';
import { useAuth } from '@/app/lib/auth/context';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const error = searchParams.get('error');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, isLoading, redirect, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'var(--theme-bg-base)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        backgroundColor: 'var(--theme-bg-base)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--theme-text-primary)',
            }}
          >
            Sign in to Malindra
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)' }}>
            Sign in with your Google account to continue
          </p>
        </div>

        {error && (
          <div
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(190, 51, 72, 0.1)',
              border: '1px solid rgba(190, 51, 72, 0.3)',
              borderRadius: '4px',
              color: 'var(--theme-text-primary)',
              fontSize: '0.875rem',
            }}
          >
            {error === 'access_denied' ? 'Access was denied. Please try again.' : 'Sign in failed. Please try again.'}
          </div>
        )}

        <OAuthButtons redirect={redirect} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
