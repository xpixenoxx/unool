'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers, PerspectiveFlip } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring, slideUp, fadeIn } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Star, TrendingUp, Users, Target, Zap } from 'lucide-react';

export function ProfessionalMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.5 0.22 275)'; // Deep executive purple-blue

  // Compute aggregated stats
  const totalClicks = profile.links.reduce((a, l) => a + l.clicks, 0);
  const activeLinks = profile.links.filter(l => l.isVisible).length;
  const activeProofs = profile.proofs.length;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '14px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Maximum Executive Background */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40" />

        {/* Multi-layer dramatic glows */}
        <div
          className="absolute top-0 left-1/4 w-[900px] h-[900px] rounded-full blur-[350px] opacity-50 -translate-x-1/2"
          style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/5 w-[700px] h-[700px] rounded-full blur-[350px] opacity-40"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}35 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[250px] opacity-30"
          style={{ background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)` }}
        />

        {/* Executive horizontal accent bars - thicker & animated */}
        <MeshAccentBars accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

        {/* Bold grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Corner executive markers */}
        <ExecutiveCornerMarkers accent={accent} secondaryAccent={secondaryAccent} />
      </div>

      {/* Orbital Background - Maximum Executive Density */}
      <OrbitalBackground
        orbCount={10}
        orbSizes={[280, 180, 320, 140, 240, 160, 200, 120, 260, 100]}
        colors={[
          `oklch(0.6 0.2 265 / 0.12)`,
          `oklch(0.55 0.22 275 / 0.11)`,
          `oklch(0.68 0.15 255 / 0.1)`,
          `oklch(0.52 0.24 280 / 0.1)`,
          `oklch(0.72 0.12 250 / 0.08)`,
          `oklch(0.58 0.18 270 / 0.09)`,
          `oklch(0.65 0.16 260 / 0.07)`,
          `oklch(0.5 0.25 285 / 0.07)`,
          `oklch(0.75 0.1 245 / 0.06)`,
          `oklch(0.55 0.2 275 / 0.08)`,
        ]}
        speed={0.15}
        className="pointer-events-none"
      />

      {/* Triple Morphing Blob System - Executive */}
      <MorphingBlob size={550} color={accent} opacity={0.18} speed={0.08} complexity={5} className="absolute top-1/6 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={400} color={secondaryAccent} opacity={0.14} speed={0.06} complexity={4} className="absolute bottom-1/6 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={300} color="oklch(0.55 0.18 260)" opacity={0.1} speed={0.1} complexity={4} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Floating executive geometric shapes */}
      <ExecutiveFloatingShapes accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

      {/* Dashboard Layout: Sidebar + Main */}
      <div className="relative flex min-h-screen max-w-[1200px] mx-auto">
        {/* SIDEBAR - Executive Command Center */}
        <aside className="hidden lg:block w-72 flex-shrink-0 border-r bg-background/60 backdrop-blur-xl" style={{ borderColor: 'var(--border)' }}>
          <Stack space={6} className="p-6 h-full overflow-y-auto">
            {/* Sidebar Profile Header */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.gentle, delay: 0.2 }}
            >
              <Stack space={3} align="center" className="text-center border-b pb-6" style={{ borderColor: 'var(--border)' }}>
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4" ringColor={accent}>
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <motion.div
                    className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2"
                    style={{ background: accent, borderColor: 'var(--background)' }}
                    animate={{ scale: [1, 1.1, 1], boxShadow: [`0 0 0 4px ${accent}20`, `0 0 0 8px ${accent}10`, `0 0 0 4px ${accent}20`] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    aria-label="Active"
                  />
                </div>
                <Stack space={0.5}>
                  <Text weight="semibold" size="base" style={{ fontFamily: 'var(--font-geist)' }}>
                    {profile.name}
                  </Text>
                  {profile.headline && (
                    <Text size="sm" color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist)' }}>
                      {profile.headline}
                    </Text>
                  )}
                </Stack>
              </Stack>

              {/* Navigation */}
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'links', label: 'Links', icon: '🔗' },
                  { id: 'analytics', label: 'Analytics', icon: '📈' },
                  { id: 'proofs', label: 'Proofs', icon: '🏆' },
                  { id: 'settings', label: 'Settings', icon: '⚙️' },
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring.standard, delay: 0.3 + 0.05 * item.id.length }}
                    className="w-full justify-start gap-3 px-3 py-2.5 text-sm rounded-xl transition-all"
                    style={{ fontFamily: 'var(--font-geist)', borderRadius: '10px' }}
                  >
                    <span className="h-5 w-5 flex items-center justify-center" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Quick Stats Card */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.6 }}
              >
                <div className="relative rounded-2xl border p-1 overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="relative p-4 rounded-xl" style={{ background: 'var(--card)' }}>
                    <Text size="xs" weight="medium" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Quick Stats
                    </Text>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {[
                        { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: <MousePointer className="h-4 w-4" /> },
                        { label: 'Active Links', value: activeLinks, icon: <Link2 className="h-4 w-4" /> },
                        { label: 'Proof Points', value: activeProofs, icon: <Award className="h-4 w-4" /> },
                        { label: 'Profile Views', value: '12.4K', icon: <Eye className="h-4 w-4" /> },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center">
                          <Flex center gap={1.5} className="mb-1">
                            <span className="text-muted-foreground" style={{ color: accent }}>{stat.icon}</span>
                            <Text level={3} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                              {stat.value}
                            </Text>
                          </Flex>
                          <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                            {stat.label}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </Stack>
        </aside>

        {/* MAIN CONTENT - Executive Dashboard */}
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto" style={{ maxWidth: 'calc(100% - 18rem)' }}>
          <Stack space={10}>

            {/* HERO SECTION - Executive Hero */}
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.3 }}
              className="max-w-3xl relative"
            >
              <Stack space={3}>
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.4 }}
                >
                  <Badge
                    variant="success"
                    className={cn('gap-2 px-4 py-2.5', isPreview && 'opacity-80')}
                    style={{ fontFamily: 'var(--font-geist)', fontSize: '0.9rem', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})` }}
                  >
                    <motion.span
                      className="h-2 w-2 rounded-full"
                      style={{ background: 'var(--primary-foreground)' }}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    Live Profile
                  </Badge>
                </motion.div>

                <motion.h1
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.5 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight"
                  style={{ fontFamily: 'var(--font-geist)', letterSpacing: '-0.025em' }}
                >
                  <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 40%, ${secondaryAccent} 80%, ${accent} 100%)`, backgroundSize: '300% 300%' }}>
                    {profile.name}
                  </span>
                </motion.h1>

                {profile.headline && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.6 }}
                    className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-2xl"
                    style={{ fontFamily: 'var(--font-geist)', fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    {profile.headline}
                  </motion.p>
                )}

                {/* Subdomain */}
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.7 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mt-2"
                  style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)`, border: `1px solid ${accent}30` }}
                >
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.9rem', color: accent, fontWeight: 700 }}>
                    {profile.subdomain}.unool.co
                  </span>
                </motion.div>
              </Stack>
            </motion.section>

            {/* METRICS DASHBOARD - KPI Grid with TiltCards */}
            {profile.proofs.some(p => p.value) && (
              <motion.section
                initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.5 }}
              >
                <Flex between className="mb-6" wrap gap={4}>
                  <Stack space={1}>
                    <Text weight="bold" size="xl" style={{ fontFamily: 'var(--font-geist)' }}>
                      Performance Metrics
                    </Text>
                    <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                      Real-time tracking across all platforms
                    </Text>
                  </Stack>
                  <Badge variant="ghost" className="gap-1" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                    <TrendingUp className="h-3 w-3" />
                    Live
                  </Badge>
                </Flex>

                <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap={4}>
                  {profile.proofs
                    .filter(p => p.value)
                    .slice(0, 8)
                    .map((proof, index) => (
                      <motion.div
                        key={proof.id}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ ...spring.magnetic, delay: 0.6 + index * 0.08 }}
                      >
                        <TiltCard maxTilt={8} scale={1.03} className="h-full">
                          <div
                            className="relative rounded-2xl border p-1 overflow-hidden h-full"
                            style={{
                              borderColor: `${accent}20`,
                              background: 'var(--card)',
                              boxShadow: `0 2px 12px -2px ${accent}08`,
                            }}
                          >
                            <div className="relative p-5 rounded-xl h-full" style={{ background: 'var(--card)' }}>
                              <Flex between className="mb-4">
                                {proof.icon && <span style={{ fontSize: '1.75rem' }}>{proof.icon}</span>}
                                <Badge variant="secondary" size="sm" style={{ fontFamily: 'var(--font-geist-mono)', background: `${accent}15`, color: accent }}>
                                  KPI
                                </Badge>
                              </Flex>
                              <Flex column gap={1} className="mt-auto">
                                <Text size="3xl" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent, lineHeight: 1 }}>
                                  {proof.value}
                                </Text>
                                <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {proof.title}
                                </Text>
                              </Flex>
                              <Progress
                                value={Math.min(100, Number(proof.value.replace(/[^0-9.]/g, '')) * 10)}
                                className="mt-4 h-1.5"
                                style={{ '--progress-color': accent } as React.CSSProperties}
                              />
                            </div>
                          </div>
                        </TiltCard>
                      </motion.div>
                    ))}
                </Grid>
              </motion.section>
            )}

            {/* BIO SECTION - Executive Glassmorphism Card */}
            {profile.bio && (
              <motion.section
                initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.7 }}
              >
                <ParallaxLayers strength={15} className="w-full">
                  <div className="relative w-full">
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: `linear-gradient(135deg, ${accent}08 0%, ${secondaryAccent}06 100%)`, filter: 'blur(1px)' }}
                    />
                    <div
                      className="relative rounded-2xl border p-1.5 overflow-hidden"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--card)',
                        boxShadow: `0 0 0 1px ${accent}10, 0 20px 60px -20px ${accent}20`,
                      }}
                    >
                      <div className="relative p-7 sm:p-8 rounded-xl" style={{ background: 'var(--card)' }}>
                        <Text size="lg" color="foreground" style={{ lineHeight: 1.9, fontFamily: 'var(--font-geist)', fontSize: '1.1rem' }}>
                          {profile.bio}
                        </Text>
                      </div>
                    </div>
                  </div>
                </ParallaxLayers>
              </motion.section>
            )}

            {/* LINKS MANAGEMENT TABLE - Professional Data Table with Magnetic Cards */}
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.8 }}
            >
              <Flex between className="mb-6" wrap gap={4}>
                <Stack space={1}>
                  <Text weight="bold" size="xl" style={{ fontFamily: 'var(--font-geist)' }}>
                    Links Management
                  </Text>
                  <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                    {activeLinks} active links · {totalClicks.toLocaleString()} total clicks
                  </Text>
                </Stack>
                <Badge variant="ghost" className="gap-1" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                  <MousePointer className="h-3 w-3" />
                  {activeLinks} active
                </Badge>
              </Flex>

              <div className="relative rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontFamily: 'var(--font-geist)' }}>
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border)', background: `linear-gradient(90deg, ${accent}04, transparent)` }}>
                        <th className="px-5 py-4 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Link</th>
                        <th className="px-5 py-4 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Clicks</th>
                        <th className="px-5 py-4 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Status</th>
                        <th className="px-5 py-4 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.links
                        .filter(l => l.isVisible)
                        .slice(0, 15)
                        .map((link, index) => (
                          <tr
                            key={link.id}
                            className="border-b transition-colors hover:bg-primary/3"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <td className="px-5 py-4">
                              <MagneticCard
                                radius={80}
                                strength={0.15}
                                className={cn('inline-block', isPreview && 'opacity-80')}
                                style={{
                                  borderRadius: '10px',
                                  border: '1px solid transparent',
                                  background: 'transparent',
                                }}
                              >
                                <button
                                  onClick={() => onLinkClick?.(link)}
                                  className="relative flex items-center gap-3 px-1 py-1 text-left"
                                  style={{ borderRadius: '10px', fontFamily: 'var(--font-geist)' }}
                                >
                                  <motion.div
                                    initial={reducedMotion ? {} : { scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ ...spring.bouncy, delay: index * 0.04 }}
                                    className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: '10px',
                                      background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                                      color: 'var(--primary-foreground)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 600,
                                      fontSize: '1rem',
                                      boxShadow: `0 4px 16px -4px ${accent}`,
                                    }}
                                  >
                                    {link.icon || link.label.charAt(0).toUpperCase()}
                                  </motion.div>
                                  <Flex column gap={1.5} className="min-w-0">
                                    <motion.span
                                      initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ ...spring.gentle, delay: index * 0.03 }}
                                      className="font-medium truncate group-hover:text-primary transition-colors"
                                      style={{ fontFamily: 'var(--font-geist)', fontSize: '0.95rem' }}
                                    >
                                      {link.label}
                                    </motion.span>
                                    <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)', maxWidth: '250px' }}>
                                      {link.url}
                                    </Text>
                                  </Flex>
                                </button>
                              </MagneticCard>
                            </td>
                            <td className="px-5 py-4">
                              <Text weight="medium" size="sm" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                                {link.clicks.toLocaleString()}
                              </Text>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant="success" size="sm" style={{ fontFamily: 'var(--font-geist)', background: `${accent}15`, color: accent }}>
                                Active
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => onLinkClick?.(link)}
                                className="p-2 rounded-xl hover:bg-primary/5 transition-colors"
                                style={{ fontFamily: 'var(--font-geist)' }}
                                aria-label="Open link"
                              >
                                <span className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" aria-hidden="true">→</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.section>

            {/* VERIFIED PROOF POINTS - PerspectiveFlip Cards */}
            {profile.proofs.length > 0 && (
              <motion.section
                initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.9 }}
              >
                <Flex between className="mb-6" wrap gap={4}>
                  <Stack space={1}>
                    <Text weight="bold" size="xl" style={{ fontFamily: 'var(--font-geist)' }}>
                      Verified Proof Points
                    </Text>
                    <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                      {activeProofs} verified achievements & credentials
                    </Text>
                  </Stack>
                  <Badge variant="ghost" className="gap-1" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                    <Award className="h-3 w-3" />
                    Verified
                  </Badge>
                </Flex>

                <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {profile.proofs
                    .slice(0, 10)
                    .map((proof, index) => (
                      <AnimatePresence key={proof.id}>
                        <motion.div
                          initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ ...spring.bouncy, delay: 0.8 + index * 0.08 }}
                        >
                          <PerspectiveFlip axis="y" trigger="hover" duration={0.6}>
                            <div className="relative w-full" style={{ perspective: 1000 }}>
                              <TiltCard
                                maxTilt={5}
                                scale={1.02}
                                className="h-full"
                                style={{
                                  borderRadius: '14px',
                                  border: `1px solid ${accent}25`,
                                  background: `linear-gradient(145deg, var(--card) 0%, ${accent}06 100%)`,
                                  boxShadow: `0 0 0 1px ${accent}10, 0 8px 32px -8px ${accent}15`,
                                }}
                              >
                                <div className="p-5 h-full flex flex-col">
                                  <Flex between className="mb-3">
                                    {proof.icon && (
                                      <motion.div
                                        initial={reducedMotion ? {} : { scale: 0, rotate: -120 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ ...spring.bouncy, delay: 0.9 + index * 0.1 }}
                                        className="flex-shrink-0 group-hover:rotate-6 transition-transform duration-400"
                                        style={{
                                          width: 44,
                                          height: 44,
                                          borderRadius: '12px',
                                          background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                                          color: 'var(--primary-foreground)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '1.35rem',
                                          boxShadow: `0 6px 24px -6px ${accent}`,
                                        }}
                                      >
                                        {proof.icon}
                                      </motion.div>
                                    )}
                                    <Badge
                                      variant="ghost"
                                      size="sm"
                                      style={{ fontFamily: 'var(--font-geist-mono)', color: accent, background: `${accent}10` }}
                                    >
                                      #{index + 1}
                                    </Badge>
                                  </Flex>
                                  <Flex column gap={2} flex={1} className="min-w-0">
                                    <Text weight="semibold" size="base" style={{ fontFamily: 'var(--font-geist)' }}>
                                      {proof.title}
                                    </Text>
                                    {proof.value && (
                                      <Text size="lg" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                                        {proof.value}
                                      </Text>
                                    )}
                                  </Flex>
                                </div>
                              </TiltCard>
                            </div>
                          </PerspectiveFlip>
                        </motion.div>
                      </AnimatePresence>
                    ))}
                </Grid>
              </motion.section>
            )}

          </Stack>
        </main>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function MeshAccentBars({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  return (
    <>
      <motion.div
        className="absolute top-1/5 left-0 right-0 h-1.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}60, ${secondaryAccent}40, transparent)`,
          opacity: 0.4,
          transformOrigin: 'center',
        }}
        initial={reducedMotion ? {} : { scaleX: 0 }}
        animate={{ scaleX: [1, 1.02, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/5 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent, ${secondaryAccent}40, ${accent}30, transparent)`,
          opacity: 0.3,
          transformOrigin: 'center',
        }}
        initial={reducedMotion ? {} : { scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [1, 1.01, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </>
  );
}

function ExecutiveCornerMarkers({ accent, secondaryAccent }: { accent: string; secondaryAccent: string }) {
  return (
    <>
      <div
        className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accent}30 0%, transparent 50%)`,
          maskImage: 'linear-gradient(135deg, black 50%, transparent 50%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(-45deg, ${secondaryAccent}25 0%, transparent 50%)`,
          maskImage: 'linear-gradient(-45deg, black 50%, transparent 50%)',
        }}
      />
      <div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accent}20 0%, transparent 70%)` }}
      />
      <div
        className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none"
        style={{ background: `radial-gradient(circle at bottom left, ${secondaryAccent}15 0%, transparent 70%)` }}
      />
    </>
  );
}

function ExecutiveFloatingShapes({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  const shapes: Array<{ type: 'circle' | 'square' | 'diamond'; x: number; y: number; size: number; color: string; delay: number }> = [
    { type: 'diamond', x: 8, y: 12, size: 20, color: accent, delay: 0 },
    { type: 'circle', x: 88, y: 18, size: 16, color: secondaryAccent, delay: 1 },
    { type: 'square', x: 15, y: 82, size: 14, color: accent, delay: 2 },
    { type: 'diamond', x: 85, y: 78, size: 18, color: secondaryAccent, delay: 3 },
    { type: 'circle', x: 50, y: 5, size: 12, color: accent, delay: 0.5 },
    { type: 'square', x: 92, y: 50, size: 10, color: secondaryAccent, delay: 1.5 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25" aria-hidden="true">
      {shapes.map((shape, i) => (
        <ExecutiveShape key={i} {...shape} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function ExecutiveShape({ type, x, y, size, color, delay, reducedMotion }: { type: 'diamond' | 'circle' | 'square'; x: number; y: number; size: number; color: string; delay: number; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.4,
  };

  const shapeStyle: React.CSSProperties = {
    width: size,
    height: size,
    ...(type === 'diamond' && { width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}` }),
    ...(type === 'square' && { background: color, borderRadius: '3px' }),
    ...(type === 'circle' && { background: color, borderRadius: '50%' }),
  };

  if (reducedMotion) {
    return <div className="absolute" style={style}><div style={shapeStyle} /></div>;
  }

  return (
    <motion.div
      style={style}
      animate={{
        y: [-12, 12, -12],
        x: [-8, 8, -8],
        rotate: type === 'circle' ? 0 : [0, 360],
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div style={shapeStyle} />
    </motion.div>
  );
}

// Icon components
function MousePointer({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="7" />
      <path d="M12 6v12" />
    </svg>
  );
}

function Link2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function Award({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

ProfessionalMaxTemplate.displayName = 'ProfessionalMaxTemplate';
