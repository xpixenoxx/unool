'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) return; // Error handled by UI below

    const exchangeCode = async () => {
      try {
        const res = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: searchParams.get('code'),
            redirectTo: `${window.location.origin}${redirect}`,
          }),
        });

        if (res.ok) {
          router.push(redirect);
          router.refresh();
        }
      } catch {
        // Error handled by fallback UI
      }
    };

    exchangeCode();
  }, [searchParams, redirect, router, error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
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