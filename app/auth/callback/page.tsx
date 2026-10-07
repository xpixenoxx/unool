'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { motion } from 'framer-motion';

const C = {
  oxblood: '#3A0B1A',
  terracotta: '#8C2A25',
  clay: '#C84B31',
};

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in query params (OAuth error)
        const queryError = searchParams.get('error');
        const queryErrorDesc = searchParams.get('error_description');
        if (queryError) {
          setErrorMessage(queryErrorDesc || queryError);
          setStatus('error');
          return;
        }

        // Check for error in hash fragment
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const hashError = hashParams.get('error_description') || hashParams.get('error');
          if (hashError) {
            setErrorMessage(hashError.replace(/\+/g, ' '));
            setStatus('error');
            return;
          }
        }

        const supabase = getSupabaseBrowserClient();
        const code = searchParams.get('code');

        if (code) {
          // PKCE flow: Exchange the code for a session using the BROWSER client.
          // This is correct — the browser client knows the PKCE verifier it stored.
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error || !data.session) {
            setErrorMessage(error?.message || 'Authentication failed. Please try again.');
            setStatus('error');
            return;
          }

          // Session is now active in the browser client. 
          // Ensure user profile and workspace exist via server-side upsert.
          try {
            await fetch('/api/auth/callback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                // No code — session already exchanged. Just trigger profile/workspace creation.
                token_hash: null,
                type: 'oauth',
                redirectTo: `${window.location.origin}${redirect}`,
              }),
            });
          } catch {
            // Non-fatal: profile upsert can fail silently; the session is still valid.
          }

          setStatus('success');
          setTimeout(() => router.push(redirect), 300);
          return;
        }

        // Handle hash-based implicit flow (fallback for older configs)
        if (hash && hash.includes('access_token=')) {
          // The Supabase client auto-processes the hash fragment on instantiation.
          // Wait briefly for it to complete, then verify the session.
          await new Promise(resolve => setTimeout(resolve, 400));
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('success');
            setTimeout(() => router.push(redirect), 300);
          } else {
            setErrorMessage('Could not establish session. Please try signing in again.');
            setStatus('error');
          }
          return;
        }

        // No code or token — something went wrong
        setErrorMessage('Missing authorization credentials. Please try again.');
        setStatus('error');
      } catch (err) {
        setErrorMessage('An unexpected error occurred. Please try again.');
        setStatus('error');
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
          <p className="text-white/50 max-w-sm">{errorMessage}</p>
        </div>
        <button
          onClick={() => router.push('/signin')}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.clay}, ${C.terracotta})` }}>
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 30px rgba(200,75,49,0.5)` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {status === 'success' ? 'Welcome back!' : 'Signing you in…'}
        </h2>
        <p className="text-white/50">
          {status === 'success' ? 'Taking you to your dashboard.' : 'Verifying your identity securely.'}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center font-sans"
      style={{ background: `linear-gradient(180deg, #3A0B1A 0%, #8C2A25 50%, #1A0A05 100%)` }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}