import type { Metadata } from 'next';
import * as Sentry from "@sentry/nextjs";
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Unool — One Link + One Click',
  description: 'Create your professional presence and publish everywhere from one place.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Sentry.ErrorBoundary fallback={ErrorFallback}>
          {children}
        </Sentry.ErrorBoundary>
        <Toaster
          position="top-center"
          style={{
            '--width': 'min(92vw, 1100px)',
          } as React.CSSProperties}
          toastOptions={{
            className: '!w-full !max-w-[min(92vw,1100px)]',
          }}
        />
      </body>
    </html>
  );
}