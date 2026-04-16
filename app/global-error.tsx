'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#16151B' }}>
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#F2E8D0', fontFamily: 'system-ui, sans-serif' }}>
              Something went wrong!
            </h2>
            <p className="mb-6" style={{ color: '#857B6C' }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: '#D49628', color: '#16151B' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
