'use client';
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html><body>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ color: '#dc2626', fontSize: '1.5rem', marginBottom: '1rem' }}>Critical Error</h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error.message || 'The application encountered a critical error.'}</p>
          <button onClick={reset} style={{ background: '#1f2937', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Reload App
          </button>
        </div>
      </div>
    </body></html>
  );
}

