import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary';

export const metadata: Metadata = {
  title: 'Unool — One Link + One Click',
  description: 'Create your professional presence and publish everywhere from one place.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,600&family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ClientErrorBoundary>
          {children}
        </ClientErrorBoundary>
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
