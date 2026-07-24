import type { Metadata } from 'next';
import { Geist, Geist_Mono, Syne } from 'next/font/google';
import * as Sentry from "@sentry/nextjs";
import './globals.css';
import { Toaster } from 'sonner';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const syne = Syne({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-syne', display: 'swap' });

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
      <body className={`${geist.variable} ${geistMono.variable} ${syne.variable} font-sans antialiased`}>
        <Sentry.ErrorBoundary fallback={ErrorFallback}>
          {children}
        </Sentry.ErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}