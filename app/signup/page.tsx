'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Linkedin, Twitter, MessageSquare, CheckCircle, ArrowRight, Sparkles, Zap, Shield, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Text, Display, Container, Section, Lead } from '@/components/ui/layout';
import { MotionBox, MotionStack, spring, stagger } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Transition } from 'framer-motion';

function SignupForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const reducedMotion = useReducedMotion();
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.standard;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}${redirect}` }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to send magic link' });
        return;
      }

      setMessage({ type: 'success', text: `Magic link sent to ${email}. Check your inbox (and spam folder).` });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Motion variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const headerVariants = {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: spring.snappy },
  };

  const brandVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: spring.bouncy },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/30"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      {/* Navigation Bar */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/80 border-b border-border"
        variants={headerVariants}
      >
        <Container size="lg" className="flex h-16 items-center justify-between">
          <Flex center gap={3}>
            <motion.div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium" variants={brandVariants}>
              <Sparkles className="w-3 h-3" />
              <span>One Link + One Click</span>
            </motion.div>
          </Flex>
          <Flex center gap={4}>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </Flex>
        </Container>
      </motion.header>

      {/* Signup Form Section */}
      <Section size="xl" className="relative overflow-hidden pt-20">
        <Container size="lg">
          <MotionStack space={8} className="max-w-md mx-auto" stagger={stagger.normal} direction="up">
            {/* Brand Header */}
            <MotionBox variant="fade" delay={0.1}>
              <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" variants={brandVariants}>
                <Sparkles className="w-4 h-4" />
                <span>One Link + One Click</span>
              </motion.div>
            </MotionBox>

            {/* Card */}
            <MotionBox variant="slide-up" delay={0.15}>
              <Card className="border-primary/20 bg-primary/5 shadow-xl">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Sign in to Unool</CardTitle>
                  <CardDescription>
                    Enter your email to receive a magic link. No password needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Magic Link'
                      )}
                    </Button>
                  </form>

                  {message && (
                    <MotionBox variant="scale" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springConfig}>
                      <div className={cn(
                        'p-3 rounded-lg text-sm flex items-center gap-2',
                        message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      )}>
                        {message.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                        {message.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        <span>{message.text}</span>
                      </div>
                    </MotionBox>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-foreground">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline hover:text-foreground">
                      Privacy Policy
                    </Link>.
                  </p>

                  {/* Dev bypass - only show in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <MotionBox variant="slide-up" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springConfig}>
                      <Flex className="relative" flexDirection="col" gap={2}>
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent z-10 pointer-events-none h-8 bottom-0" />
                          <Button
                            variant="outline"
                            className="w-full text-xs text-muted-foreground"
                            onClick={async () => {
                              const res = await fetch('/api/auth/dev-bypass', { method: 'GET', credentials: 'include' });
                              if (res.ok) window.location.href = '/dashboard';
                            }}
                          >
                            🛠️ Dev Login (Bypass Magic Link)
                          </Button>
                        </div>
                      </Flex>
                    </MotionBox>
                  )}
                </CardContent>
              </Card>
            </MotionBox>

            {/* Trust signals */}
            <MotionBox variant="fade" delay={0.3} className="text-center">
              <Text size="sm" color="muted" className="flex flex-wrap items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  No credit card
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Magic link auth
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Free forever for solo founders
                </span>
              </Text>
            </MotionBox>
          </MotionStack>
        </Container>
      </Section>

      {/* Features teaser */}
      <Section id="features" size="xl" className="bg-muted/30">
        <Container size="lg">
          <MotionStack space={6} className="text-center max-w-3xl mx-auto" stagger={stagger.normal} direction="up">
            <MotionBox variant="fade">
              <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" variants={brandVariants}>
                <Sparkles className="w-4 h-4" />
                <span>Built for Founders</span>
              </motion.div>
            </MotionBox>
            <MotionBox variant="slide-up">
              <Display size="xl" weight="extrabold">Everything you need, nothing you don&apos;t</Display>
            </MotionBox>
            <MotionBox variant="slide-up">
              <Lead>Replace Linktree + Buffer + Notion with one workflow. Ship faster. Look sharper.</Lead>
            </MotionBox>
          </MotionStack>

          <MotionStack space={6} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" stagger={stagger.normal} direction="up">
            {[
              {
                icon: Zap,
                title: 'One Link Profile',
                desc: 'Beautiful public profile at yourname.unool.co. 5 professional themes. Auto-generated from any URL. Proof points, links, badges — all editable.',
              },
              {
                icon: MessageSquare,
                title: 'AI Post Composer',
                desc: 'Write once. AI adapts for each platform\'s character limits, formatting, and best practices. LinkedIn threads, X tweets, Threads replies — all native.',
              },
              {
                icon: Shield,
                title: 'Human-in-the-Loop',
                desc: 'AI drafts. You approve. Edit inline, reject, or write from scratch. Nothing posts without your explicit click. Full control, zero surprises.',
              },
            ].map((feature, i) => (
              <MotionBox key={feature.title} variant="slide-up" delay={i * 0.07}>
                <Card className="p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-lg border-muted">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <Display size="md" weight="bold" className="mb-3">{feature.title}</Display>
                  <Text color="muted">{feature.desc}</Text>
                </Card>
              </MotionBox>
            ))}
          </MotionStack>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <Container size="lg">
          <Flex between wrap gap={4} className="text-sm text-muted-foreground">
            <Flex center gap={2}>
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold">Unool</span>
            </Flex>
            <Flex center gap={6}>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</Link>
            </Flex>
            <Text>Built for founder-operators, not content creators.</Text>
          </Flex>
        </Container>
      </footer>
    </motion.div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-12 h-12">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}