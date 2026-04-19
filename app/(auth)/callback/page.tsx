'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth/context';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshToken } = useAuth();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    console.log('[OAuthCallback] success:', success, 'error:', error, 'redirectTo:', redirectTo);

    if (success) {
      // OAuth set a refresh token cookie — hydrate auth state then redirect
      console.log('[OAuthCallback] Calling refreshToken...');
      refreshToken()
        .then(() => {
          console.log('[OAuthCallback] refreshToken succeeded, redirecting to:', redirectTo);
          router.push(redirectTo);
        })
        .catch((err) => {
          console.error('[OAuthCallback] refreshToken failed:', err);
          router.push('/login?error=session_failed');
        });
    } else if (error) {
      console.error('[OAuthCallback] OAuth error:', error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
    } else {
      console.log('[OAuthCallback] No success or error, redirecting to login');
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get, router.push, refreshToken]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--theme-bg-base)',
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
      <p
        style={{
          marginTop: '1rem',
          color: 'var(--theme-text-muted)',
        }}
      >
        Completing sign in...
      </p>
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

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'var(--theme-bg-base)',
          }}
        >
          <div>Loading...</div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
