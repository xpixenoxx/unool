'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Star, Sparkles, Zap, Target } from 'lucide-react';

export function CreativeBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.62 0.3 340)'; // Bold creative magenta
  const tertiaryAccent = 'oklch(0.7 0.28 60)'; // Creative gold/orange

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '16px',
        fontFamily: 'var(--font-syne)',
      } as React.CSSProperties}
    >
      {/* Creative Bold Background - Maximum Impact */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-muted/40" />

        {/* Multi-layer dramatic glows */}
        <div
          className="absolute top-0 left-1/3 w-[900px] h-[900px] rounded-full blur-[400px] opacity-50 -translate-x-1/2"
          style={{ background: `radial-gradient(ellipse at center, ${accent}45 0%, transparent 55%)` }}
        />
        <div
          className="absolute bottom-0 right-1/5 w-[700px] h-[700px] rounded-full blur-[400px] opacity-45"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}40 0%, transparent 55%)` }}
        />
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[300px] opacity-35"
          style={{ background: `radial-gradient(ellipse at center, ${tertiaryAccent}35 0%, transparent 55%)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[300px] opacity-30"
          style={{ background: `radial-gradient(circle, ${accent}30 0%, transparent 65%)` }}
        />

        {/* Bold creative pattern - diagonal streaks */}
        <CreativeBoldPattern accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} />

        {/* Top bold accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${secondaryAccent}, ${tertiaryAccent}, ${accent}, transparent)` }}
        />
      </div>

      {/* Orbital Background - Maximum Creative Energy */}
      <OrbitalBackground
        orbCount={12}
        orbSizes={[300, 200, 350, 150, 250, 180, 220, 120, 280, 100, 160, 80]}
        colors={[
          `oklch(0.7 0.3 340 / 0.18)`,
          `oklch(0.65 0.28 20 / 0.15)`,
          `oklch(0.75 0.25 300 / 0.14)`,
          `oklch(0.7 0.28 60 / 0.12)`,
          `oklch(0.72 0.22 320 / 0.11)`,
          `oklch(0.8 0.2 70 / 0.1)`,
          `oklch(0.68 0.26 340 / 0.1)`,
          `oklch(0.65 0.3 350 / 0.09)`,
          `oklch(0.78 0.18 25 / 0.08)`,
          `oklch(0.7 0.28 60 / 0.09)`,
          `oklch(0.62 0.3 340 / 0.08)`,
          `oklch(0.75 0.2 30 / 0.07)`,
        ]}
        speed={0.25}
        className="pointer-events-none"
      />

      {/* Triple Morphing Blob System - Bold Creative */}
      <MorphingBlob size={550} color={accent} opacity={0.28} speed={0.14} complexity={6} className="absolute top-1/6 left-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={420} color={secondaryAccent} opacity={0.24} speed={0.12} complexity={5} className="absolute bottom-1/6 right-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={350} color={tertiaryAccent} opacity={0.2} speed={0.1} complexity={5} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Floating bold creative shapes */}
      <CreativeBoldFloatingShapes accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} reducedMotion={reducedMotion} />

      <ParallaxLayers strength={30} className="relative max-w-[1000px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-syne)' }}>
        <Stack space={12}>

          {/* HEADER - Bold Creative Hero */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.2 }}
            className="text-center"
          >
            <Stack space={5} align="center">
              <div className="relative">
                {/* Ambient glow layers */}
                <motion.div
                  className="absolute -inset-8 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)` }}
                  animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -inset-12 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${secondaryAccent}20 0%, transparent 70%)` }}
                  animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.08, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />

                <Avatar className="h-36 w-36 ring-4 relative z-10" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="text-5xl font-black" style={{ fontFamily: 'var(--font-syne)' }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Bold gradient status ring - animated conic */}
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...spring.bouncy, delay: 0.5 }}
                  className="absolute -bottom-4 -right-4 h-10 w-10 rounded-full border-4 flex items-center justify-center"
                  style={{
                    background: `conic-gradient(from 0deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent}, ${accent})`,
                    borderColor: 'var(--background)',
                    boxShadow: `0 8px 32px -8px ${accent}`,
                  }}
                  aria-label="Creative Bold Active"
                >
                  <motion.div
                    className="h-4 w-4 rounded-full"
                    style={{ background: 'var(--primary-foreground)' }}
                    animate={{ scale: [1, 0.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>

                {/* Outer orbit rings */}
                <motion.div
                  className="absolute -top-6 -left-6 -right-6 -bottom-6 rounded-full pointer-events-none"
                  style={{ border: `2px solid ${accent}40` }}
                  animate={{ rotate: reducedMotion ? 0 : -360, scale: [1, 1.03, 1] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear', delay: 1 }}
                />
                <motion.div
                  className="absolute -top-12 -left-12 -right-12 -bottom-12 rounded-full pointer-events-none"
                  style={{ border: `1px solid ${secondaryAccent}20` }}
                  animate={{ rotate: reducedMotion ? 0 : 360, scale: [1, 1.02, 1] }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: 2 }}
                />
              </div>

              <Stack space={3} align="center">
                <motion.h1
                  initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.3 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight"
                  style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.04em' }}
                >
                  <span style={{ background: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 25%, ${secondaryAccent} 50%, ${tertiaryAccent} 75%, ${accent} 100%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '400% 400%' }}>
                    {profile.name}
                  </span>
                </motion.h1>

                {profile.headline && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.4 }}
                    className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-2xl"
                    style={{ fontFamily: 'var(--font-geist)', fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    {profile.headline}
                  </motion.p>
                )}
              </Stack>

              {/* Bold Status Badges */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...spring.bouncy, delay: 0.5 }}
              >
                <Flex gap={3} className="flex-wrap justify-center">
                  <Badge
                    variant="default"
                    className="gap-2 px-5 py-2.5"
                    style={{ fontFamily: 'var(--font-syne)', fontSize: '0.9375rem', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})` }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Creative Visionary
                  </Badge>
                  <Badge
                    variant="outline"
                    className="gap-2 px-5 py-2.5"
                    style={{ fontFamily: 'var(--font-geist)', borderColor: accent }}
                  >
                    {profile.links.filter(l => l.isVisible).length} Curated Links
                  </Badge>
                  <Badge
                    variant="outline"
                    className="gap-2 px-5 py-2.5"
                    style={{ fontFamily: 'var(--font-geist)', borderColor: secondaryAccent }}
                  >
                    {profile.proofs.length} Verified Proofs
                  </Badge>
                </Flex>
              </motion.div>
            </Stack>
          </motion.div>

          {/* BIO - Bold Immersive Card */}
          {profile.bio && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.6 }}
            >
              <ParallaxLayers strength={25} className="w-full">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div
                    className="absolute inset-0 rounded-3xl"
                    style={{ background: `linear-gradient(135deg, ${accent}14 0%, ${secondaryAccent}12 50%, ${tertiaryAccent}10 100%)`, filter: 'blur(2px)' }}
                  />
                  <div
                    className="relative rounded-3xl border p-2 overflow-hidden"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--card)',
                      boxShadow: `0 0 0 2px ${accent}15, 0 24px 80px -24px ${accent}25`,
                    }}
                  >
                    <div className="relative p-9 rounded-2xl" style={{ background: 'var(--card)' }}>
                      <Text size="xl" color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-syne)', fontSize: '1.25rem', fontWeight: 400, textAlign: 'center' }}>
                        {profile.bio}
                      </Text>
                    </div>
                  </div>
                </div>
              </ParallaxLayers>
            </motion.section>
          )}

          {/* PROOF POINTS - Bold Showcase Cards */}
          {profile.proofs.length > 0 && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.7 }}
            >
              <Flex between className="mb-8" wrap gap={4}>
                <Stack space={1}>
                  <Text weight="bold" size="xl" style={{ fontFamily: 'var(--font-syne)' }}>
                    Verified Achievements
                  </Text>
                  <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                    {profile.proofs.length} Creative Proof Points
                  </Text>
                </Stack>
                <Badge variant="ghost" className="gap-1" style={{ fontFamily: 'var(--font-syne)', color: accent }}>
                  <Star className="h-3 w-3" />
                  Showcase
                </Badge>
              </Flex>

              <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={5}>
                <AnimatePresence>
                  {profile.proofs
                    .slice(0, 9)
                    .map((proof, index) => (
                      <motion.div
                        key={proof.id}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 30, rotate: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ ...spring.bouncy, delay: 0.8 + index * 0.08 }}
                      >
                        <TiltCard
                          maxTilt={12}
                          scale={1.03}
                          className="h-full"
                          style={{
                            borderRadius: '16px',
                            border: `1px solid ${index % 2 === 0 ? `${accent}30` : `${secondaryAccent}30`}`,
                            background: `linear-gradient(145deg, var(--card) 0%, ${index % 2 === 0 ? `${accent}08` : `${secondaryAccent}08`} 100%)`,
                            boxShadow: `0 0 0 1px ${index % 2 === 0 ? `${accent}15` : `${secondaryAccent}15`}, 0 12px 48px -12px ${index % 2 === 0 ? `${accent}25` : `${secondaryAccent}25`}`,
                          }}
                        >
                          <div className="p-6 h-full flex flex-col">
                            <Flex between className="mb-4">
                              {proof.icon && (
                                <motion.div
                                  initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ ...spring.bouncy, delay: 0.9 + index * 0.1 }}
                                  className="flex-shrink-0 group-hover:rotate-12 transition-transform duration-400"
                                  style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '14px',
                                    background: index % 2 === 0
                                      ? `linear-gradient(135deg, ${accent}, ${secondaryAccent})`
                                      : `linear-gradient(135deg, ${secondaryAccent}, ${tertiaryAccent})`,
                                    color: 'var(--primary-foreground)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    boxShadow: `0 8px 32px -8px ${index % 2 === 0 ? accent : secondaryAccent}`,
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
                                <Text size="xl" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: index % 2 === 0 ? accent : secondaryAccent }}>
                                  {proof.value}
                                </Text>
                              )}
                            </Flex>
                          </div>
                        </TiltCard>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </Grid>
            </motion.section>
          )}

          {/* LINKS - Bold Dramatic Cards */}
          {profile.links.length > 0 && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.8 }}
            >
              <Flex between className="mb-8" wrap gap={4}>
                <Stack space={1}>
                  <Text weight="bold" size="xl" style={{ fontFamily: 'var(--font-syne)' }}>
                    Featured Links
                  </Text>
                  <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                    {profile.links.filter(l => l.isVisible).length} Active · {profile.links.reduce((a, l) => a + l.clicks, 0).toLocaleString()} Total Clicks
                  </Text>
                </Stack>
                <Badge variant="ghost" className="gap-1" style={{ fontFamily: 'var(--font-syne)', color: accent }}>
                  <Zap className="h-3 w-3" />
                  Live
                </Badge>
              </Flex>

              <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={5}>
                <AnimatePresence>
                  {profile.links
                    .filter(l => l.isVisible)
                    .slice(0, 15)
                    .map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 40, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -30 }}
                        transition={{ ...spring.magnetic, delay: 0.8 + index * 0.07 }}
                      >
                        {/* Rotate: TiltCard (even), MagneticCard (odd) */}
                        {index % 2 === 0 ? (
                          <TiltCard
                            maxTilt={15}
                            scale={1.035}
                            className={cn('h-full', isPreview && 'opacity-80')}
                            style={{
                              borderRadius: '16px',
                              border: `1px solid ${accent}30`,
                              background: `linear-gradient(145deg, var(--card) 0%, ${accent}10 100%)`,
                              boxShadow: `0 0 0 2px ${accent}15, 0 16px 64px -16px ${accent}30`,
                            }}
                          >
                            <CreativeBoldLinkButton link={link} accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="tilt" reducedMotion={reducedMotion} />
                          </TiltCard>
                        ) : (
                          <MagneticCard
                            radius={60}
                            strength={0.25}
                            className={cn('h-full', isPreview && 'opacity-80')}
                            style={{
                              borderRadius: '16px',
                              border: `1px solid ${secondaryAccent}25`,
                              background: `linear-gradient(135deg, var(--card) 0%, ${secondaryAccent}10 100%)`,
                              boxShadow: `0 8px 32px -8px ${accent}15`,
                            }}
                          >
                            <CreativeBoldLinkButton link={link} accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="magnetic" reducedMotion={reducedMotion} />
                          </MagneticCard>
                        )}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </Grid>
            </motion.section>
          )}

        </Stack>
      </ParallaxLayers>
    </div>
  );
}

function CreativeBoldLinkButton({
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
  variant: 'magnetic' | 'tilt';
  reducedMotion: boolean;
}) {
  return (
    <button
      onClick={() => onClick?.(link)}
      className="relative w-full px-5 py-4 text-left group overflow-hidden"
      style={{ borderRadius: '14px', fontFamily: 'var(--font-syne)' }}
    >
      {/* Animated left accent bar - triple gradient */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-2"
        style={{ background: `linear-gradient(180deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`, borderRadius: '14px 0 0 14px', transformOrigin: 'bottom' }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 + index * 0.07 }}
      />

      {/* Creative hover shimmer - multi-color */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}15, ${secondaryAccent}10, ${tertiaryAccent}08, transparent)` }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Hover glow - variant specific */}
      {variant === 'magnetic' && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${secondaryAccent}30, 0 16px 64px -16px ${accent}20`,
            borderRadius: '14px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {variant === 'tilt' && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${accent}30, 0 16px 64px -16px ${accent}25`,
            borderRadius: '14px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <Flex align="center" gap={4} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.06 }}
          className="flex-shrink-0 group-hover:scale-115 group-hover:rotate-8 transition-transform duration-400"
          style={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.35rem',
            boxShadow: `0 8px 32px -8px ${accent}`,
            fontFamily: 'var(--font-syne)',
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={1.5} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.04 }}
            className="font-semibold truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-syne)', fontSize: '1.1rem' }}
          >
            {link.label}
          </motion.span>
          <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {link.url}
          </Text>
        </Flex>

        <Flex align="center" gap={2.5}>
          <motion.span
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.6 + index * 0.04 }}
            style={{
              fontSize: '0.8rem',
              color: accent,
              fontFamily: 'var(--font-geist-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 500,
            }}
          >
            {link.clicks.toLocaleString()}
          </motion.span>
          <Badge
            variant="ghost"
            size="sm"
            className="group-hover:bg-primary/10 group-hover:text-primary transition-all"
            style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-syne)', fontWeight: 700 }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </button>
  );
}

// ==================== CREATIVE BOLD BACKGROUND ELEMENTS ====================

function CreativeBoldPattern({ accent, secondaryAccent, tertiaryAccent }: { accent: string; secondaryAccent: string; tertiaryAccent: string }) {
  return (
    <>
      {/* Large diagonal creative streaks */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-25"
        style={{
          transform: 'rotate(-10deg) translateX(50%)',
          background: `linear-gradient(135deg, ${accent} 0%, transparent 30%, ${secondaryAccent} 60%, ${tertiaryAccent} 100%)`,
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 60%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none opacity-20"
        style={{
          transform: 'rotate(20deg) translateX(-50%)',
          background: `linear-gradient(135deg, ${secondaryAccent} 0%, ${tertiaryAccent} 50%, ${accent} 100%)`,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none opacity-15"
        style={{
          transform: 'rotate(-30deg)',
          background: `radial-gradient(circle, ${tertiaryAccent} 0%, transparent 70%)`,
        }}
      />
      {/* Creative scatter */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `radial-gradient(${accent} 2px, transparent 2px), radial-gradient(${secondaryAccent} 1.5px, transparent 1.5px), radial-gradient(${tertiaryAccent} 1px, transparent 1px)`,
          backgroundSize: '80px 80px, 40px 40px, 120px 120px',
          backgroundPosition: '0 0, 20px 20px, 60px 60px',
        }}
      />
    </>
  );
}

function CreativeBoldFloatingShapes({ accent, secondaryAccent, tertiaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; tertiaryAccent: string; reducedMotion: boolean }) {
  const shapes = [
    { x: 10, y: 15, size: 22, color: accent, delay: 0, type: 'circle' as const },
    { x: 90, y: 10, size: 16, color: secondaryAccent, delay: 0.5, type: 'diamond' as const },
    { x: 5, y: 82, size: 20, color: tertiaryAccent, delay: 1, type: 'square' as const },
    { x: 95, y: 85, size: 16, color: accent, delay: 1.5, type: 'circle' as const },
    { x: 50, y: 5, size: 12, color: secondaryAccent, delay: 0.2, type: 'diamond' as const },
    { x: 92, y: 45, size: 10, color: tertiaryAccent, delay: 0.8, type: 'square' as const },
    { x: 15, y: 50, size: 16, color: accent, delay: 1.2, type: 'diamond' as const },
    { x: 85, y: 25, size: 12, color: secondaryAccent, delay: 1.8, type: 'circle' as const },
    { x: 8, y: 35, size: 14, color: tertiaryAccent, delay: 0.3, type: 'square' as const },
    { x: 88, y: 65, size: 10, color: accent, delay: 1.3, type: 'diamond' as const },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35" aria-hidden="true">
      {shapes.map((shape, i) => (
        <CreativeBoldShape key={i} {...shape} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function CreativeBoldShape({ x, y, size, color, delay, type, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; type: 'circle' | 'diamond' | 'square'; reducedMotion: boolean }) {
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
        y: [-20, 20, -20],
        x: [-12, 12, -12],
        rotate: type === 'circle' ? 0 : [0, 360],
        scale: [1, 1.35, 1],
        opacity: [0.3, 0.75, 0.3],
      }}
      transition={{ duration: 9 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div style={shapeStyle} />
    </motion.div>
  );
}

CreativeBoldTemplate.displayName = 'CreativeBoldTemplate';
