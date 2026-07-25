'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring, slideUp, fadeIn } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function ProfessionalLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.55 0.15 250)'; // Deep professional blue-purple

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '10px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Airy Professional Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />

        {/* Top accent glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-30"
          style={{ background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)` }}
        />

        {/* Bottom accent glow */}
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[200px] opacity-20"
          style={{ background: `radial-gradient(circle, ${secondaryAccent}20 0%, transparent 70%)` }}
        />

        {/* Subtle center glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[150px] opacity-15"
          style={{ background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)` }}
        />

        {/* Professional grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Subtle Orbital Background - Professional */}
      <OrbitalBackground
        orbCount={4}
        orbSizes={[120, 160, 100, 140]}
        colors={[
          `oklch(0.65 0.12 250 / 0.06)`,
          `oklch(0.6 0.14 260 / 0.05)`,
          `oklch(0.7 0.1 240 / 0.05)`,
          `oklch(0.58 0.16 255 / 0.04)`,
        ]}
        speed={0.08}
        className="pointer-events-none"
      />

      {/* Single Morphing Blob - Subtle accent */}
      <MorphingBlob
        size={350}
        color={accent}
        opacity={0.12}
        speed={0.05}
        complexity={3}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <Stack space={10} className="relative max-w-[900px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero Section - Clean & Professional */}
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="text-center relative"
        >
          {/* Double ring system - Professional */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none blur-xl"
            style={{ background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none"
            style={{ border: `1px solid ${accent}20`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : 360 }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
            style={{ border: `1px solid ${accent}10`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : -360 }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative inline-block mb-7">
            <Avatar className="h-32 w-32 ring-4 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-4xl font-medium">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Professional status indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.4 }}
              className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full border-3 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                borderColor: 'var(--background)',
                boxShadow: `0 4px 20px -4px ${accent}`,
              }}
              aria-label="Active"
            >
              <motion.div
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--primary-foreground)' }}
                animate={{ scale: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          <Stack space={4}>
            <motion.h1
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-geist)', letterSpacing: '-0.02em' }}
            >
              <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 100%)` }}>
                {profile.name}
              </span>
            </motion.h1>

            {profile.headline && (
              <motion.p
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto"
                style={{ fontFamily: 'var(--font-geist)', fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                {profile.headline}
              </motion.p>
            )}

            {/* Company badges - professional row */}
            {profile.proofs.length > 0 && (
              <Flex gap={2.5} center className="flex-wrap mt-2" wrap>
                {profile.proofs
                  .slice(0, 5)
                  .map((proof, index) => (
                    <motion.div
                      key={proof.id}
                      initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring.bouncy, delay: 0.5 + index * 0.06 }}
                    >
                      <Badge
                        variant="ghost"
                        className={cn('gap-2 py-2 px-3', isPreview && 'opacity-80')}
                        style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem', color: accent, borderColor: `${accent}20` }}
                      >
                        {proof.icon && <span style={{ fontSize: '1rem' }}>{proof.icon}</span>}
                        {proof.title}
                      </Badge>
                    </motion.div>
                  ))}
              </Flex>
            )}
          </Stack>
        </motion.div>

        {/* Two Column Layout: Bio | Links */}
        <Grid cols={{ base: 1, lg: 2 }} gap={8} className="items-start">
          {/* Left Column: Bio & Metrics */}
          <Stack space={6}>
            {/* Bio Card - Professional Glassmorphism */}
            {profile.bio && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.5 }}
              >
                <ParallaxLayers strength={10} className="w-full">
                  <div className="relative w-full">
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: `linear-gradient(135deg, ${accent}06 0%, ${secondaryAccent}04 100%)` }}
                    />
                    <div
                      className="relative rounded-2xl border p-1 overflow-hidden"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--card)',
                        boxShadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.08)',
                      }}
                    >
                      <div className="relative p-7 rounded-xl" style={{ background: 'var(--card)' }}>
                        <Text size="base" color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-geist)', fontSize: '1.05rem' }}>
                          {profile.bio}
                        </Text>
                      </div>
                    </div>
                  </div>
                </ParallaxLayers>
              </motion.div>
            )}

            {/* Metrics Strip - 3 KPIs */}
            {profile.proofs.some(p => p.value) && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.6 }}
              >
                <div
                  className="relative rounded-2xl border p-1 overflow-hidden"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--card)',
                    boxShadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.08)',
                  }}
                >
                  <div className="relative p-5 rounded-xl" style={{ background: 'var(--card)' }}>
                    <Flex between className="flex-wrap gap-4" wrap>
                      {profile.proofs
                        .filter(p => p.value)
                        .slice(0, 3)
                        .map((proof) => (
                          <Flex key={proof.id} column gap={1} align="center" className="flex-1 min-w-[100px]">
                            {proof.icon && <span style={{ fontSize: '1.5rem' }}>{proof.icon}</span>}
                            <div className="text-center">
                              <Text size="lg" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                                {proof.value}
                              </Text>
                              <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {proof.title}
                              </Text>
                            </div>
                          </Flex>
                        ))}
                    </Flex>
                  </div>
                </div>
              </motion.div>
            )}
          </Stack>

          {/* Right Column: Links - Professional Magnetic Cards */}
          <Stack space={3} className="w-full">
            {profile.links.length > 0 && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring.standard, delay: 0.3 }}
              >
                <Text size="sm" weight="medium" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Links
                </Text>
                <Stack space={3}>
                  {profile.links
                    .filter(l => l.isVisible)
                    .slice(0, 15)
                    .map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring.gentle, delay: 0.4 + index * 0.04 }}
                      >
                        {/* Alternate Magnetic and Tilt for visual rhythm */}
                        {index % 2 === 0 ? (
                          <MagneticCard
                            radius={110}
                            strength={0.16}
                            className={cn('w-full', isPreview && 'opacity-80')}
                            style={{
                              borderRadius: '10px',
                              border: '1px solid var(--border)',
                              background: 'var(--card)',
                              boxShadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.08)',
                            }}
                          >
                            <ProfessionalLinkButton link={link} accent={accent} index={index} isPreview={isPreview} variant="magnetic" />
                          </MagneticCard>
                        ) : (
                          <TiltCard
                            maxTilt={3}
                            scale={1.01}
                            className={cn('w-full', isPreview && 'opacity-80')}
                            style={{
                              borderRadius: '10px',
                              border: `1px solid ${accent}15`,
                              background: `linear-gradient(145deg, var(--card) 0%, ${accent}03 100%)`,
                              boxShadow: `0 2px 8px -2px ${accent}06`,
                            }}
                          >
                            <ProfessionalLinkButton link={link} accent={accent} index={index} isPreview={isPreview} variant="tilt" />
                          </TiltCard>
                        )}
                      </motion.div>
                    ))}
                </Stack>
              </motion.div>
            )}
          </Stack>
        </Grid>

        {/* Footer - Professional Subdomain */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1 }}
          className="text-center pt-4 lg:hidden"
        >
          <Flex center gap={2} className="mx-auto">
            <Box
              className="px-4 py-2 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accent}10, ${accent}04)`,
                border: `1px solid ${accent}25`,
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.875rem',
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
          transition={{ ...spring.gentle, delay: 1.2 }}
        >
          <Box
            className="px-4 py-2 rounded-full text-center"
            style={{
              background: `linear-gradient(135deg, ${accent}10, ${accent}04)`,
              border: `1px solid ${accent}25`,
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
      className="relative w-full px-5 py-4 text-left group overflow-hidden no-underline"
      style={{ borderRadius: '10px', fontFamily: 'var(--font-geist)', display: 'flex' }}
    >
      {/* Animated left accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: `linear-gradient(180deg, ${accent}, ${accent}aa)`,
          borderRadius: '10px 0 0 10px',
          transformOrigin: 'bottom',
        }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 + index * 0.04 }}
      />

      {/* Shimmer sweep on hover */}
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
            boxShadow: `0 0 0 1px ${accent}25, 0 8px 24px -8px ${accent}12`,
            borderRadius: '10px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <Flex align="center" gap={3.5} className="relative z-10 flex-1">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.04 }}
          className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '1.125rem',
            boxShadow: `0 4px 16px -4px ${accent}`,
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={1.5} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.03 }}
            className="font-medium truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-geist)', fontSize: '1.05rem' }}
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
            transition={{ ...spring.gentle, delay: 0.6 + index * 0.03 }}
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
            style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-geist)', fontWeight: 600 }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </a>
  );
}

ProfessionalLightTemplate.displayName = 'ProfessionalLightTemplate';
