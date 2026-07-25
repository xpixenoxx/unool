'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, OrbitalParticles, LayeredGlowSystem } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink } from 'lucide-react';

export function SocialMaxTemplate({ profile, accentColor, isPreview }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#8b5cf6';
  const secondaryAccent = '#ec4899';
  const tertiaryAccent = '#06b6d4';
  const accentGold = '#fbbf24';
  const socialBg = 'oklch(0.08 0.02 280)';
  const socialCardBg = 'oklch(0.11 0.02 280)';
  const socialBorder = 'oklch(0.18 0.02 280)';
  const socialHeaderBg = 'oklch(0.13 0.02 280)';

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '0',
        '--profile-shadow': 'none',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* FULL-BLEED IMMERSIVE BACKGROUND */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        {/* Quad MorphingBlob - Maximum impact */}
        <MorphingBlob size={480} color={accent} opacity={0.18} speed={0.1} complexity={6} className="absolute top-1/4 left-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <MorphingBlob size={400} color={secondaryAccent} opacity={0.14} speed={0.08} complexity={5} className="absolute top-1/3 right-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <MorphingBlob size={340} color={tertiaryAccent} opacity={0.12} speed={0.09} complexity={4} className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <MorphingBlob size={280} color={accentGold} opacity={0.1} speed={0.07} complexity={3} className="absolute bottom-1/3 right-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Triple OrbitalBackground */}
        <div className="absolute inset-0 pointer-events-none">
          <OrbitalBackground
            orbCount={14}
            orbSizes={[350, 260, 400, 200, 320, 180, 380, 160, 300, 220, 360, 140, 280, 240]}
            colors={[
              `oklch(0.68 0.18 280 / 0.22)`,
              `oklch(0.62 0.2 340 / 0.2)`,
              `oklch(0.72 0.15 200 / 0.18)`,
              `oklch(0.58 0.22 280 / 0.18)`,
              `oklch(0.65 0.16 280 / 0.15)`,
              `oklch(0.6 0.18 340 / 0.15)`,
              `oklch(0.68 0.18 280 / 0.12)`,
              `oklch(0.62 0.2 340 / 0.12)`,
              `oklch(0.7 0.15 200 / 0.1)`,
              `oklch(0.55 0.22 280 / 0.1)`,
              `oklch(0.6 0.18 340 / 0.08)`,
              `oklch(0.55 0.16 280 / 0.08)`,
              `oklch(0.65 0.18 280 / 0.06)`,
              `oklch(0.6 0.2 340 / 0.06)`,
            ]}
            speed={0.18}
            className="opacity-30"
          />
          <OrbitalBackground
            orbCount={8}
            orbSizes={[280, 340, 220, 300, 180, 260, 200, 320]}
            colors={[
              `oklch(0.65 0.2 340 / 0.15)`,
              `oklch(0.7 0.18 340 / 0.12)`,
              `oklch(0.6 0.22 300 / 0.1)`,
              `oklch(0.68 0.16 340 / 0.1)`,
              `oklch(0.55 0.2 340 / 0.08)`,
              `oklch(0.62 0.18 300 / 0.08)`,
              `oklch(0.7 0.16 340 / 0.06)`,
              `oklch(0.58 0.2 340 / 0.06)`,
            ]}
            speed={0.25}
            className="opacity-20"
          />
          <OrbitalBackground
            orbCount={5}
            orbSizes={[300, 220, 280, 180, 240]}
            colors={[
              `oklch(0.7 0.18 200 / 0.1)`,
              `oklch(0.65 0.2 200 / 0.08)`,
              `oklch(0.72 0.16 200 / 0.06)`,
              `oklch(0.6 0.22 180 / 0.06)`,
              `oklch(0.58 0.18 200 / 0.04)`,
            ]}
            speed={0.35}
            className="opacity-15"
          />
        </div>

        {/* Orbital Particles - Maximum density */}
        <OrbitalParticles
          count={100}
          size={3}
          color={accent}
          opacity={0.25}
          speed={0.1}
          className="pointer-events-none"
        />

        {/* Layered Glow System - Max intensity */}
        <LayeredGlowSystem
          layers={5}
          baseColor={accent}
          className="pointer-events-none"
        />

        {/* Floating social elements */}
        <SocialMaxFloatingElements accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} accentGold={accentGold} reducedMotion={reducedMotion} />
      </div>

      {/* MAIN FEED */}
      <main className="relative z-10 min-h-screen">
        {/* CONTENT */}
        <Stack space={0} className="max-w-3xl mx-auto px-4 pb-16" style={{ fontFamily: 'var(--font-geist)' }}>
          {/* PROFILE HERO SECTION */}
          <motion.section
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.3 }}
            className="relative py-12"
          >
            <Stack space={4} align="center" className="text-center">
              <div className="relative">
                {/* Triple pulse rings */}
                <motion.div
                  className="absolute -inset-3 rounded-full border-2"
                  style={{ borderColor: accent }}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -inset-7 rounded-full border-2"
                  style={{ borderColor: secondaryAccent, opacity: 0.4 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.05, 0.6] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
                <motion.div
                  className="absolute -inset-11 rounded-full border-2"
                  style={{ borderColor: tertiaryAccent, opacity: 0.2 }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.02, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
                <Avatar className="h-28 w-28 border-4 relative" style={{ borderColor: accent }}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2.5rem', color: accent }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Stack space={1}>
                <motion.h1
                  initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.4 }}
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, letterSpacing: '-0.04em', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
                >
                  {profile.name}
                </motion.h1>

                {profile.headline && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.5 }}
                    style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)', fontSize: '1.125rem' }}
                  >
                    {profile.headline}
                  </motion.p>
                )}
              </Stack>

              {/* Stats Row */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.6 }}
              >
                <Flex gap={8} wrap centerX>
                  <StatItem value={profile.links.filter(l => l.isVisible).length} label="Links" color={accent} />
                  <StatDivider />
                  <StatItem value={profile.links.filter(l => l.isVisible).length + 128} label="Followers" color={secondaryAccent} />
                  <StatDivider />
                  <StatItem value={formatCount(profile.links.reduce((sum, l) => sum + l.clicks, 0))} label="Total Clicks" color={tertiaryAccent} />
                  <StatDivider />
                  <StatItem value={profile.proofs.length} label="Proofs" color={accentGold} />
                </Flex>
              </motion.div>

              {/* Followers Badge */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.7 }}
                className="flex items-center justify-center -space-x-2 mt-4"
              >
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.8 }}
                >
                  <Badge variant="outline" className="h-10 w-10 flex items-center justify-center text-xs px-0" style={{ fontFamily: 'var(--font-geist)', borderColor: accent, color: accent }}>
                    +{profile.links.filter(l => l.isVisible).length + 128}
                  </Badge>
                </motion.div>
              </motion.div>

              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 1 }}
              >
                <Button variant="ghost" className="mt-2" style={{ fontFamily: 'var(--font-syne)', borderColor: accent, color: accent }}>
                  <Users className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              </motion.div>
            </Stack>
          </motion.section>

          {/* BIO CARD */}
          {profile.bio && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.8 }}
              className="px-4 pb-8"
            >
              <MagneticCard
                radius={60}
                strength={0.1}
                className="w-full"
                style={{
                  background: `${socialCardBg}E6`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${socialBorder}`,
                  borderRadius: '16px',
                  padding: '1.5rem 2rem',
                }}
              >
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.gentle, delay: 0.1 }}
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.125rem', lineHeight: 1.7, color: 'oklch(0.9 0.02 280)', textAlign: 'center' }}
                >
                  {profile.bio}
                </motion.p>
              </MagneticCard>
            </motion.section>
          )}

          {/* LINKS BAR - Grid of MagneticCards */}
          <motion.section
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
            className="px-4 pb-8"
          >
            <Grid cols={{ base: 1, sm: 2, md: 3, xl: 4 }} gap={3}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 16)
                .map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    radius={80}
                    strength={0.15}
                    className={cn(isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '12px',
                      border: `1px solid ${socialBorder}`,
                      background: socialCardBg,
                      boxShadow: '0 4px 16px -4px oklch(0.68 0.18 280 / 0.1)',
                    }}
                  >
                    <motion.a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring.gentle, delay: 1 + index * 0.03 }}
                      className="w-full p-3 text-left relative overflow-hidden rounded-[10px]"
                      style={{ fontFamily: 'var(--font-geist)' }}
                    >
                      {/* Animated top accent */}
                      <motion.div
                        className="absolute top-0 left-0 w-full h-0.5"
                        style={{ background: `linear-gradient(90deg, ${accent}, ${secondaryAccent})` }}
                        initial={reducedMotion ? { width: '100%' } : { width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ ...spring.snappy, delay: 1.1 + index * 0.03 }}
                      />
                      <Flex align="center" gap={2}>
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ ...spring.bouncy, delay: 1.1 + index * 0.03 }}
                          className="flex items-center justify-center font-medium"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                            color: 'white',
                            fontSize: '0.875rem',
                            fontFamily: 'var(--font-geist)',
                          }}
                        >
                          {link.icon || link.label.charAt(0).toUpperCase()}
                        </motion.div>
                        <Flex column gap={0.5} flex={1} className="min-w-0">
                          <motion.span
                            initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...spring.gentle, delay: 1.1 + index * 0.03 }}
                            style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, color: 'oklch(0.9 0.02 280)', fontSize: '0.875rem' }}
                          >
                            {link.label}
                          </motion.span>
                          <Text size="xs" className="truncate font-mono" style={{ color: 'oklch(0.5 0.02 280)', fontFamily: 'var(--font-geist-mono)' }}>
                            {link.clicks.toLocaleString()} clicks
                          </Text>
                        </Flex>
                      </Flex>
                    </motion.a>
                  </MagneticCard>
                ))}
            </Grid>
          </motion.section>

        {/* SUBDOMAIN */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
          className="text-center pt-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{ background: socialCardBg, border: `1px solid ${accent}30`, boxShadow: '0 2px 12px 0 oklch(0.68 0.18 280 / 0.08)' }}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
          </div>
        </motion.div>
      </Stack>
    </main>
  </div>
);
}

function SocialMaxFloatingElements({ accent, secondaryAccent, tertiaryAccent, accentGold, reducedMotion }: { accent: string; secondaryAccent: string; tertiaryAccent: string; accentGold: string; reducedMotion: boolean }) {
  const elements = [
    { x: 8, y: 12, size: 24, color: accent, delay: 0, icon: "✨" },
    { x: 92, y: 10, size: 28, color: secondaryAccent, delay: 0.3, icon: "★" },
    { x: 5, y: 85, size: 24, color: accent, delay: 0.6, icon: "✨" },
    { x: 95, y: 90, size: 28, color: secondaryAccent, delay: 0.9, icon: "★" },
    { x: 48, y: 5, size: 24, color: tertiaryAccent, delay: 0.1, icon: "✦" },
    { x: 95, y: 48, size: 24, color: accentGold, delay: 0.4, icon: "◆" },
    { x: 12, y: 50, size: 24, color: secondaryAccent, delay: 0.7, icon: "✨" },
    { x: 88, y: 25, size: 24, color: tertiaryAccent, delay: 1, icon: "✦" },
    { x: 25, y: 15, size: 24, color: accent, delay: 1.2, icon: "★" },
    { x: 75, y: 82, size: 24, color: secondaryAccent, delay: 1.5, icon: "✦" },
    { x: 60, y: 8, size: 24, color: accentGold, delay: 1.8, icon: "◆" },
    { x: 90, y: 65, size: 24, color: accent, delay: 2.1, icon: "✨" },
    { x: 35, y: 90, size: 24, color: tertiaryAccent, delay: 2.4, icon: "✦" },
    { x: 15, y: 30, size: 24, color: secondaryAccent, delay: 2.7, icon: "★" },
    { x: 85, y: 70, size: 24, color: accentGold, delay: 3, icon: "◆" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25" aria-hidden="true">
      {elements.map((el, i) => (
        <SocialMaxFloatElement key={i} {...el} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function SocialMaxFloatElement({ x, y, size, color, delay, icon, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; icon: string; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.5,
    fontSize: size,
    color,
  };

  if (reducedMotion) {
    return <div className="absolute" style={style}>{icon}</div>;
  }

  return (
    <motion.div
      style={style}
      animate={{
        y: [-18, 18, -18],
        x: [-12, 12, -12],
        opacity: [0.3, 0.7, 0.3],
        rotate: [-10, 10, -10],
        scale: [1, 1.15, 1],
      }}
      transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {icon}
    </motion.div>
  );
}

SocialMaxTemplate.displayName = 'SocialMaxTemplate';

// ==================== STAT ITEM ====================

function StatItem({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <Flex column gap={0.5} align="center">
      <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color }}>
        {value}
      </Text>
      <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Text>
    </Flex>
  );
}

function StatDivider() {
  return <div className="w-px h-6" style={{ background: 'oklch(0.2 0.02 280)' }} />;
}
