'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-bg-base)' }}>
          <div className="text-center p-8">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--theme-text-primary)', fontFamily: 'system-ui, sans-serif' }}
            >
              Something went wrong!
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-warm-stone)' }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-temple-gold)', color: 'var(--theme-bg-base)' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
