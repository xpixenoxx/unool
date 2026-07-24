'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Flex, Box, Text, Display } from '@/components/ui/layout';
import { MotionBox, spring } from '@/components/ui/motion';
import { Container, Section } from '@/components/ui/layout';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Transition } from 'framer-motion';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [errorMessage, setErrorMessage] = useState<string | null>(searchParams.get('error'));
  const [isExchanging, setIsExchanging] = useState(false);
  const reducedMotion = useReducedMotion();
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

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
      setIsExchanging(true);
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

          // Use router.push for client-side navigation if possible,
          // but fall back to window.location for hard redirect
          // This ensures cookies are sent properly and state is clean
          router.push(target);
        } else {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(data.error || 'Failed to authenticate');
        }
      } catch {
        setErrorMessage('Network error occurred during authentication');
      } finally {
        setIsExchanging(false);
      }
    };

    exchangeCode();
  }, [searchParams, redirect, router, errorMessage]);

  if (errorMessage) {
    return (
      <Section size="lg" className="flex items-center justify-center">
        <Container size="sm">
          <MotionBox variant="slide-up">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-8 text-center">
                <MotionBox variant="scale" delay={0.1} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springConfig}>
                  <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-7 h-7 text-destructive" />
                  </div>
                </MotionBox>
                <Display size="md" weight="bold" className="mb-2">Authentication Failed</Display>
                <Text color="muted" className="mb-6 max-w-sm mx-auto">{errorMessage}</Text>
                <MotionBox variant="scale" delay={0.2}>
                  <Button onClick={() => router.push('/signup')} variant="outline" size="lg" className="w-full sm:w-auto">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </MotionBox>
              </CardContent>
            </Card>
          </MotionBox>
        </Container>
      </Section>
    );
  }

  return (
    <Section size="lg" className="flex items-center justify-center">
      <Container size="sm">
        <MotionBox variant="slide-up">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-8 text-center">
              <MotionBox variant="scale" delay={0.1} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springConfig}>
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
              </MotionBox>
              <Display size="md" weight="bold" className="mb-2">Completing Sign In</Display>
              <Text color="muted" className="mb-6 max-w-sm mx-auto">
                {isExchanging ? 'Verifying your magic link...' : 'Please wait while we verify your magic link...'}
              </Text>
              <MotionBox variant="slide-up" delay={0.3}>
                <Flex center gap={2} className="text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span>Sent to your inbox</span>
                </Flex>
              </MotionBox>
            </CardContent>
          </Card>
        </MotionBox>
      </Container>
    </Section>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <Section size="lg" className="flex items-center justify-center">
        <Container size="sm">
          <div className="text-center">
            <Loader2 className="mx-auto w-8 h-8 text-primary animate-spin" />
          </div>
        </Container>
      </Section>
    }>
      <MotionBox variant="fade">
        <AuthCallbackContent />
      </MotionBox>
    </Suspense>
  );
}