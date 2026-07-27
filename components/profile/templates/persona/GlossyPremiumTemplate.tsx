'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text, Heading, Overline } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MagneticCard, TiltCard } from '@/components/ui/3d';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ExternalLink, Sparkles, Star, Diamond, Gem, Sun, Zap, Crown, Shield } from 'lucide-react';

export function GlossyPremiumTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'oklch(0.8 0.18 300)'; // Glossy magenta-pink
  const secondaryAccent = 'oklch(0.75 0.16 60)'; // Glossy gold
  const tertiaryAccent = 'oklch(0.7 0.15 200)'; // Glossy cyan
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 10);
  const visibleProofs = profile.proofs.slice(0, 6);

  // Premium achievements
  const achievements = profile.proofs.filter(p =>
    p.type === 'badge' || p.type === 'certification'
  ).slice(0, 5);

  // Featured links (top 3)
  const featuredLinks = visibleLinks.slice(0, 3);
  const regularLinks = visibleLinks.slice(3);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '20px',
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
    >
      {/* Background: Ultra-glossy with multiple reflective layers */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        {/* Base gradient */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, oklch(0.98 0.01 300) 0%, oklch(0.95 0.02 320) 25%, oklch(0.93 0.02 340) 50%, oklch(0.9 0.03 20) 75%, oklch(0.92 0.02 200) 100%)'
        }} />

        {/* Glassmorphism layers */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[300px] opacity-40"
          style={{ background: `radial-gradient(ellipse at center, ${accent}30 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[300px] opacity-35"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}35 0%, transparent 55%)` }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[300px] opacity-30"
          style={{ background: `radial-gradient(ellipse at center, ${tertiaryAccent}25 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-[200px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, oklch(0.85 0.2 340)20 0%, transparent 60%)` }}
        />

        {/* Glossy reflection overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg,
                oklch(1 0 0 / 0.15) 0%,
                transparent 40%,
                transparent 60%,
                oklch(0 0 0 / 0.02) 100%
              ),
              linear-gradient(90deg,
                oklch(1 0 0 / 0.08) 0%,
                transparent 30%,
                transparent 70%,
                oklch(1 0 0 / 0.08) 100%
              )
            `
          }}
        />

        {/* Top glossy highlight bar */}
        <div
          className="absolute top-0 left-0 right-0 h-4"
          style={{ background: `linear-gradient(180deg, ${accent}40 0%, ${secondaryAccent}30 50%, ${tertiaryAccent}20 100%)` }}
        />

        {/* Animated shine sweep */}
        {!reducedMotion && (
          <motion.div
            className="absolute inset-0 -translate-x-full"
            style={{
              background: `linear-gradient(90deg,
                transparent 0%,
                oklch(1 0 0 / 0.1) 25%,
                oklch(1 0 0 / 0.25) 50%,
                oklch(1 0 0 / 0.1) 75%,
                transparent 100%
              )`,
              pointerEvents: 'none',
            }}
            animate={{ x: '300%' }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear', delay: 2 }}
          />
        )}

        {/* Subtle diamond pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000' fillOpacity='0.1'%3E%3Cpath d='M40 0L80 40L40 80L0 40ZM40 10L70 40L40 70L10 40Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Stack
        space={8}
        className="relative max-w-[600px] mx-auto px-4 py-12 sm:py-16"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Hero: Avatar + Name - Ultra glossy */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.1 }}
          className="text-center"
        >
          <Stack space={4} align="center">
            <div className="relative inline-block">
              {/* Multiple glossy rings */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="absolute inset-0 rounded-full -inset-6 pointer-events-none"
                style={{
                  background: `conic-gradient(from 0deg, ${accent}50, ${secondaryAccent}50, ${tertiaryAccent}50, ${accent}50)`,
                  filter: 'blur(32px)',
                  animation: reducedMotion ? 'none' : 'spin 30s linear infinite',
                }}
              />
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className="absolute inset-0 rounded-full -inset-3 pointer-events-none"
                style={{
                  border: `2px solid ${accent}40`,
                  borderRadius: '50%',
                  boxShadow: `
                    0 0 0 1px ${accent}30 inset,
                    0 0 0 1px ${secondaryAccent}20 inset,
                    0 8px 32px -8px ${accent}40,
                    0 0 60px -20px ${accent}30
                  `,
                }}
              />
              <Avatar className="h-32 w-32 sm:h-36 sm:w-36 ring-4 relative z-10" ringColor={accent}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback className="text-5xl sm:text-6xl font-bold" style={{ fontFamily: 'var(--font-sans)', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Glossy crown/badge */}
              <motion.div
                initial={{ scale: 0, rotate: -45, y: 20 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ ...spring.bouncy, delay: 0.6 }}
                className="absolute -bottom-3 -right-3"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`, boxShadow: `0 4px 20px -4px ${accent}50` }}>
                  <Crown className="w-5 h-5" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                  <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, ${accent}60, ${secondaryAccent}60)`, opacity: 0.3, filter: 'blur(4px)' }} />
                </div>
              </motion.div>
            </div>

            <Stack space={2} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.04em' }}
              >
                <span
                  style={{
                    background: `linear-gradient(135deg, oklch(0.15 0.02 300) 0%, ${accent} 25%, ${secondaryAccent} 50%, ${tertiaryAccent} 75%, oklch(0.2 0.02 320) 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    backgroundSize: '400% 400%',
                    animation: reducedMotion ? 'none' : 'gradientShift 6s ease-in-out infinite',
                  }}
                >
                  {profile.name}
                </span>
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.4 }}
                  className="text-lg text-muted-foreground/70 font-medium max-w-xl mx-auto"
                  style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                >
                  {profile.headline}
                </motion.p>
              )}

              {profile.company && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.45 }}
                  className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-sans)', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {profile.company}
                </motion.p>
              )}

              {/* Premium tier indicator */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...spring.bouncy, delay: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${accent}20, ${secondaryAccent}15, ${tertiaryAccent}15)`, border: `1px solid ${accent}40`, boxShadow: `0 4px 20px -4px ${accent}30, inset 0 1px 0 ${accent}40` }}>
                  <Diamond className="w-4 h-4" style={{ color: accent, animation: reducedMotion ? 'none' : 'spin 8s linear infinite' }} />
                  <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-sans)', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Glossy Premium
                  </Text>
                  <Sparkles className="w-4 h-4" style={{ color: tertiaryAccent }} />
                </div>
              </motion.div>
            </Stack>
          </Stack>
        </motion.div>

        {/* Featured Links - Large glossy cards */}
        {featuredLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.8 }}
            className="w-full"
          >
            <Stack space={4} className="w-full">
              {featuredLinks.map((link, index) => (
                <TiltCard
                  key={link.id}
                  maxTilt={reducedMotion ? 0 : 8}
                  scale={1.02}
                  className={cn('h-auto w-full', isPreview && 'opacity-80')}
                  style={{
                    borderRadius: '24px',
                    border: `1px solid ${accent}30`,
                    background: `linear-gradient(145deg,
                      oklch(1 0 0 / 0.9) 0%,
                      oklch(1 0 0 / 0.7) 50%,
                      ${accent}10 100%
                    )`,
                    backdropFilter: 'blur(30px)',
                    boxShadow: `
                      0 0 0 1px ${accent}30,
                      0 0 0 1px ${secondaryAccent}20 inset,
                      0 16px 48px -12px ${accent}35,
                      0 4px 16px -4px ${accent}25,
                      inset 0 1px 0 oklch(1 0 0 / 0.6),
                      inset 0 -1px 0 ${accent}15
                    `,
                  }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-7 py-6 text-left group no-underline flex items-center gap-5"
                    style={{ borderRadius: '24px', fontFamily: 'var(--font-sans)', display: 'flex' }}
                    onMouseEnter={() => isPreview && onLinkClick?.(link)}
                  >
                    {/* Glossy reflection on card */}
                    <motion.div
                      className="absolute inset-0 rounded-[24px] pointer-events-none opacity-0"
                      style={{
                        background: `linear-gradient(135deg,
                          oklch(1 0 0 / 0.3) 0%,
                          ${accent}40 30%,
                          ${secondaryAccent}30 60%,
                          ${tertiaryAccent}25 100%
                        )`,
                        boxShadow: `
                          inset 0 1px 0 oklch(1 0 0 / 0.5),
                          0 0 0 2px ${accent}40,
                          0 20px 60px -12px ${accent}40
                        `,
                      }}
                      whileHover={{ opacity: 1 }}
                      whileFocus={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />

                    {/* Animated glossy sweep */}
                    <motion.div
                      className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] rounded-full pointer-events-none opacity-0"
                      style={{
                        background: `radial-gradient(ellipse at center,
                          oklch(1 0 0 / 0.4) 0%,
                          ${accent}30 30%,
                          transparent 70%
                        )`,
                      }}
                      whileHover={{ opacity: 1, scale: 1.2 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />

                    <Flex align="center" gap={5} className="relative z-10 flex-1">
                      <motion.div
                        initial={reducedMotion ? {} : { scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...spring.bouncy, delay: index * 0.05 }}
                        className="flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500"
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: '16px',
                          background: `linear-gradient(135deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.5rem',
                          boxShadow: `
                            0 0 0 2px ${accent}60,
                            0 8px 24px -6px ${accent}50,
                            inset 0 1px 0 oklch(1 0 0 / 0.3)
                          `,
                        }}
                      >
                        {link.icon || link.label.charAt(0).toUpperCase()}
                      </motion.div>

                      <Flex column gap={2} flex={1} className="min-w-0">
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: index * 0.04 }}
                          className="font-bold truncate group-hover:text-primary transition-colors"
                          style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', letterSpacing: '-0.01em' }}
                        >
                          {link.label}
                        </motion.span>
                        <Text size="sm" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                          {link.url}
                        </Text>
                      </Flex>

                      <Flex align="center" gap={3}>
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8, x: 10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: 0.8 + index * 0.04 }}
                          style={{
                            fontSize: '0.85rem',
                            color: accent,
                            fontFamily: 'var(--font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 600,
                          }}
                        >
                          {link.clicks.toLocaleString()}
                        </motion.span>
                        <Badge variant="ghost" size="sm" className="group-hover:bg-primary/10 transition-colors" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-sans)', background: `${accent}20`, color: accent, fontWeight: 700 }}>
                          #{index + 1}
                        </Badge>
                      </Flex>
                    </Flex>
                  </a>
                </TiltCard>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Regular Links - Glossy cards */}
        {regularLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
            className="w-full"
          >
            <Stack space={3} className="w-full">
              {regularLinks.map((link, index) => (
                <MagneticCard
                  key={link.id}
                  radius={140}
                  strength={reducedMotion ? 0 : 0.18}
                  className={cn('w-full', isPreview && 'opacity-80')}
                  style={{
                    borderRadius: '18px',
                    border: `1px solid ${accent}25`,
                    background: `linear-gradient(145deg,
                      oklch(1 0 0 / 0.85) 0%,
                      oklch(1 0 0 / 0.6) 100%
                    )`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: `
                      0 0 0 1px ${accent}20,
                      0 8px 32px -8px ${accent}25,
                      0 2px 8px -2px ${secondaryAccent}15,
                      inset 0 1px 0 oklch(1 0 0 / 0.5)
                    `,
                  }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-5 py-4 text-left group no-underline flex items-center gap-4"
                    style={{ borderRadius: '18px', fontFamily: 'var(--font-sans)', display: 'flex' }}
                    onMouseEnter={() => isPreview && onLinkClick?.(link)}
                  >
                    {/* Glossy hover effect */}
                    <motion.div
                      className="absolute inset-0 rounded-[18px] pointer-events-none opacity-0"
                      style={{
                        background: `linear-gradient(135deg,
                          ${accent}35 0%,
                          ${secondaryAccent}25 50%,
                          ${tertiaryAccent}20 100%
                        )`,
                        boxShadow: `
                          inset 0 1px 0 oklch(1 0 0 / 0.4),
                          0 0 0 2px ${accent}40,
                          0 16px 48px -12px ${accent}35
                        `,
                      }}
                      whileHover={{ opacity: 1 }}
                      whileFocus={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    />

                    <Flex align="center" gap={4} className="relative z-10 flex-1">
                      <motion.div
                        initial={reducedMotion ? {} : { scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...spring.bouncy, delay: index * 0.04 }}
                        className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.125rem',
                          boxShadow: `0 4px 16px -4px ${accent}50`,
                        }}
                      >
                        {link.icon || link.label.charAt(0).toUpperCase()}
                      </motion.div>

                      <Flex column gap={1.5} flex={1} className="min-w-0">
                        <Text weight="semibold" className="truncate group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem' }}>
                          {link.label}
                        </Text>
                        <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                          {link.url}
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <motion.span
                          style={{ color: accent, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}
                        >
                          {link.clicks.toLocaleString()}
                        </motion.span>
                        <Badge variant="ghost" size="sm" className="group-hover:bg-primary/10 transition-colors" style={{ fontSize: '0.65rem', fontFamily: 'var(--font-sans)', background: `${accent}15`, color: accent, fontWeight: 700 }}>
                          #{index + 3 + index}
                        </Badge>
                      </Flex>
                    </Flex>
                  </a>
                </MagneticCard>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Achievements / Badges - Glossy pills */}
        {achievements.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1.0 }}
            className="w-full"
          >
            <Stack space={3} className="w-full">
              <Flex between align="center">
                <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', color: accent }}>
                  Achievements
                </Text>
                <Sparkles className="w-4 h-4" style={{ color: secondaryAccent }} />
              </Flex>
              <Flex gap={2.5} className="flex-wrap justify-center" wrap>
                {achievements.map((proof, index) => (
                  <motion.div
                    key={proof.id}
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.8, y: 10, rotate: -3 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    transition={{ ...spring.bouncy, delay: 1.1 + index * 0.07 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn('gap-2 py-2.5 px-4', isPreview && 'opacity-80')}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        borderColor: `${accent}40`,
                        background: `linear-gradient(145deg,
                          oklch(1 0 0 / 0.9) 0%,
                          oklch(1 0 0 / 0.7) 100%
                        )`,
                        backdropFilter: 'blur(15px)',
                        boxShadow: `
                          0 0 0 1px ${accent}30,
                          0 4px 16px -4px ${accent}20,
                          inset 0 1px 0 oklch(1 0 0 / 0.4)
                        `,
                        color: 'oklch(0.15 0.02 300)',
                      }}
                    >
                      {proof.icon && <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>{proof.icon}</span>}
                      {proof.title}
                      {proof.value && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{proof.value}</Text>}
                    </Badge>
                  </motion.div>
                ))}
              </Flex>
            </Stack>
          </motion.div>
        )}

        {/* Bio - Glossy card */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1.1 }}
            className="w-full"
          >
            <div className="relative p-6 rounded-2xl overflow-hidden" style={{
              background: `linear-gradient(145deg,
                oklch(1 0 0 / 0.9) 0%,
                oklch(1 0 0 / 0.7) 100%
              )`,
              border: `1px solid ${accent}30`,
              backdropFilter: 'blur(30px)',
              boxShadow: `
                0 0 0 1px ${accent}30,
                0 8px 32px -8px ${accent}25,
                inset 0 1px 0 oklch(1 0 0 / 0.5),
                inset 0 -1px 0 ${accent}15
              `,
            }}>
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}08 0%, ${secondaryAccent}05 50%, ${tertiaryAccent}05 100%)` }} />
              <div className="relative">
                <Text size="base" color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-sans)', fontWeight: 400, color: 'oklch(0.15 0.02 300)' }}>
                  {profile.bio}
                </Text>
              </div>
            </div>
          </motion.div>
        )}

        {/* Subdomain indicator - Ultra glossy */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring.bouncy, delay: 1.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{
            background: `linear-gradient(145deg,
              oklch(1 0 0 / 0.95) 0%,
              oklch(1 0 0 / 0.8) 100%
            )`,
            border: `1px solid ${accent}40`,
            backdropFilter: 'blur(20px)',
            boxShadow: `
              0 0 0 1px ${accent}40,
              0 8px 32px -8px ${accent}35,
              inset 0 1px 0 oklch(1 0 0 / 0.6)
            `,
          }}>
            <Gem className="w-5 h-5" style={{ background: `linear-gradient(135deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-mono)', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent}, ${tertiaryAccent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.02em' }}>
              {profile.subdomain}.unool.co
            </Text>
            <Sun className="w-5 h-5" style={{ background: `linear-gradient(135deg, ${secondaryAccent}, ${tertiaryAccent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
          </div>
        </motion.div>

        {/* Keyframes for glossy animations */}
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </Stack>
    </div>
  );
}

GlossyPremiumTemplate.displayName = 'GlossyPremiumTemplate';