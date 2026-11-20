'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

function ErrorFallback({ error, resetError }: { error: unknown; componentStack: string; eventId: string; resetError: () => void }) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
      <h2>Something went wrong</h2>
      <p>{errorMessage}</p>
      <button onClick={resetError} style={{ marginTop: '10px', padding: '8px 16px' }}>
        Try again
      </button>
    </div>
  );
}

export function ClientErrorBoundary({ children }: { children: React.ReactNode }) {
  if (typeof Sentry.ErrorBoundary === 'function') {
    return <Sentry.ErrorBoundary fallback={ErrorFallback}>{children}</Sentry.ErrorBoundary>;
  }
  return <>{children}</>;
}
