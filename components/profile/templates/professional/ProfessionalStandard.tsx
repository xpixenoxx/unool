'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers, PerspectiveFlip } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring, slideUp, fadeIn } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function ProfessionalStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.5 0.18 260)'; // Deep executive purple-blue

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Executive Gradient Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/25" />

        {/* Primary glow - top left */}
        <div
          className="absolute top-0 left-1/3 w-[700px] h-[700px] rounded-full blur-[250px] opacity-35"
          style={{ background: `radial-gradient(ellipse at center, ${accent}30 0%, transparent 65%)` }}
        />

        {/* Secondary glow - bottom right */}
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[250px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}25 0%, transparent 65%)` }}
        />

        {/* Center connecting glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[200px] opacity-20"
          style={{ background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)` }}
        />

        {/* Executive horizontal accent bars */}
        <div
          className="absolute top-1/4 left-0 right-0 h-px opacity-30"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }}
        />
        <div
          className="absolute bottom-1/4 left-0 right-0 h-px opacity-20"
          style={{ background: `linear-gradient(90deg, transparent, ${secondaryAccent}30, transparent)` }}
        />

        {/* Subtle diagonal line pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0, ${accent} 1px, transparent 1px, transparent 60px)`,
          }}
        />
      </div>

      {/* Orbital Background - Executive Density */}
      <OrbitalBackground
        orbCount={5}
        orbSizes={[150, 200, 120, 180, 90]}
        colors={[
          `oklch(0.62 0.16 255 / 0.08)`,
          `oklch(0.58 0.18 265 / 0.07)`,
          `oklch(0.68 0.12 245 / 0.06)`,
          `oklch(0.55 0.2 270 / 0.06)`,
          `oklch(0.7 0.1 240 / 0.05)`,
        ]}
        speed={0.1}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blobs - Refined */}
      <MorphingBlob
        size={400}
        color={accent}
        opacity={0.14}
        speed={0.06}
        complexity={4}
        className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />
      <MorphingBlob
        size={280}
        color={secondaryAccent}
        opacity={0.1}
        speed={0.04}
        complexity={3}
        className="absolute bottom-1/4 right-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <Stack space={12} className="relative max-w-[900px] mx-auto px-4 py-20" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero Section - Executive Presence */}
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="text-center relative"
        >
          {/* Layered glow system */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none blur-2xl"
            style={{ background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none"
            style={{ border: `1px solid ${accent}25`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : 360, scale: [1, 1.06, 1] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full pointer-events-none"
            style={{ border: `1px solid ${secondaryAccent}15`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative inline-block mb-8">
            <Avatar className="h-36 w-36 ring-4 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-5xl font-medium">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Executive status badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...spring.bouncy, delay: 0.4 }}
              className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full border-3 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                borderColor: 'var(--background)',
                boxShadow: `0 4px 20px -4px ${accent}`,
              }}
              aria-label="Active"
            >
              <motion.div
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: 'var(--primary-foreground)' }}
                animate={{ scale: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          <Stack space={4}>
            <motion.h1
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-geist)', letterSpacing: '-0.02em' }}
            >
              <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 100%)` }}>
                {profile.name}
              </span>
            </motion.h1>

            {profile.headline && (
              <motion.p
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto"
                style={{ fontFamily: 'var(--font-geist)', fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                {profile.headline}
              </motion.p>
            )}

            {/* Company badges - executive row */}
            {profile.proofs.length > 0 && (
              <Flex gap={3} center className="flex-wrap mt-2" wrap>
                {profile.proofs
                  .slice(0, 5)
                  .map((proof, index) => (
                    <motion.div
                      key={proof.id}
                      initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring.bouncy, delay: 0.5 + index * 0.07 }}
                    >
                      <Badge
                        variant="ghost"
                        className={cn('gap-2 py-2 px-4', isPreview && 'opacity-80')}
                        style={{ fontFamily: 'var(--font-geist)', fontSize: '0.9rem', color: accent, borderColor: `${accent}25` }}
                      >
                        {proof.icon && <span style={{ fontSize: '1.1rem' }}>{proof.icon}</span>}
                        {proof.title}
                      </Badge>
                    </motion.div>
                  ))}
              </Flex>
            )}
          </Stack>
        </motion.div>

        {/* Metrics Strip - TiltCards for Key Metrics */}
        {profile.proofs.some(p => p.value) && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.5 }}
          >
            <Text size="sm" weight="medium" color="muted" className="text-center" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Key Metrics
            </Text>
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4} className="mt-4">
              {profile.proofs
                .filter(p => p.value)
                .slice(0, 6)
                .map((proof, index) => (
                  <motion.div
                    key={proof.id}
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring.bouncy, delay: 0.6 + index * 0.08 }}
                  >
                    <TiltCard
                      maxTilt={6}
                      scale={1.02}
                      className="h-full"
                      style={{
                        borderRadius: '12px',
                        border: `1px solid ${accent}20`,
                        background: `linear-gradient(145deg, var(--card) 0%, ${accent}04 100%)`,
                        boxShadow: `0 2px 12px -2px ${accent}08`,
                      }}
                    >
                      <div className="flex flex-col items-center justify-center p-6 h-full min-h-[130px] text-center">
                        {proof.icon && <span style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>{proof.icon}</span>}
                        <Text size="2xl" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent, lineHeight: 1 }}>
                          {proof.value}
                        </Text>
                        <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.75rem' }}>
                          {proof.title}
                        </Text>
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
            </Grid>
          </motion.div>
        )}

        {/* Bio Card - Professional Glassmorphism */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
          >
            <ParallaxLayers strength={12} className="w-full">
              <div className="relative w-full">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${accent}08 0%, ${secondaryAccent}06 100%)` }}
                />
                <div
                  className="relative rounded-2xl border p-1.5 overflow-hidden"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--card)',
                    boxShadow: '0 4px 20px -4px oklch(0.12 0.02 247.8 / 0.1), 0 2px 8px -2px oklch(0.12 0.02 247.8 / 0.08)',
                  }}
                >
                  <div className="relative p-8 rounded-xl" style={{ background: 'var(--card)' }}>
                    <Text size="lg" color="foreground" style={{ lineHeight: 1.85, fontFamily: 'var(--font-geist)', textAlign: 'center', maxWidth: '750px', margin: '0 auto', fontSize: '1.1rem' }}>
                      {profile.bio}
                    </Text>
                  </div>
                </div>
              </div>
            </ParallaxLayers>
          </motion.div>
        )}

        {/* Links - Professional Magnetic + Tilt Cards */}
        {profile.links.length > 0 && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
          >
            <Stack space={4} className="w-full max-w-[900px]">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => {
                  const useTilt = index % 3 === 1; // Every 3rd gets tilt for rhythm
                  return (
                    <motion.div
                      key={link.id}
                      initial={reducedMotion ? {} : { opacity: 0, y: 30, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ ...spring.gentle, delay: 0.6 + index * 0.045 }}
                    >
                      {useTilt ? (
                        <TiltCard
                          maxTilt={4}
                          scale={1.015}
                          className={cn('w-full', isPreview && 'opacity-80')}
                          style={{
                            borderRadius: '12px',
                            border: `1px solid ${accent}20`,
                            background: `linear-gradient(145deg, var(--card) 0%, ${accent}05 100%)`,
                            boxShadow: `0 4px 20px -4px ${accent}12`,
                          }}
                        >
                          <ProfessionalLinkButton link={link} accent={accent} index={index} isPreview={isPreview} variant="tilt" />
                        </TiltCard>
                      ) : (
                        <MagneticCard
                          radius={140}
                          strength={0.18}
                          className={cn('w-full', isPreview && 'opacity-80')}
                          style={{
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--card)',
                            boxShadow: '0 2px 12px -2px oklch(0.12 0.02 247.8 / 0.08), 0 1px 4px -1px oklch(0.12 0.02 247.8 / 0.08)',
                          }}
                        >
                          <ProfessionalLinkButton link={link} accent={accent} index={index} isPreview={isPreview} variant="magnetic" />
                        </MagneticCard>
                      )}
                    </motion.div>
                  );
                })}
            </Stack>
          </motion.div>
        )}

        {/* Organizations / Proof Points - PerspectiveFlip Cards */}
        {profile.proofs.length > 0 && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
          >
            <Stack space={3} className="w-full max-w-[900px]">
              {profile.proofs
                .slice(0, 6)
                .map((proof, index) => (
                  <PerspectiveFlip key={proof.id} axis="y" trigger="hover" duration={0.5}>
                    <div className="relative w-full" style={{ perspective: 1000 }}>
                      <MagneticCard
                        radius={100}
                        strength={0.12}
                        className={cn('w-full', isPreview && 'opacity-80')}
                        style={{
                          borderRadius: '12px',
                          border: `1px solid ${accent}30`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}06 100%)`,
                          minHeight: 68,
                          boxShadow: `0 0 0 1px ${accent}10, 0 8px 24px -8px ${accent}15`,
                        }}
                      >
                        <div className="p-5 flex items-center gap-4">
                          {proof.icon && (
                            <motion.div
                              initial={reducedMotion ? {} : { scale: 0, rotate: -120 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ ...spring.bouncy, delay: 0.7 + index * 0.08 }}
                              className="flex-shrink-0 group-hover:rotate-6 transition-transform duration-400"
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
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
                          <Flex column gap={2} flex={1} className="min-w-0">
                            <Text weight="semibold" size="base" style={{ fontFamily: 'var(--font-geist)' }}>
                              {proof.title}
                            </Text>
                            {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>{proof.value}</Text>}
                          </Flex>
                        </div>
                      </MagneticCard>
                    </div>
                  </PerspectiveFlip>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* Footer - Professional Subdomain */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
          className="text-center pt-6 lg:hidden"
        >
          <Flex center gap={2} className="mx-auto">
            <Box
              className="px-4 py-2 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accent}12, ${accent}05)`,
                border: `1px solid ${accent}30`,
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.9rem',
                color: accent,
                fontWeight: 600,
              }}
            >
              {profile.subdomain}.unool.co
            </Box>
          </Flex>
        </motion.div>
      </Stack>

      {/* Desktop Sidebar Subdomain */}
      <div className="hidden lg:block absolute bottom-8 left-8 right-auto" style={{ maxWidth: 200 }}>
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring.gentle, delay: 1.4 }}
        >
          <Box
            className="px-4 py-2 rounded-full text-center"
            style={{
              background: `linear-gradient(135deg, ${accent}12, ${accent}05)`,
              border: `1px solid ${accent}30`,
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.85rem',
              color: accent,
              fontWeight: 600,
            }}
          >
            {profile.subdomain}.unool.co
          </Box>
        </motion.div>
      </div>
    </div>
  );
}

function ProfessionalLinkButton({
  link,
  accent,
  index,
  isPreview = false,
  variant,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  index: number;
  isPreview?: boolean;
  variant: 'magnetic' | 'tilt';
}) {
  const reducedMotion = useReducedMotion();

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative w-full px-6 py-4.5 text-left group overflow-hidden no-underline"
      style={{ borderRadius: '12px', fontFamily: 'var(--font-geist)', display: 'flex' }}
    >
      {/* Animated left accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: `linear-gradient(180deg, ${accent}, ${accent}aa)`,
          borderRadius: '12px 0 0 12px',
          transformOrigin: 'bottom',
        }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.gentle, delay: 0.5 + index * 0.04 }}
      />

      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}08, transparent)` }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Magnetic hover glow */}
      {variant === 'magnetic' && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            boxShadow: `0 0 0 1px ${accent}25, 0 10px 30px -10px ${accent}15`,
            borderRadius: '12px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <Flex align="center" gap={4} className="relative z-10 flex-1">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.05 }}
          className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '1.2rem',
            boxShadow: `0 6px 20px -6px ${accent}`,
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={2} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.04 }}
            className="font-medium truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-geist)', fontSize: '1.1rem' }}
          >
            {link.label}
          </motion.span>
          <Text size="sm" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {link.url}
          </Text>
        </Flex>

        <Flex align="center" gap={3}>
          <motion.span
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.7 + index * 0.04 }}
            style={{
              fontSize: '0.85rem',
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
            style={{ fontSize: '0.7rem', fontFamily: 'var(--font-geist)', fontWeight: 600 }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </a>
  );
}

ProfessionalStandardTemplate.displayName = 'ProfessionalStandardTemplate';
