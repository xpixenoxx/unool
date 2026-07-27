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
import { ExternalLink, ChevronRight, Sparkles, Award, Star, Lock, Crown, Shield, Globe, TrendingUp } from 'lucide-react';

export function PremiumOpaqueTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'oklch(0.75 0.18 85)'; // Premium gold/amber
  const secondaryAccent = 'oklch(0.7 0.15 280)'; // Premium purple
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 12);
  const visibleProofs = profile.proofs.slice(0, 8);

  // Premium badges/certifications
  const premiumProofs = profile.proofs.filter(p =>
    p.type === 'badge' || p.type === 'certification' || p.title.toLowerCase().includes('premium')
  ).slice(0, 6);

  // KPIs
  const kpiProofs = profile.proofs.filter(p => p.type === 'metric').slice(0, 3);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '16px',
        fontFamily: 'var(--font-sans)',
        background: 'oklch(0.08 0.01 280)',
        color: 'oklch(0.98 0.01 280)',
      } as React.CSSProperties}
    >
      {/* Background: Deep dark with premium gradient orbs */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: 'oklch(0.08 0.01 280)' }} />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[300px] opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${accent}25 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full blur-[300px] opacity-12"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}20 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full blur-[300px] opacity-10"
          style={{ background: `radial-gradient(ellipse at center, oklch(0.6 0.15 340)15 0%, transparent 60%)` }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px),
              linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${secondaryAccent}, transparent)` }}
        />
      </div>

      <Stack
        space={8}
        className="relative max-w-[680px] mx-auto px-4 py-12 sm:py-16"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Hero: Avatar + Name - Premium glassmorphism */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.1 }}
          className="text-center"
        >
          <Stack space={4} align="center">
            <div className="relative inline-block">
              {/* Outer glow ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                className="absolute inset-0 rounded-full -inset-4 pointer-events-none"
                style={{
                  background: `conic-gradient(from 0deg, ${accent}40, ${secondaryAccent}40, ${accent}40)`,
                  filter: 'blur(24px)',
                  animation: reducedMotion ? 'none' : 'spin 20s linear infinite',
                }}
              />
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 relative z-10" ringColor={accent}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback className="text-4xl sm:text-5xl font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Premium badge on avatar */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...spring.bouncy, delay: 0.5 }}
                className="absolute -bottom-2 -right-2"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})` }}>
                  <Crown className="w-4 h-4" style={{ color: 'oklch(0.08 0.01 280)' }} />
                </div>
              </motion.div>
            </div>

            <Stack space={2} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em' }}
              >
                <span
                  style={{
                    background: `linear-gradient(135deg, oklch(1 0 0) 0%, ${accent} 40%, ${secondaryAccent} 70%, oklch(0.9 0.02 85) 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    backgroundSize: '300% 300%',
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
                  className="text-lg text-muted-foreground/80 font-medium max-w-xl mx-auto"
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
                  style={{ fontFamily: 'var(--font-sans)', color: accent }}
                >
                  {profile.company}
                </motion.p>
              )}
            </Stack>

            {/* Premium tier badge */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ ...spring.bouncy, delay: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}10)`, border: `1px solid ${accent}30` }}>
                <Sparkles className="w-4 h-4" style={{ color: accent }} />
                <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-sans)', color: accent }}>
                  Premium Member
                </Text>
              </div>
            </motion.div>
          </Stack>
        </motion.div>

        {/* KPI Strip - Premium cards with glassmorphism */}
        {kpiProofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
          >
            <Grid cols={{ base: 1, sm: 3 }} gap={4}>
              {kpiProofs.map((kpi, index) => (
                <TiltCard key={kpi.id} maxTilt={reducedMotion ? 0 : 6} scale={1.02} className="h-full">
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ ...spring.bouncy, delay: 0.7 + index * 0.08 }}
                    className="h-full p-5 rounded-2xl relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, oklch(0.12 0.01 280) 0%, oklch(0.1 0.01 280) 100%)',
                      border: `1px solid ${accent}20`,
                      backdropFilter: 'blur(20px)',
                      boxShadow: `0 0 0 1px ${accent}10, 0 8px 32px -8px ${accent}20, inset 0 1px 0 ${accent}15`,
                    }}
                  >
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${accent}08 0%, transparent 70%)` }} />
                    <div className="relative z-10 text-center">
                      <Flex center gap={1.5} className="mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}20, ${secondaryAccent}20)`, color: accent }}>
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </Flex>
                      <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', color: accent }}>
                        {kpi.title}
                      </Text>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 0.8 + index * 0.08 }}
                        className="text-3xl font-bold"
                        style={{
                          fontFamily: 'var(--font-sans)',
                          background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                        }}
                      >
                        {kpi.value}
                      </motion.span>
                      {kpi.description && (
                        <Text size="xs" color="muted" className="mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
                          {kpi.description}
                        </Text>
                      )}
                    </div>
                  </motion.div>
                </TiltCard>
              ))}
            </Grid>
          </motion.div>
        )}

        {/* Bio Card - Glassmorphism */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.8 }}
            className="w-full"
          >
            <div className="relative p-6 rounded-2xl overflow-hidden" style={{
              background: 'linear-gradient(145deg, oklch(0.12 0.01 280/0.8) 0%, oklch(0.1 0.01 280/0.6) 100%)',
              border: `1px solid ${accent}20`,
              backdropFilter: 'blur(20px)',
              boxShadow: `0 0 0 1px ${accent}10, 0 8px 32px -8px ${accent}20, inset 0 1px 0 ${accent}15`,
            }}>
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}05 0%, ${secondaryAccent}03 100%)` }} />
              <div className="relative">
                <Text size="base" color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-sans)', fontWeight: 400 }}>
                  {profile.bio}
                </Text>
              </div>
            </div>
          </motion.div>
        )}

        {/* Links - Premium glassmorphism cards with magnetic hover */}
        {visibleLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
            className="w-full"
          >
            <Stack space={3} className="w-full">
              {visibleLinks.map((link, index) => (
                <MagneticCard
                  key={link.id}
                  radius={120}
                  strength={reducedMotion ? 0 : 0.15}
                  className={cn('w-full', isPreview && 'opacity-80')}
                  style={{
                    borderRadius: '16px',
                    border: `1px solid ${accent}20`,
                    background: `linear-gradient(145deg, oklch(0.12 0.01 280) 0%, oklch(0.1 0.01 280) 100%)`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 0 0 1px ${accent}10, 0 4px 20px -4px ${accent}15, inset 0 1px 0 ${accent}10`,
                  }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-5 py-4 text-left group no-underline flex items-center gap-4"
                    style={{ borderRadius: '16px', fontFamily: 'var(--font-sans)', display: 'flex' }}
                    onMouseEnter={() => isPreview && onLinkClick?.(link)}
                  >
                    {/* Hover glow - premium */}
                    <motion.div
                      className="absolute inset-0 opacity-0 rounded-2xl pointer-events-none"
                      style={{
                        boxShadow: `0 0 0 2px ${accent}40, 0 12px 40px -8px ${accent}25`,
                        background: `linear-gradient(135deg, ${accent}08, ${secondaryAccent}05)`,
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
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                          color: 'oklch(0.08 0.01 280)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          boxShadow: `0 4px 16px -4px ${accent}`,
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
                          initial={reducedMotion ? {} : { opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: 0.6 + index * 0.03 }}
                          style={{
                            fontSize: '0.75rem',
                            color: accent,
                            fontFamily: 'var(--font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {link.clicks.toLocaleString()}
                        </motion.span>
                        <Badge variant="ghost" size="sm" className="group-hover:bg-primary/10 transition-colors" style={{ fontSize: '0.65rem', fontFamily: 'var(--font-sans)', background: `${accent}15`, color: accent }}>
                          #{index + 1}
                        </Badge>
                      </Flex>
                    </Flex>
                  </a>
                </MagneticCard>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Premium Badges / Certifications */}
        {premiumProofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1.0 }}
            className="w-full"
          >
            <Stack space={3} className="w-full">
              <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', color: accent }}>
                Certifications & Badges
              </Text>
              <Flex gap={2.5} className="flex-wrap justify-center" wrap>
                {premiumProofs.map((proof, index) => (
                  <motion.div
                    key={proof.id}
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ ...spring.bouncy, delay: 1.1 + index * 0.06 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn('gap-2 py-2 px-3.5', isPreview && 'opacity-80')}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.8rem',
                        borderColor: `${accent}40`,
                        background: `linear-gradient(145deg, oklch(0.12 0.01 280) 0%, oklch(0.1 0.01 280) 100%)`,
                        backdropFilter: 'blur(10px)',
                        boxShadow: `0 0 0 1px ${accent}15, inset 0 1px 0 ${accent}10`,
                        color: 'var(--foreground)',
                      }}
                    >
                      {proof.icon && <span style={{ fontSize: '1.1rem' }}>{proof.icon}</span>}
                      {proof.title}
                      {proof.value && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-mono)' }}>{proof.value}</Text>}
                    </Badge>
                  </motion.div>
                ))}
              </Flex>
            </Stack>
          </motion.div>
        )}

        {/* Subdomain indicator - Premium */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: `linear-gradient(145deg, oklch(0.12 0.01 280) 0%, oklch(0.1 0.01 280) 100%)`, border: `1px solid ${accent}25`, backdropFilter: 'blur(10px)' }}>
            <Lock className="w-4 h-4" style={{ color: accent }} />
            <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-mono)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
            <Sparkles className="w-4 h-4" style={{ color: accent }} />
          </div>
        </motion.div>
      </Stack>
    </div>
  );
}

PremiumOpaqueTemplate.displayName = 'PremiumOpaqueTemplate';