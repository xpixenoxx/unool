'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers, PerspectiveFlip, OrbitalParticles } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text, Display } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Star, Sparkles, Zap, Target, Award, TrendingUp, Users, Globe, Music, Palette, Zap as ZapIcon } from 'lucide-react';

export function CreativeMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.6 0.32 340)'; // Max creative magenta
  const tertiaryAccent = 'oklch(0.68 0.28 60)'; // Creative gold
  const quaternaryAccent = 'oklch(0.55 0.28 280)'; // Creative purple

  // Stats computation
  const totalClicks = profile.links.reduce((a, l) => a + l.clicks, 0);
  const activeLinks = profile.links.filter(l => l.isVisible).length;
  const totalProofs = profile.proofs.length;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '0',
        fontFamily: 'var(--font-syne)',
      } as React.CSSProperties}
    >
      {/* CREATIVE MAX - Full Bleed Immersive Background */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        {/* Multi-layer gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 15% 15%, ${accent}20 0%, transparent 50%),
              radial-gradient(ellipse at 85% 85%, ${secondaryAccent}18 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, ${tertiaryAccent}12 0%, transparent 40%),
              radial-gradient(ellipse at 80% 20%, ${quaternaryAccent}15 0%, transparent 45%),
              var(--background)
            `,
          }}
        />

        {/* Quad glow layers - massive impact */}
        <div
          className="absolute top-0 left-1/4 w-[1000px] h-[1000px] rounded-full blur-[450px] opacity-60 -translate-x-1/2"
          style={{ background: `radial-gradient(ellipse at center, ${accent}50 0%, transparent 55%)` }}
        />
        <div
          className="absolute bottom-0 right-1/5 w-[800px] h-[800px] rounded-full blur-[450px] opacity-55"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}45 0%, transparent 55%)` }}
        />
        <div
          className="absolute top-0 right-1/5 w-[600px] h-[600px] rounded-full blur-[350px] opacity-45"
          style={{ background: `radial-gradient(ellipse at center, ${tertiaryAccent}40 0%, transparent 55%)` }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[350px] opacity-40"
          style={{ background: `radial-gradient(ellipse at center, ${quaternaryAccent}35 0%, transparent 55%)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[350px] opacity-35"
          style={{ background: `radial-gradient(circle, ${accent}35 0%, transparent 60%)` }}
        />

        {/* Creative Max immersive pattern */}
        <CreativeMaxPattern accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} quaternaryAccent={quaternaryAccent} />

        {/* Top thick animated bar */}
        <CreativeMaxTopBar accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} quaternaryAccent={quaternaryAccent} reducedMotion={reducedMotion} />
      </div>

      {/* Orbital Background - MAXIMUM Creative Orbs */}
      <OrbitalBackground
        orbCount={18}
        orbSizes={[350, 240, 380, 180, 280, 200, 260, 140, 300, 120, 220, 160, 320, 100, 240, 180, 200, 80]}
        colors={[
          `oklch(0.7 0.32 340 / 0.22)`,
          `oklch(0.68 0.28 20 / 0.2)`,
          `oklch(0.72 0.25 300 / 0.18)`,
          `oklch(0.68 0.28 60 / 0.16)`,
          `oklch(0.75 0.22 320 / 0.15)`,
          `oklch(0.8 0.2 70 / 0.14)`,
          `oklch(0.7 0.26 340 / 0.13)`,
          `oklch(0.68 0.3 350 / 0.12)`,
          `oklch(0.78 0.18 25 / 0.11)`,
          `oklch(0.7 0.28 60 / 0.1)`,
          `oklch(0.62 0.32 340 / 0.1)`,
          `oklch(0.75 0.2 30 / 0.09)`,
          `oklch(0.58 0.3 290 / 0.09)`,
          `oklch(0.72 0.22 330 / 0.08)`,
          `oklch(0.65 0.26 340 / 0.08)`,
          `oklch(0.6 0.28 270 / 0.07)`,
          `oklch(0.75 0.2 20 / 0.07)`,
          `oklch(0.62 0.28 300 / 0.06)`,
        ]}
        speed={0.3}
        className="pointer-events-none"
      />

      {/* Quad Morphing Blob System - MAX Creative */}
      <MorphingBlob size={650} color={accent} opacity={0.32} speed={0.16} complexity={7} className="absolute top-1/8 left-1/6 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={500} color={secondaryAccent} opacity={0.28} speed={0.14} complexity={6} className="absolute bottom-1/8 right-1/6 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={420} color={tertiaryAccent} opacity={0.24} speed={0.12} complexity={6} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={350} color={quaternaryAccent} opacity={0.2} speed={0.1} complexity={5} className="absolute bottom-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Orbital Particles - Creative Max */}
      <OrbitalParticles
        particleCount={80}
        colors={[
          `oklch(0.7 0.32 340)`,
          `oklch(0.68 0.28 20)`,
          `oklch(0.7 0.28 60)`,
          `oklch(0.55 0.28 280)`,
        ]}
        speed={0.5}
        sizeRange={[1, 3.5]}
        className="pointer-events-none opacity-50"
      />

      {/* Floating geometric showcase shapes */}
      <CreativeMaxFloatingShapes accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} quaternaryAccent={quaternaryAccent} reducedMotion={reducedMotion} />

      <ParallaxLayers strength={35} className="relative max-w-[1300px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-syne)' }}>
        <Stack space={16}>

          {/* HERO SECTION - Maximum Impact Creative */}
          <motion.section
            initial={reducedMotion ? {} : { opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.2 }}
            className="relative"
          >
            <Stack space={6} align="center" className="text-center">
              <div className="relative">
                {/* Multi-layer ambient glow */}
                <motion.div
                  className="absolute -inset-10 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)` }}
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -inset-16 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${secondaryAccent}25 0%, transparent 70%)` }}
                  animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
                <motion.div
                  className="absolute -inset-20 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${tertiaryAccent}15 0%, transparent 70%)` }}
                  animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.08, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />

                <Avatar className="h-40 md:h-44 w-40 md:w-44 ring-4 relative z-10" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="text-6xl md:text-7xl font-black" style={{ fontFamily: 'var(--font-syne)' }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Animated conic gradient status ring */}
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...spring.bouncy, delay: 0.6 }}
                  className="absolute -bottom-4 -right-4 md:-bottom-5 md:-right-5 h-12 md:h-14 w-12 md:w-14 rounded-full border-4 flex items-center justify-center"
                  style={{
                    background: `conic-gradient(from 0deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent}, ${quaternaryAccent}, ${accent})`,
                    borderColor: 'var(--background)',
                    boxShadow: `0 12px 48px -12px ${accent}`,
                  }}
                  aria-label="Creative Max Live"
                >
                  <motion.div
                    className="h-5 md:h-6 w-5 md:w-6 rounded-full"
                    style={{ background: 'var(--primary-foreground)' }}
                    animate={{ scale: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>

                {/* Triple orbit rings */}
                <motion.div
                  className="absolute -top-8 -left-8 -right-8 -bottom-8 rounded-full pointer-events-none"
                  style={{ border: `3px solid ${accent}40` }}
                  animate={{ rotate: reducedMotion ? 0 : -360, scale: [1, 1.02, 1] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear', delay: 1 }}
                />
                <motion.div
                  className="absolute -top-16 -left-16 -right-16 -bottom-16 rounded-full pointer-events-none"
                  style={{ border: `2px solid ${secondaryAccent}25` }}
                  animate={{ rotate: reducedMotion ? 0 : 360, scale: [1, 1.015, 1] }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: 2 }}
                />
                <motion.div
                  className="absolute -top-24 -left-24 -right-24 -bottom-24 rounded-full pointer-events-none"
                  style={{ border: `1px solid ${tertiaryAccent}15` }}
                  animate={{ rotate: reducedMotion ? 0 : -360, scale: [1, 1.01, 1] }}
                  transition={{ duration: 35, repeat: Infinity, ease: 'linear', delay: 3 }}
                />
              </div>

              <Stack space={4} align="center">
                <motion.h1
                  initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.3 }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight"
                  style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.045em' }}
                >
                  <span style={{ background: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 20%, ${secondaryAccent} 40%, ${tertiaryAccent} 60%, ${quaternaryAccent} 80%, ${accent} 100%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '500% 500%' }}>
                    {profile.name}
                  </span>
                </motion.h1>

                {profile.headline && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.4 }}
                    className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-medium max-w-3xl"
                    style={{ fontFamily: 'var(--font-geist)', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.3 }}
                  >
                    {profile.headline}
                  </motion.p>
                )}
              </Stack>

              {/* MAX Status Badge Row */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 25, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...spring.bouncy, delay: 0.5 }}
              >
                <Flex gap={3} className="flex-wrap justify-center">
                  <CreativeMaxBadge
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Creative Visionary"
                    gradient={`linear-gradient(135deg, ${accent}, ${secondaryAccent})`}
                    style={{ fontFamily: 'var(--font-syne)', fontSize: '1rem' }}
                  />
                  <CreativeMaxBadge
                    variant="outline"
                    icon={<Globe className="h-4 w-4" />}
                    label={`${activeLinks} Curated Links`}
                    borderColor={accent}
                  />
                  <CreativeMaxBadge
                    variant="outline"
                    icon={<Award className="h-4 w-4" />}
                    label={`${totalProofs} Verified Proofs`}
                    borderColor={secondaryAccent}
                  />
                  <CreativeMaxBadge
                    variant="outline"
                    icon={<TrendingUp className="h-4 w-4" />}
                    label={`${totalClicks.toLocaleString()} Total Clicks`}
                    borderColor={tertiaryAccent}
                  />
                </Flex>
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 animate-bounce"
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                aria-hidden="true"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}20, ${secondaryAccent}15)`, border: `1px solid ${accent}30` }}>
                  <svg className="h-5 w-5 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
              </motion.div>
            </Stack>
          </motion.section>

          {/* BIO SECTION - Full Width Immersive */}
          {profile.bio && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.6 }}
            >
              <ParallaxLayers strength={30} className="w-full">
                <div className="relative w-full max-w-5xl mx-auto">
                  <div
                    className="absolute inset-0 rounded-3xl"
                    style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${secondaryAccent}15 30%, ${tertiaryAccent}12 60%, ${quaternaryAccent}10 100%)`, filter: 'blur(3px)' }}
                  />
                  <div
                    className="relative rounded-3xl border p-2.5 overflow-hidden"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--card)',
                      boxShadow: `0 0 0 2px ${accent}15, 0 32px 100px -32px ${accent}30`,
                    }}
                  >
                    <div className="relative p-10 md:p-14 rounded-2xl" style={{ background: 'var(--card)' }}>
                      <Text size="2xl" md="3xl" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-syne)', fontWeight: 400, textAlign: 'center', fontSize: 'clamp(1.25rem, 3vw, 2rem)' }}>
                        {profile.bio}
                      </Text>
                    </div>
                  </div>
                </div>
              </ParallaxLayers>
            </motion.section>
          )}

          {/* FEATURED LINKS - Creative Max Grid */}
          {profile.links.length > 0 && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.7 }}
            >
              <Flex between className="mb-10" wrap gap={4}>
                <Stack space={1}>
                  <Text weight="bold" size="2xl" style={{ fontFamily: 'var(--font-syne)' }}>
                    Featured Work
                  </Text>
                  <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                    {activeLinks} active creative links · {totalClicks.toLocaleString()} total engagements
                  </Text>
                </Stack>
                <CreativeMaxBadge
                  variant="ghost"
                  icon={<ZapIcon className="h-4 w-4" />}
                  label="Live"
                  textColor={accent}
                />
              </Flex>

              <Grid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={6}>
                <AnimatePresence>
                  {profile.links
                    .filter(l => l.isVisible)
                    .slice(0, 20)
                    .map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.85, y: 50, rotate: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -40 }}
                        transition={{ ...spring.magnetic, delay: 0.8 + index * 0.06 }}
                      >
                        {/* 4 card type rotation for visual variety */}
                        {(() => {
                          const type = index % 4;
                          if (type === 0) {
                            return (
                              <TiltCard
                                maxTilt={15}
                                scale={1.035}
                                className={cn('h-full', isPreview && 'opacity-80')}
                                style={{
                                  borderRadius: '20px',
                                  border: `1px solid ${accent}35`,
                                  background: `linear-gradient(145deg, var(--card) 0%, ${accent}12 100%)`,
                                  boxShadow: `0 0 0 2px ${accent}15, 0 20px 80px -20px ${accent}35`,
                                }}
                              >
                                <CreativeMaxLinkCard link={link} accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="tilt-1" reducedMotion={reducedMotion} />
                              </TiltCard>
                            );
                          }
                          if (type === 1) {
                            return (
                              <MagneticCard
                                radius={40}
                                strength={0.3}
                                className={cn('h-full', isPreview && 'opacity-80')}
                                style={{
                                  borderRadius: '20px',
                                  border: `1px solid ${secondaryAccent}30`,
                                  background: `linear-gradient(135deg, var(--card) 0%, ${secondaryAccent}12 100%)`,
                                  boxShadow: `0 12px 48px -12px ${accent}20`,
                                }}
                              >
                                <CreativeMaxLinkCard link={link} accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="magnetic" reducedMotion={reducedMotion} />
                              </MagneticCard>
                            );
                          }
                          if (type === 2) {
                            return (
                              <PerspectiveFlip axis="y" trigger="hover" duration={0.7}>
                                <div className="relative w-full" style={{ perspective: 1000 }}>
                                  <TiltCard
                                    maxTilt={8}
                                    scale={1.025}
                                    className={cn('h-full', isPreview && 'opacity-80')}
                                    style={{
                                      borderRadius: '20px',
                                      border: `1px solid ${tertiaryAccent}30`,
                                      background: `linear-gradient(145deg, var(--card) 0%, ${tertiaryAccent}10 100%)`,
                                      boxShadow: `0 0 0 2px ${tertiaryAccent}15, 0 16px 64px -16px ${secondaryAccent}25`,
                                    }}
                                  >
                                    <CreativeMaxLinkCard link={link} accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="perspective" reducedMotion={reducedMotion} />
                                  </TiltCard>
                                </div>
                              </PerspectiveFlip>
                            );
                          }
                          return (
                            <PerspectiveFlip axis="x" trigger="hover" duration={0.6}>
                              <div className="relative w-full" style={{ perspective: 1000 }}>
                                <MagneticCard
                                  radius={50}
                                  strength={0.25}
                                  className={cn('h-full', isPreview && 'opacity-80')}
                                  style={{
                                    borderRadius: '20px',
                                    border: `1px solid ${quaternaryAccent}30`,
                                    background: `linear-gradient(145deg, var(--card) 0%, ${quaternaryAccent}10 100%)`,
                                    boxShadow: `0 0 0 2px ${quaternaryAccent}15, 0 12px 48px -12px ${accent}20`,
                                  }}
                                >
                                  <CreativeMaxLinkCard link={link} accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="featured" reducedMotion={reducedMotion} />
                                </MagneticCard>
                              </div>
                            </PerspectiveFlip>
                          );
                        })()}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </Grid>
            </motion.section>
          )}

          {/* PROOF POINTS - Creative Max Showcase */}
          {profile.proofs.length > 0 && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.8 }}
            >
              <Flex between className="mb-10" wrap gap={4}>
                <Stack space={1}>
                  <Text weight="bold" size="2xl" style={{ fontFamily: 'var(--font-syne)' }}>
                    Verified Achievements
                  </Text>
                  <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                    {totalProofs} creative trust signals & social proof
                  </Text>
                </Stack>
                <CreativeMaxBadge variant="ghost" icon={<Star className="h-4 w-4" />} label="Showcase" textColor={accent} />
              </Flex>

              <Grid cols={{ base: 1, md: 2, lg: 3, xl: 4 }} gap={6}>
                <AnimatePresence>
                  {profile.proofs
                    .slice(0, 12)
                    .map((proof, idx) => (
                      <motion.div
                        key={proof.id}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.85, y: 50, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -40 }}
                        transition={{ ...spring.bouncy, delay: 0.9 + idx * 0.07 }}
                      >
                        <PerspectiveFlip axis={idx % 2 === 0 ? 'y' : 'x'} trigger="hover" duration={0.6}>
                          <div className="relative w-full" style={{ perspective: 1000 }}>
                            <TiltCard
                              maxTilt={10}
                              scale={1.025}
                              className="h-full"
                              style={{
                                borderRadius: '20px',
                                border: `1px solid ${idx % 3 === 0 ? `${accent}35` : idx % 3 === 1 ? `${secondaryAccent}35` : `${tertiaryAccent}35`}`,
                                background: idx % 3 === 0
                                  ? `linear-gradient(145deg, var(--card) 0%, ${accent}12 100%)`
                                  : idx % 3 === 1
                                  ? `linear-gradient(145deg, var(--card) 0%, ${secondaryAccent}12 100%)`
                                  : `linear-gradient(145deg, var(--card) 0%, ${tertiaryAccent}10 100%)`,
                                boxShadow: `0 0 0 2px ${idx % 3 === 0 ? `${accent}15` : idx % 3 === 1 ? `${secondaryAccent}15` : `${tertiaryAccent}15`}, 0 16px 64px -16px ${idx % 3 === 0 ? `${accent}30` : idx % 3 === 1 ? `${secondaryAccent}30` : `${tertiaryAccent}30`}`,
                              }}
                            >
                              <CreativeMaxProofCard proof={proof} accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} quaternaryAccent={quaternaryAccent} index={idx} reducedMotion={reducedMotion} />
                            </TiltCard>
                          </div>
                        </PerspectiveFlip>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </Grid>
            </motion.section>
          )}

          {/* FOOTER - Creative Subdomain */}
          <motion.footer
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 1.2 }}
            className="relative pt-16 border-t text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <Stack space={4} align="center">
              <Box
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}12, ${tertiaryAccent}10)`,
                  border: `1px solid ${accent}35`,
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '1rem',
                  color: accent,
                  fontWeight: 700,
                }}
              >
                {profile.subdomain}.unool.co
              </Box>
              <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                Built with <span style={{ color: accent, fontWeight: 600 }}>unool</span> — Creative links, reimagined.
              </Text>
              <Flex gap={4} className="flex-wrap justify-center">
                {profile.socialHandles?.twitter && (
                  <a href={`https://twitter.com/${profile.socialHandles.twitter}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                  </a>
                )}
                {profile.socialHandles?.github && (
                  <a href={`https://github.com/${profile.socialHandles.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                )}
                {profile.socialHandles?.linkedin && (
                  <a href={`https://linkedin.com/in/${profile.socialHandles.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                )}
              </Flex>
            </Stack>
          </motion.footer>
        </Stack>
      </ParallaxLayers>
    </div>
  );
}

// ==================== CREATIVE MAX COMPONENTS ====================

function CreativeMaxLinkCard({
  link,
  accent,
  secondaryAccent,
  tertiaryAccent,
  index,
  onClick,
  isPreview = false,
  variant,
  reducedMotion,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  index: number;
  onClick?: (link: TemplateProps['profile']['links'][0]) => void;
  isPreview?: boolean;
  variant: 'tilt-1' | 'magnetic' | 'perspective' | 'featured';
  reducedMotion: boolean;
}) {
  const colors = { 'tilt-1': accent, magnetic: secondaryAccent, perspective: tertiaryAccent, featured: 'oklch(0.55 0.28 280)' };
  const color = colors[variant];

  return (
    <button
      onClick={() => onClick?.(link)}
      className="relative w-full h-full px-6 py-6 text-left group overflow-hidden"
      style={{ borderRadius: '18px', fontFamily: 'var(--font-syne)' }}
    >
      {/* Animated left accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-2"
        style={{ background: `linear-gradient(180deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`, borderRadius: '18px 0 0 18px', transformOrigin: 'bottom' }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 + index * 0.06 }}
      />

      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 -rotate-6 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${color}12, transparent)` }}
        whileHover={{ x: '250%' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          boxShadow: `0 0 0 3px ${color}30, 0 20px 80px -20px ${color}25`,
          borderRadius: '18px',
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Flex column gap={3} className="relative z-10 h-full">
        <Flex align="center" gap={4}>
          <motion.div
            initial={reducedMotion ? {} : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...spring.bouncy, delay: index * 0.06 }}
            className="flex-shrink-0 group-hover:scale-115 group-hover:rotate-10 transition-transform duration-500"
            style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`,
              color: 'var(--primary-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.5rem',
              boxShadow: `0 10px 40px -10px ${accent}`,
              fontFamily: 'var(--font-syne)',
            }}
          >
            {link.icon || link.label.charAt(0).toUpperCase()}
          </motion.div>
          <Flex column gap={1} flex={1} className="min-w-0">
            <motion.span
              initial={reducedMotion ? {} : { x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ ...spring.gentle, delay: index * 0.04 }}
              className="font-semibold truncate group-hover:text-primary transition-colors"
              style={{ fontFamily: 'var(--font-syne)', fontSize: '1.15rem' }}
            >
              {link.label}
            </motion.span>
            <Text size="xs" color="muted" className="truncate font-mono max-w-[200px]" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              {link.url}
            </Text>
          </Flex>
        </Flex>

        <Flex between centerY className="mt-auto pt-4 border-t flex-1" style={{ borderColor: 'var(--border)' }}>
          <Flex align="center" gap={2}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: color }}>
              {link.clicks.toLocaleString()}
            </Text>
            <Text size="xs" color="muted">clicks</Text>
          </Flex>
          <Badge
            variant="default"
            size="sm"
            className="group-hover:scale-105 transition-transform"
            style={{ fontFamily: 'var(--font-syne)', fontSize: '0.75rem', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})` }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </button>
  );
}

function CreativeMaxProofCard({
  proof,
  accent,
  secondaryAccent,
  tertiaryAccent,
  quaternaryAccent,
  index,
  reducedMotion,
}: {
  proof: TemplateProps['profile']['proofs'][0];
  accent: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  quaternaryAccent: string;
  index: number;
  reducedMotion: boolean;
}) {
  const colors = [accent, secondaryAccent, tertiaryAccent, quaternaryAccent];
  const color = colors[index % 4];

  return (
    <div className="p-7 h-full flex flex-col">
      <Flex between className="mb-4">
        {proof.icon && (
          <motion.div
            initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...spring.bouncy, delay: 1 + index * 0.1 }}
            className="flex-shrink-0 group-hover:rotate-15 transition-transform duration-500"
            style={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
              color: 'var(--primary-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: `0 10px 40px -10px ${accent}`,
            }}
          >
            {proof.icon}
          </motion.div>
        )}
        <Badge
          variant="ghost"
          size="sm"
          style={{ fontFamily: 'var(--font-syne)', color: accent, background: `${accent}10` }}
        >
          #{index + 1}
        </Badge>
      </Flex>
      <Flex column gap={2} flex={1} className="min-w-0">
        <Text weight="semibold" size="base" style={{ fontFamily: 'var(--font-syne)' }}>
          {proof.title}
        </Text>
        {proof.value && (
          <Text size="2xl" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color }}>
            {proof.value}
          </Text>
        )}
      </Flex>
      {proof.value && (
        <div className="mt-4 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
          <motion.div
            initial={reducedMotion ? {} : { width: 0 }}
            animate={{ width: `${Math.min(100, Number(proof.value.replace(/[^0-9.]/g, '')) * (index % 3 + 1) * 5)}%` }}
            transition={{ ...spring.gentle, delay: 1.2 + index * 0.1 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${colors[(index + 1) % 4]})` }}
          />
        </div>
      )}
    </div>
  );
}

function CreativeMaxBadge({
  icon,
  label,
  variant = 'default',
  gradient,
  borderColor,
  textColor,
  style,
}: {
  icon?: React.ReactNode;
  label: string;
  variant?: 'default' | 'outline' | 'ghost';
  gradient?: string;
  borderColor?: string;
  textColor?: string;
  style?: React.CSSProperties;
}) {
  if (variant === 'default') {
    return (
      <Badge
        variant="default"
        className={cn('gap-2 px-5 py-2.5', style)}
        style={{
          fontFamily: 'var(--font-syne)',
          fontSize: '0.9375rem',
          background: gradient || `linear-gradient(135deg, var(--color-primary), var(--color-primary))`,
          ...style,
        }}
      >
        {icon}
        {label}
      </Badge>
    );
  }
  if (variant === 'outline') {
    return (
      <Badge
        variant="outline"
        className={cn('gap-2 px-5 py-2.5', style)}
        style={{
          fontFamily: 'var(--font-geist)',
          borderColor: borderColor || 'var(--border)',
          ...style,
        }}
      >
        {icon}
        {label}
      </Badge>
    );
  }
  return (
    <Badge
      variant="ghost"
      className={cn('gap-2', style)}
      style={{
        fontFamily: 'var(--font-syne)',
        color: textColor || 'var(--color-primary)',
        ...style,
      }}
    >
      {icon}
      {label}
    </Badge>
  );
}

// ==================== CREATIVE MAX BACKGROUND ELEMENTS ====================

function CreativeMaxPattern({ accent, secondaryAccent, tertiaryAccent, quaternaryAccent }: { accent: string; secondaryAccent: string; tertiaryAccent: string; quaternaryAccent: string }) {
  return (
    <>
      {/* Large creative brush strokes */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-30"
        style={{
          transform: 'rotate(-8deg) translateX(60%)',
          background: `linear-gradient(135deg, ${accent} 0%, transparent 25%, ${secondaryAccent} 50%, ${tertiaryAccent} 75%, ${quaternaryAccent} 100%)`,
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 60%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none opacity-25"
        style={{
          transform: 'rotate(15deg) translateX(-60%)',
          background: `linear-gradient(135deg, ${secondaryAccent} 0%, ${tertiaryAccent} 40%, ${quaternaryAccent} 80%)`,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none opacity-20"
        style={{
          transform: 'rotate(-25deg)',
          background: `radial-gradient(circle, ${tertiaryAccent} 0%, ${quaternaryAccent} 50%, transparent 75%)`,
        }}
      />
      <div
        className="absolute top-1/3 right-1/3 w-[300px] h-[300px] pointer-events-none opacity-15"
        style={{
          transform: 'rotate(30deg)',
          background: `radial-gradient(circle, ${quaternaryAccent} 0%, ${accent} 50%, transparent 70%)`,
        }}
      />
      {/* Creative scatter grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(${accent} 2.5px, transparent 2.5px),
            radial-gradient(${secondaryAccent} 2px, transparent 2px),
            radial-gradient(${tertiaryAccent} 1.5px, transparent 1.5px),
            radial-gradient(${quaternaryAccent} 1px, transparent 1px)
          `,
          backgroundSize: '70px 70px, 35px 35px, 100px 100px, 150px 150px',
          backgroundPosition: '0 0, 17px 17px, 50px 50px, 75px 75px',
        }}
      />
    </>
  );
}

function CreativeMaxTopBar({ accent, secondaryAccent, tertiaryAccent, quaternaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; tertiaryAccent: string; quaternaryAccent: string; reducedMotion: boolean }) {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-4 pointer-events-none"
      style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${secondaryAccent}, ${tertiaryAccent}, ${quaternaryAccent}, ${accent}, transparent)`, backgroundSize: '300% 100%', transformOrigin: 'center' }}
      initial={reducedMotion ? {} : { scaleX: 0 }}
      animate={{ scaleX: [1, 1.01, 1], backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function CreativeMaxFloatingShapes({ accent, secondaryAccent, tertiaryAccent, quaternaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; tertiaryAccent: string; quaternaryAccent: string; reducedMotion: boolean }) {
  const shapes = [
    { x: 8, y: 12, size: 26, color: accent, delay: 0, type: 'circle' as const },
    { x: 92, y: 8, size: 20, color: secondaryAccent, delay: 0.5, type: 'diamond' as const },
    { x: 5, y: 85, size: 24, color: tertiaryAccent, delay: 1, type: 'square' as const },
    { x: 95, y: 88, size: 18, color: quaternaryAccent, delay: 1.5, type: 'circle' as const },
    { x: 50, y: 3, size: 14, color: accent, delay: 0.2, type: 'diamond' as const },
    { x: 93, y: 42, size: 12, color: secondaryAccent, delay: 0.8, type: 'square' as const },
    { x: 12, y: 48, size: 20, color: tertiaryAccent, delay: 1.2, type: 'diamond' as const },
    { x: 88, y: 22, size: 14, color: quaternaryAccent, delay: 1.8, type: 'circle' as const },
    { x: 18, y: 28, size: 16, color: accent, delay: 0.3, type: 'square' as const },
    { x: 82, y: 68, size: 12, color: secondaryAccent, delay: 1.3, type: 'diamond' as const },
    { x: 8, y: 65, size: 18, color: tertiaryAccent, delay: 0.7, type: 'circle' as const },
    { x: 85, y: 90, size: 10, color: quaternaryAccent, delay: 1.6, type: 'square' as const },
    { x: 45, y: 15, size: 16, color: 'oklch(0.7 0.25 30)', delay: 0.4, type: 'diamond' as const },
    { x: 55, y: 85, size: 14, color: 'oklch(0.65 0.28 20)', delay: 1.1, type: 'circle' as const },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40" aria-hidden="true">
      {shapes.map((shape, i) => (
        <CreativeMaxShape key={i} {...shape} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function CreativeMaxShape({ x, y, size, color, delay, type, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; type: 'circle' | 'diamond' | 'square'; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.5,
  };

  const shapeStyle: React.CSSProperties = {
    width: size,
    height: size,
    ...(type === 'diamond' && { width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}` }),
    ...(type === 'square' && { background: color, borderRadius: '3px', transform: 'rotate(45deg)' }),
    ...(type === 'circle' && { background: color, borderRadius: '50%' }),
  };

  if (reducedMotion) {
    return <div className="absolute" style={style}><div style={shapeStyle} /></div>;
  }

  return (
    <motion.div
      style={style}
      animate={{
        y: [-25, 25, -25],
        x: [-15, 15, -15],
        rotate: type === 'circle' ? 0 : [0, 360],
        scale: [1, 1.4, 1],
        opacity: [0.3, 0.8, 0.3],
      }}
      transition={{ duration: 10 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div style={shapeStyle} />
    </motion.div>
  );
}

const colors = [
  'oklch(0.7 0.32 340)',
  'oklch(0.68 0.28 20)',
  'oklch(0.7 0.28 60)',
  'oklch(0.55 0.28 280)',
];

CreativeMaxTemplate.displayName = 'CreativeMaxTemplate';
