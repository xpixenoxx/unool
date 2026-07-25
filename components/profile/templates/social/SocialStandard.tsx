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
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ChevronRight } from 'lucide-react';

export function SocialStandardTemplate({ profile, accentColor, isPreview }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#8b5cf6'; // Purple for social
  const secondaryAccent = '#ec4899'; // Pink
  const tertiaryAccent = '#06b6d4'; // Cyan
  const socialBg = 'oklch(0.97 0.015 300)';
  const socialCardBg = 'oklch(1 0 0)';
  const socialBorder = 'oklch(0.88 0.02 300)';

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Social Standard Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, ${socialBg} 0%, ${socialCardBg} 40%, ${socialBg} 100%)`
        }} />
        {/* Gradient orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[250px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${accent}30 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full blur-[250px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}25 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full blur-[300px] opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${tertiaryAccent}20 0%, transparent 70%)` }}
        />
        {/* Subtle social pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-2"
          style={{
            backgroundImage: `linear-gradient(45deg, ${accent}08 1px, transparent 1px), linear-gradient(-45deg, ${accent}08 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Orbital Background - 6 Orbs for Standard */}
      <OrbitalBackground
        orbCount={6}
        orbSizes={[240, 180, 300, 140, 220, 160]}
        colors={[
          `oklch(0.68 0.18 280 / 0.15)`,
          `oklch(0.62 0.2 340 / 0.12)`,
          `oklch(0.72 0.15 200 / 0.1)`,
          `oklch(0.58 0.22 280 / 0.1)`,
          `oklch(0.65 0.16 280 / 0.08)`,
          `oklch(0.6 0.18 340 / 0.08)`,
        ]}
        speed={0.12}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blob - Social Glows */}
      <MorphingBlob size={340} color={accent} opacity={0.14} speed={0.07} complexity={4} className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={280} color={secondaryAccent} opacity={0.1} speed={0.09} complexity={3} className="absolute bottom-1/4 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Parallax Layers - Floating Social Elements */}
      <ParallaxLayers strength={12} className="pointer-events-none">
        <ParallaxStandardSocial x={12} y={15} size={24} color={accent} delay={0} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxStandardSocial x={88} y={12} size={28} color={secondaryAccent} delay={0.3} icon="★" reducedMotion={reducedMotion} />
        <ParallaxStandardSocial x={8} y={82} size={24} color={accent} delay={0.6} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxStandardSocial x={92} y={88} size={28} color={secondaryAccent} delay={0.9} icon="★" reducedMotion={reducedMotion} />
        <ParallaxStandardSocial x={50} y={8} size={24} color={tertiaryAccent} delay={0.1} icon="✦" reducedMotion={reducedMotion} />
        <ParallaxStandardSocial x={95} y={50} size={24} color={accent} delay={0.4} icon="★" reducedMotion={reducedMotion} />
        <ParallaxStandardSocial x={15} y={50} size={24} color={secondaryAccent} delay={0.7} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxStandardSocial x={85} y={25} size={24} color={tertiaryAccent} delay={1} icon="✦" reducedMotion={reducedMotion} />
      </ParallaxLayers>

      <Stack space={8} className="relative max-w-[640px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* HEADER */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <Stack space={3} align="center" className="text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4" style={{ borderColor: accent }}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2rem', color: accent }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Pulse ring */}
              <motion.div
                className="absolute -inset-2 rounded-full border-2"
                style={{ borderColor: `${accent}30` }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <Stack space={1} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.3 }}
                style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, letterSpacing: '-0.02em' }}
              >
                {profile.name}
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.4 }}
                  style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.45 0.02 300)' }}
                >
                  {profile.headline}
                </motion.p>
              )}
            </Stack>

            {/* Stats Row */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.5 }}
            >
              <Flex gap={5} centerX>
                <Flex column gap={0.25} align="center">
                  <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                    {profile.links.filter(l => l.isVisible).length}
                  </Text>
                  <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 300)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Links
                  </Text>
                </Flex>
                <Flex column gap={0.25} align="center">
                  <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: secondaryAccent }}>
                    {profile.links.reduce((sum, l) => sum + l.clicks, 0).toLocaleString()}
                  </Text>
                  <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 300)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Clicks
                  </Text>
                </Flex>
                <Flex column gap={0.25} align="center">
                  <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: tertiaryAccent }}>
                    {profile.proofs.length}
                  </Text>
                  <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 300)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Proofs
                  </Text>
                </Flex>
              </Flex>
            </motion.div>
          </Stack>
        </motion.div>

        {/* BIO */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
          >
            <div className="relative text-center" style={{ background: socialCardBg, border: `1px solid ${socialBorder}`, borderRadius: '12px', padding: '1.5rem' }}>
              <motion.p
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.1 }}
                style={{ fontFamily: 'var(--font-geist)', fontSize: '1.0625rem', lineHeight: 1.7, color: 'oklch(0.3 0.02 300)' }}
              >
                {profile.bio}
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* LINKS - MagneticCard with Animated Accent */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
          >
            <div style={{ height: '1px', background: socialBorder, marginBottom: '1rem' }} />
            <Stack space={2}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 20)
                .map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    radius={80}
                    strength={0.15}
                    className={cn('w-full', isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '12px',
                      border: `1px solid ${socialBorder}`,
                      background: socialCardBg,
                      padding: '0.5rem',
                    }}
                  >
                    <motion.a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring.gentle, delay: 1 + index * 0.04 }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left relative overflow-hidden rounded-[10px]"
                      style={{ fontFamily: 'var(--font-geist)' }}
                    >
                      {/* Animated left accent bar */}
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-l-full"
                        style={{ background: `linear-gradient(180deg, ${accent}, ${secondaryAccent})` }}
                        initial={reducedMotion ? { height: '2rem' } : { height: 0 }}
                        animate={{ height: '2rem' }}
                        transition={{ ...spring.snappy, delay: 1.1 + index * 0.04 }}
                      />
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 1.1 + index * 0.04 }}
                        className="flex items-center justify-center font-medium"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                          color: 'white',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-geist)',
                        }}
                      >
                        {link.icon || link.label.charAt(0).toUpperCase()}
                      </motion.span>
                      <Flex column gap={0.5} flex={1} className="min-w-0">
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: 1.1 + index * 0.04 }}
                          style={{ fontFamily: 'var(--font-geist)', fontWeight: 600, color: 'oklch(0.25 0.02 300)' }}
                        >
                          {link.label}
                        </motion.span>
                        <Text size="xs" className="truncate font-mono" style={{ color: 'oklch(0.5 0.02 300)', fontFamily: 'var(--font-geist-mono)' }}>
                          {link.url}
                        </Text>
                      </Flex>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 1.2 + index * 0.04 }}
                        style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem' }}
                      >
                        {link.clicks.toLocaleString()}
                      </motion.span>
                    </motion.a>
                  </MagneticCard>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* PROOFS - Badge Row with MagneticCard */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 1 }}
          >
            <Flex gap={2} wrap centerX>
              {profile.proofs
                .slice(0, 4)
                .map((proof, index) => (
                  <motion.div
                    key={proof.id}
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring.bouncy, delay: 1.1 + index * 0.08 }}
                  >
                    <MagneticCard
                      radius={60}
                      strength={0.1}
                      className="px-4 py-2"
                      style={{
                        background: socialCardBg,
                        border: `1px solid ${socialBorder}`,
                        borderRadius: '9999px',
                      }}
                    >
                      <Flex gap={1.5} align="center">
                        {proof.icon && (
                          <motion.span
                            initial={reducedMotion ? {} : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ ...spring.bouncy, delay: 1.2 + index * 0.08 }}
                            style={{ fontSize: '1.125rem' }}
                          >
                            {proof.icon}
                          </motion.span>
                        )}
                        <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.3 0.02 300)' }}>
                          {proof.title}
                        </Text>
                        {proof.value && (
                          <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                            {proof.value}
                          </Text>
                        )}
                      </Flex>
                    </MagneticCard>
                  </motion.div>
                ))}
            </Flex>
          </motion.div>
        )}

        {/* SUBDOMAIN */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
          className="text-center pt-6"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{ background: socialCardBg, border: `1px solid ${accent}30`, boxShadow: '0 2px 12px 0 oklch(0.68 0.18 280 / 0.08)' }}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
          </div>
        </motion.div>
      </Stack>
    </div>
  );
}

// ==================== ENGAGEMENT BUTTON ====================

function EngagementButton({ icon: Icon, count, color, hoverColor, iconText }: { icon: React.ElementType; count: number; color: string; hoverColor: string; iconText: string }) {
  return (
    <button
      className="flex items-center gap-1.5 transition-colors"
      style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem', color }}
      onMouseEnter={(e) => { e.currentTarget.style.color = hoverColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = color; }}
    >
      <Icon className="h-4 w-4" />
      <span>{count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}</span>
    </button>
  );
}

// ==================== PARALLAX STANDARD SOCIAL ELEMENTS ====================

function ParallaxStandardSocial({ x, y, size, color, delay, icon, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; icon: string; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.35,
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
        y: [-12, 12, -12],
        x: [-8, 8, -8],
        opacity: [0.2, 0.5, 0.2],
        rotate: [-5, 5, -5],
      }}
      transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {icon}
    </motion.div>
  );
}

SocialStandardTemplate.displayName = 'SocialStandardTemplate';
