'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Linkedin, Twitter, MessageSquare, CheckCircle, Zap, Shield, Sparkles,
  ArrowUpRight, Globe, BarChart2, Clock, Layers, PenTool, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Text, Display, Container, Section, Lead } from '@/components/ui/layout';
import { MotionBox, MotionStack, MotionGrid, spring, stagger } from '@/components/ui/motion';
import { TiltCard, MagneticCard, OrbitalBackground, MorphingBlob } from '@/components/ui/3d';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const featureIcons = {
  Zap,
  MessageSquare,
  Shield,
  ArrowUpRight,
  CheckCircle,
  Sparkles,
  Globe,
  BarChart2,
  Clock,
  Layers,
  PenTool,
  Star,
};

const stepIcons = {
  Linkedin,
  Twitter,
  MessageSquare,
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

const bgVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1, delay: 0.2 } },
};

export default function HomePage() {
  const reducedMotion = useReducedMotion();
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

  return (
    <motion.div className="min-h-screen bg-gradient-to-b from-background to-muted/30" initial="initial" animate="animate" variants={pageVariants}>
      {/* Navigation Bar */}
      <motion.header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/80 border-b border-border" variants={headerVariants}>
        <Container size="lg" className="flex h-16 items-center justify-between">
          <Flex center gap={3}>
            <motion.div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium" variants={brandVariants}>
              <Sparkles className="w-3 h-3" />
              <span>One Link + One Click</span>
            </motion.div>
          </Flex>
          <Flex center gap={4}>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </Flex>
        </Container>
      </motion.header>

      {/* Hero Section */}
      <Section size="xl" className="relative overflow-hidden pt-20">
        <motion.div className="absolute inset-0 -z-10" variants={bgVariants}>
          <OrbitalBackground />
        </motion.div>

        <Container size="lg">
          <MotionStack space={8} className="max-w-4xl mx-auto text-center" stagger={stagger.normal} direction="up">
            <MotionBox variant="fade" delay={0.1}>
              <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" variants={brandVariants}>
                <Sparkles className="w-4 h-4" />
                <span>One Link + One Click</span>
              </motion.div>
            </MotionBox>

            <MotionBox variant="slide-up" delay={0.15}>
              <Display size="2xl" weight="extrabold" className="text-balance">
                Your professional presence,{' '}
                <span className="text-primary">automated publishing</span>
              </Display>
            </MotionBox>

            <MotionBox variant="slide-up" delay={0.2}>
              <Lead className="max-w-2xl mx-auto">
                Paste your URL. Get a beautiful profile page + platform-native posts for LinkedIn, X, and Threads.
                Write once. Review. Publish everywhere.
              </Lead>
            </MotionBox>

            <Flex gap={4} className="justify-center" style={{ flexWrap: 'wrap' }}>
              <MotionBox variant="scale">
                <Button asChild size="lg" className="group w-full sm:w-auto">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 inline-block transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </MotionBox>
            </Flex>

            <MotionBox variant="fade" delay={0.3}>
              <Text size="sm" color="muted" className="flex flex-wrap items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> No credit card
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Magic link auth
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Free forever for solo founders
                </span>
              </Text>
            </MotionBox>
          </MotionStack>

          {/* Trust Signals */}
          <MotionGrid cols={4} gap={6} stagger={stagger.normal} className="grid-cols-2 sm:grid-cols-4">
            {[
              { icon: Zap, label: '< 30s', desc: 'URL to live profile' },
              { icon: CheckCircle, label: '3 platforms', desc: 'LinkedIn, X, Threads' },
              { icon: Shield, label: 'You decide', desc: 'AI suggests, you approve' },
              { icon: Sparkles, label: 'Free tier', desc: 'No credit card required' },
            ].map(({ icon: Icon, label, desc }, i) => (
              <MotionBox key={label} variant="slide-up" delay={i * 0.08}>
                <Card className="border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Icon className="w-10 h-10 mx-auto text-primary mb-3" />
                    <Text weight="semibold" size="lg">{label}</Text>
                    <Text size="sm" color="muted" className="mt-1">{desc}</Text>
                  </CardContent>
                </Card>
              </MotionBox>
            ))}
          </MotionGrid>
        </Container>
      </Section>

      {/* How It Works - 3D Card Grid */}
      <Section id="how-it-works" size="xl">
        <Container size="lg">
          <MotionStack space={6} className="text-center max-w-3xl mx-auto" stagger={stagger.normal} direction="up">
            <MotionBox variant="fade">
              <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" variants={brandVariants}>
                <Sparkles className="w-4 h-4" />
                <span>How Unool Works</span>
              </motion.div>
            </MotionBox>
            <MotionBox variant="slide-up">
              <Display size="xl" weight="extrabold">Three steps to unified presence</Display>
            </MotionBox>
          </MotionStack>

          <MotionGrid cols={3} gap={8} stagger={stagger.normal}>
            {[
              {
                step: '01',
                title: 'Generate Your Profile',
                desc: 'Paste your website, LinkedIn, or GitHub URL. AI extracts your role, company, metrics, links, and proof points. Live at yourname.unool.co in seconds.',
                icon: Linkedin,
              },
              {
                step: '02',
                title: 'Write Once, Adapt Everywhere',
                desc: 'Type your idea once. Unool generates platform-native versions: LinkedIn (3000 chars, hashtags, first-comment), X (280/thread), Threads (500, reply structure).',
                icon: Twitter,
              },
              {
                step: '03',
                title: 'Review & Publish',
                desc: 'See all 3 drafts side-by-side. Edit any field inline. Accept all, edit individually, reject AI, or write your own. Nothing publishes without your click.',
                icon: MessageSquare,
              },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <MotionBox key={step} variant="slide-up" delay={i * 0.1}>
                <TiltCard className="relative p-6 bg-card border hover:shadow-2xl hover:border-primary/30 transition-all duration-500">
                  <div className="absolute -top-3 left-6 bg-background px-2 text-sm font-mono text-primary">{step}</div>
                  <Icon className="w-12 h-12 text-primary mb-4" />
                  <Display size="md" weight="bold" className="mb-3">{title}</Display>
                  <Text color="muted">{desc}</Text>
                </TiltCard>
              </MotionBox>
            ))}
          </MotionGrid>
        </Container>
      </Section>

      {/* Features */}
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

          <MotionGrid cols={3} gap={6} stagger={stagger.normal} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
              {
                icon: ArrowUpRight,
                title: 'One-Click Publish',
                desc: 'Connected accounts via OAuth. One click publishes to LinkedIn, X, and Threads simultaneously. Real-time status. Failed posts retry automatically.',
              },
              {
                icon: CheckCircle,
                title: 'Free Forever Tier',
                desc: '12 posts/month, 1 profile, all 3 platforms. No credit card. Magic link auth. Perfect for solo founders building in public.',
              },
              {
                icon: Sparkles,
                title: 'Smart Scheduling',
                desc: 'Schedule posts for optimal times. Timezone-aware. Queue management. Recurring posts. Calendar view coming soon.',
              },
            ].map((feature, i) => (
              <MotionBox key={feature.title} variant="slide-up" delay={i * 0.07}>
                <MagneticCard className="p-6 h-full transition-all duration-300">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <Display size="md" weight="bold" className="mb-3">{feature.title}</Display>
                  <Text color="muted">{feature.desc}</Text>
                </MagneticCard>
              </MotionBox>
            ))}
          </MotionGrid>
        </Container>
      </Section>

      {/* Pricing / CTA Section */}
      <Section id="pricing" size="xl">
        <Container size="lg">
          <MotionStack space={6} className="text-center max-w-3xl mx-auto" stagger={stagger.normal} direction="up">
            <MotionBox variant="fade">
              <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" variants={brandVariants}>
                <Sparkles className="w-4 h-4" />
                <span>Simple, Transparent Pricing</span>
              </motion.div>
            </MotionBox>
            <MotionBox variant="slide-up">
              <Display size="xl" weight="extrabold">Start free. Scale when you&apos;re ready.</Display>
            </MotionBox>
          </MotionStack>

          <MotionGrid cols={3} gap={6} stagger={stagger.normal}>
            {/* Free Tier */}
            <MotionBox variant="slide-up">
              <Card className="border-muted hover:border-primary/30 transition-all duration-300 h-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold">Free</CardTitle>
                  <Text size="lg" color="muted" className="mt-2">$0 / month — forever</Text>
                  <Text size="sm" color="muted" className="mt-1">Perfect for solo founders</Text>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-left">
                    {[
                      '1 profile at yourname.unool.co',
                      '12 posts/month across all platforms',
                      'LinkedIn, X, Threads publishing',
                      'AI adaptation for each platform',
                      '5 professional themes',
                      'Magic link authentication',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/signup">Start Free</Link>
                  </Button>
                </CardContent>
              </Card>
            </MotionBox>

            {/* Pro Tier */}
            <MotionBox variant="slide-up" delay={0.1}>
              <Card className="border-primary bg-primary/5 relative overflow-hidden h-full" style={{ boxShadow: 'var(--shadow-glow)' }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500" />
                <CardHeader className="text-center">
                  <Badge variant="secondary" className="mb-2">Most Popular</Badge>
                  <CardTitle className="text-2xl font-semibold">Pro</CardTitle>
                  <Text size="lg" color="muted" className="mt-2">$19 / month</Text>
                  <Text size="sm" color="muted" className="mt-1">For growing creators & teams</Text>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-left">
                    {[
                      'Everything in Free, plus:',
                      '300 posts/month',
                      '10 connected accounts',
                      '100 scheduled posts',
                      '5 team members',
                      'Advanced analytics & insights',
                      'Custom domains (coming soon)',
                      'Priority support',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link href="/signup">Upgrade to Pro</Link>
                  </Button>
                </CardContent>
              </Card>
            </MotionBox>

            {/* Enterprise Tier */}
            <MotionBox variant="slide-up" delay={0.2}>
              <Card className="border-muted hover:border-primary/30 transition-all duration-300 h-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold">Enterprise</CardTitle>
                  <Text size="lg" color="muted" className="mt-2">Custom pricing</Text>
                  <Text size="sm" color="muted" className="mt-1">For organizations at scale</Text>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-left">
                    {[
                      'Everything in Pro, plus:',
                      'Unlimited posts & accounts',
                      '50+ team members',
                      '1,000 scheduled posts',
                      'SSO & advanced security',
                      'Dedicated success manager',
                      'Custom integrations & API access',
                      'SLA & compliance support',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/signup">Contact Sales</Link>
                  </Button>
                </CardContent>
              </Card>
            </MotionBox>
          </MotionGrid>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section size="xl" className="bg-primary text-primary-foreground relative overflow-hidden">
        <MorphingBlob className="absolute top-1/4 right-1/4 w-96 h-96 opacity-20" />
        <Container size="lg">
          <MotionStack space={6} className="text-center max-w-2xl mx-auto relative z-10" stagger={stagger.normal} direction="up">
            <MotionBox variant="fade">
              <Badge variant="secondary" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
                Ready to unify your presence?
              </Badge>
            </MotionBox>
            <MotionBox variant="slide-up">
              <Display size="2xl" weight="extrabold">Join founders who&apos;ve replaced Linktree + Buffer + Notion with one workflow.</Display>
            </MotionBox>
            <Flex gap={4} className="justify-center" style={{ flexWrap: 'wrap' }}>
              <MotionBox variant="scale">
                <Button asChild size="lg" variant="secondary" className="group w-full sm:w-auto">
                  <Link href="/signup">
                    Start Free &mdash; Magic Link Only
                    <ArrowRight className="w-5 h-5 ml-2 inline-block transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </MotionBox>
              <MotionBox variant="scale" delay={0.05}>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 hover:bg-primary-foreground/10">
                  <Link href="#features">Explore Features</Link>
                </Button>
              </MotionBox>
            </Flex>
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