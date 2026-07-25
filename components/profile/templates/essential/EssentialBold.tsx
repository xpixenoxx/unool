'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers, PerspectiveFlip } from '@/components/ui/3d';
import { Flex, Stack, Box } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring, slideUp, fadeIn } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function EssentialBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '16px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Dramatic Gradient Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `radial-gradient(ellipse at 20% 10%, ${accent}30 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, oklch(0.65 0.18 280 / 0.25) 0%, transparent 50%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accent}08 0%, transparent 50%, oklch(0.7 0.12 280 / 0.06) 100%)`,
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Orbital Background - more prominent */}
      <OrbitalBackground
        orbCount={6}
        orbSizes={[180, 120, 220, 100, 160, 90]}
        colors={[
          `oklch(0.7 0.18 200 / 0.12)`,
          `oklch(0.65 0.16 280 / 0.1)`,
          `oklch(0.75 0.14 200 / 0.08)`,
          `oklch(0.68 0.2 280 / 0.09)`,
          `oklch(0.72 0.15 200 / 0.07)`,
          `oklch(0.66 0.17 280 / 0.08)`,
        ]}
        speed={0.15}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blobs */}
      <MorphingBlob
        size={500}
        color={accent}
        opacity={0.18}
        speed={0.08}
        complexity={5}
        className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />
      <MorphingBlob
        size={350}
        color="oklch(0.65 0.18 280)"
        opacity={0.12}
        speed={0.06}
        complexity={4}
        className="absolute bottom-1/4 right-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <Stack space={12} className="relative max-w-[760px] mx-auto px-4 py-20" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero Section - Bold & Expressive */}
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="text-center relative"
        >
          {/* Triple ring glow system */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none blur-2xl"
            style={{ background: `radial-gradient(circle, ${accent}50 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{ border: `2px solid ${accent}30`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : 360, scale: [1, 1.08, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
            style={{ border: `1px solid ${accent}20`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : -360, scale: [1, 1.05, 1] }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative inline-block mb-8">
            <Avatar className="h-36 w-36 ring-4 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-5xl font-bold">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Animated status badge with gradient border */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: reducedMotion ? 0 : 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-4 -right-4 h-9 w-9 rounded-full border-4 flex items-center justify-center"
              style={{
                background: `conic-gradient(from 0deg, ${accent}, oklch(0.65 0.18 280), ${accent})`,
                borderColor: 'var(--background)',
                boxShadow: `0 0 0 6px ${accent}25, 0 12px 40px -12px ${accent}`,
              }}
              aria-label="Active"
            >
              <motion.div
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: 'var(--primary-foreground)' }}
                animate={{ scale: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          <Stack space={5}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ opacity: { ...spring.gentle, delay: 0.1 }, y: { ...spring.gentle, delay: 0.1 }, backgroundPosition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                fontFamily: 'var(--font-geist)',
                backgroundImage: `linear-gradient(135deg, ${accent} 0%, oklch(0.75 0.15 280) 40%, oklch(0.8 0.12 200) 70%, ${accent} 100%)`,
                backgroundSize: '300% 300%',
              }}
            >
              {profile.name}
            </motion.h1>

            {profile.headline && (
              <motion.p
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="text-2xl sm:text-3xl font-medium max-w-4xl mx-auto"
                style={{
                  fontFamily: 'var(--font-geist)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  background: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {profile.headline}
              </motion.p>
            )}
          </Stack>
        </motion.div>

        {/* Bio Card - Bold Glassmorphism */}
        {profile.bio && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <ParallaxLayers strength={25} className="w-full">
              <div className="relative w-full">
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${accent}15 0%, oklch(0.65 0.18 280 / 0.08) 50%, ${accent}10 100%)`,
                    filter: 'blur(1px)',
                  }}
                />
                <div
                  className="relative rounded-3xl border p-1"
                  style={{
                    borderColor: `${accent}40`,
                    background: `linear-gradient(145deg, var(--card) 0%, var(--card) 100%)`,
                    boxShadow: `0 0 0 1px ${accent}20, 0 20px 60px -20px ${accent}25, inset 0 1px 0 ${accent}10`,
                  }}
                >
                  <div className="relative p-8 sm:p-10 rounded-2xl" style={{ background: 'var(--card)' }}>
                    <Text size="lg" color="foreground" style={{ lineHeight: 1.9, fontFamily: 'var(--font-geist)', textAlign: 'center', maxWidth: '700px', margin: '0 auto', fontSize: '1.15rem' }}>
                      {profile.bio}
                    </Text>
                  </div>
                </div>
              </div>
            </ParallaxLayers>
          </motion.div>
        )}

        {/* Links - Bold Magnetic + Tilt Cards with accent bars */}
        {profile.links.length > 0 && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Stack space={4} className="w-full max-w-[760px]">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={reducedMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...spring.magnetic, delay: 0.5 + index * 0.05 }}
                  >
                    {/* Every 2nd gets TiltCard for variety */}
                    {index % 2 === 1 ? (
                      <TiltCard
                        maxTilt={8}
                        scale={1.025}
                        className={cn('w-full', isPreview && 'opacity-80')}
                        style={{
                          borderRadius: '16px',
                          border: `1px solid ${accent}30`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}08 100%)`,
                          boxShadow: `0 0 0 1px ${accent}15, 0 8px 32px -8px ${accent}20`,
                        }}
                      >
                        <BoldLinkButton link={link} accent={accent} index={index} isPreview={isPreview} />
                      </TiltCard>
                    ) : (
                      <MagneticCard
                        radius={180}
                        strength={0.25}
                        className={cn('w-full', isPreview && 'opacity-80')}
                        style={{
                          borderRadius: '16px',
                          border: `1px solid ${accent}25`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}06 100%)`,
                          boxShadow: `0 0 0 1px ${accent}10, 0 4px 24px -4px ${accent}15`,
                        }}
                      >
                        <BoldLinkButton link={link} accent={accent} index={index} isPreview={isPreview} />
                      </MagneticCard>
                    )}
                  </motion.div>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points - PerspectiveFlip with bold styling */}
        {profile.proofs.length > 0 && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Stack space={4} className="w-full max-w-[760px]">
              {profile.proofs
                .slice(0, 8)
                .map((proof, index) => (
                  <PerspectiveFlip key={proof.id} axis="x" trigger="hover" duration={0.6}>
                    <div className="relative w-full" style={{ perspective: 1000 }}>
                      <MagneticCard
                        radius={140}
                        strength={0.15}
                        className={cn('w-full', isPreview && 'opacity-80')}
                        style={{
                          borderRadius: '16px',
                          border: `1px solid ${accent}35`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}10 100%)`,
                          minHeight: 80,
                          boxShadow: `0 0 0 1px ${accent}20, 0 12px 40px -12px ${accent}25`,
                        }}
                      >
                        <div className="p-6 flex items-center gap-5">
                          {proof.icon && (
                            <motion.div
                              initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ ...spring.bouncy, delay: 0.7 + index * 0.08 }}
                              className="group-hover:rotate-12 transition-transform duration-500"
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${accent}, oklch(0.65 0.18 280), ${accent})`,
                                color: 'var(--primary-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.6rem',
                                boxShadow: `0 10px 40px -10px ${accent}`,
                              }}
                            >
                              {proof.icon}
                            </motion.div>
                          )}
                          <Flex column gap={3} flex={1} className="min-w-0">
                            <Text weight="bold" size="lg" style={{ fontFamily: 'var(--font-geist)' }}>
                              {proof.title}
                            </Text>
                            {proof.value && <Text size="base" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>{proof.value}</Text>}
                          </Flex>
                        </div>
                      </MagneticCard>
                    </div>
                  </PerspectiveFlip>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* Footer - Bold subdomain */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring.magnetic, delay: 1.4 }}
          className="text-center pt-6"
        >
          <Flex center gap={3} className="mx-auto">
            <Box
              className="px-5 py-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                border: `2px solid ${accent}40`,
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '1rem',
                color: accent,
                fontWeight: 700,
                letterSpacing: '0.05em',
                boxShadow: `0 0 0 4px ${accent}10, 0 8px 32px -8px ${accent}20`,
              }}
            >
              {profile.subdomain}.unool.co
            </Box>
          </Flex>
        </motion.div>
      </Stack>
    </div>
  );
}

function BoldLinkButton({
  link,
  accent,
  index,
  isPreview = false,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  index: number;
  isPreview?: boolean;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative w-full px-7 py-6 text-left group overflow-hidden no-underline"
      style={{ borderRadius: '16px', fontFamily: 'var(--font-geist)', display: 'flex' }}
    >
      {/* Accent bar on left */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: `linear-gradient(180deg, ${accent}, oklch(0.65 0.18 280))`, transformOrigin: 'bottom' }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.magnetic, delay: 0.5 + index * 0.05 }}
      />

      {/* Full background sweep */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}12, transparent)` }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Glow ring on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          boxShadow: `0 0 0 2px ${accent}40, 0 25px 80px -25px ${accent}40`,
          borderRadius: '16px',
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Particle burst on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accent}15, transparent 70%)` }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Flex align="center" gap={6} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.06 }}
          className="flex-shrink-0 group-hover:scale-115 group-hover:rotate-6 transition-all duration-400"
          style={{
            width: 64,
            height: 64,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${accent}, oklch(0.65 0.18 280))`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.6rem',
            boxShadow: `0 12px 48px -12px ${accent}`,
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={3} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.05 }}
            className="font-semibold truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-geist)', fontSize: '1.25rem', letterSpacing: '-0.01em' }}
          >
            {link.label}
          </motion.span>
          <Text size="sm" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {link.url}
          </Text>
        </Flex>

        <Flex align="center" gap={4}>
          <motion.span
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.7, x: 15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ ...spring.gentle, delay: 0.8 + index * 0.05 }}
            style={{
              fontSize: '0.9rem',
              color: accent,
              fontFamily: 'var(--font-geist-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
            }}
          >
            {link.clicks.toLocaleString()}
          </motion.span>
          <Badge
            variant="ghost"
            size="sm"
            className="group-hover:bg-primary/15 group-hover:text-primary transition-all"
            style={{ fontSize: '0.75rem', fontFamily: 'var(--font-geist)', fontWeight: 700 }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </a>
  );
}

EssentialBoldTemplate.displayName = 'EssentialBoldTemplate';
