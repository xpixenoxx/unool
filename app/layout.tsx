import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import * as Sentry from "@sentry/nextjs";
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Unool — One Link + One Click',
  description: 'Create your professional presence and publish everywhere from one place.',
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Sentry.ErrorBoundary fallback={ErrorFallback}>
          {children}
        </Sentry.ErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}