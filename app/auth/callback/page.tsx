'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [errorMessage, setErrorMessage] = useState<string | null>(searchParams.get('error'));

  useEffect(() => {
    // Check for error in hash fragment (Supabase often puts OAuth/Magic Link errors here)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        setErrorMessage(hashError.replace(/\+/g, ' '));
        return;
      }
    }

    if (errorMessage) return;

    const code = searchParams.get('code');
    if (!code) {
      // If we don't have a code and we didn't find an error in the hash, 
      // something is wrong.
      setErrorMessage('Missing authorization code');
      return;
    }

    const exchangeCode = async () => {
      try {
        const res = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirectTo: `${window.location.origin}${redirect}`,
          }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const target = data.redirectTo || redirect;
          
          // Use window.location for hard redirect to ensure cookies are sent properly
          // and state is completely clean after auth
          window.location.href = target;
        } else {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(data.error || 'Failed to authenticate');
        }
      } catch {
        setErrorMessage('Network error occurred during authentication');
      }
    };

    exchangeCode();
  }, [searchParams, redirect, router, errorMessage]);

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Button onClick={() => router.push('/signup')} variant="outline">
              <ArrowRight className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Completing Sign In</h2>
          <p className="text-muted-foreground">Please wait while we verify your magic link...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}