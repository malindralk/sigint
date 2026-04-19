'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/lib/auth/context';

const IS_DEV = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_LOGIN_ENABLED === 'true';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface DevLoginFormProps {
  redirect?: string;
}

export default function DevLoginForm({ redirect = '/dashboard' }: DevLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { refreshToken } = useAuth();
  const router = useRouter();

  if (!IS_DEV) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Refresh token to sync auth state, then redirect
        await refreshToken();
        router.replace(redirect);
      } else {
        const data = await response.json();
        setError(data.detail || 'Login failed');
      }
    } catch (_err) {
      setError('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        marginTop: '1.5rem',
        borderTop: '1px solid var(--theme-border)',
        paddingTop: '1rem',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--theme-text-muted)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'center',
          padding: '0.25rem',
        }}
      >
        {isExpanded ? 'Hide' : 'Developer Login'}
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem' }}>
          {error && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                marginBottom: '0.75rem',
                backgroundColor: 'rgba(190, 51, 72, 0.1)',
                border: '1px solid rgba(190, 51, 72, 0.3)',
                borderRadius: '4px',
                color: 'var(--theme-text-primary)',
                fontSize: '0.8rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--theme-bg-elevated)',
                color: 'var(--theme-text-primary)',
                border: '1px solid var(--theme-border)',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--theme-bg-elevated)',
                color: 'var(--theme-text-primary)',
                border: '1px solid var(--theme-border)',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--theme-bg-elevated)',
                color: 'var(--theme-text-primary)',
                border: '1px solid var(--theme-border)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Signing in...' : 'Dev Sign In'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
