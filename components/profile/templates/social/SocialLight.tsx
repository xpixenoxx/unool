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
import { ChevronRight, Github, Linkedin, Twitter, Zap, Heart, MessageCircle, Share2, Users, Star } from 'lucide-react';

export function SocialLightTemplate({ profile, accentColor, isPreview }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#8b5cf6'; // Purple for social
  const secondaryAccent = '#ec4899'; // Pink
  const tertiaryAccent = '#06b6d4'; // Cyan
  const socialBg = 'oklch(0.97 0.01 300)';
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
      {/* Social Light Background - Airy & Clean */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, ${socialBg} 0%, ${socialCardBg} 50%, ${socialBg} 100%)`
        }} />
        {/* Soft gradient orbs */}
        <div
          className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[250px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${accent}30 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] rounded-full blur-[250px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}25 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full blur-[300px] opacity-12"
          style={{ background: `radial-gradient(ellipse at center, ${tertiaryAccent}20 0%, transparent 70%)` }}
        />
        {/* Subtle mesh gradient */}
        <div
          className="absolute inset-0 pointer-events-none opacity-3"
          style={{
            backgroundImage: `linear-gradient(135deg, ${accent}08 1px, transparent 1px), linear-gradient(45deg, ${secondaryAccent}08 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Orbital Background - Social Orbs (6 orbs for Light) */}
      <OrbitalBackground
        orbCount={6}
        orbSizes={[220, 180, 260, 140, 200, 160]}
        colors={[
          `oklch(0.68 0.18 280 / 0.12)`,
          `oklch(0.62 0.2 340 / 0.1)`,
          `oklch(0.72 0.15 200 / 0.08)`,
          `oklch(0.58 0.22 280 / 0.08)`,
          `oklch(0.65 0.16 280 / 0.06)`,
          `oklch(0.6 0.18 340 / 0.06)`,
        ]}
        speed={0.1}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blob - Soft Social Glows */}
      <MorphingBlob size={320} color={accent} opacity={0.12} speed={0.07} complexity={4} className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={260} color={secondaryAccent} opacity={0.08} speed={0.09} complexity={3} className="absolute bottom-1/3 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Parallax Layers - Floating Social Elements */}
      <ParallaxLayers strength={12} className="pointer-events-none">
        <ParallaxSocialElement x={10} y={18} size={24} color={accent} delay={0} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxSocialElement x={90} y={15} size={28} color={secondaryAccent} delay={0.3} icon="★" reducedMotion={reducedMotion} />
        <ParallaxSocialElement x={6} y={80} size={24} color={accent} delay={0.6} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxSocialElement x={94} y={85} size={28} color={secondaryAccent} delay={0.9} icon="★" reducedMotion={reducedMotion} />
        <ParallaxSocialElement x={48} y={8} size={24} color={tertiaryAccent} delay={0.1} icon="✦" reducedMotion={reducedMotion} />
        <ParallaxSocialElement x={95} y={48} size={24} color={accent} delay={0.4} icon="★" reducedMotion={reducedMotion} />
        <ParallaxSocialElement x={18} y={50} size={24} color={secondaryAccent} delay={0.7} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxSocialElement x={82} y={30} size={24} color={tertiaryAccent} delay={1} icon="✦" reducedMotion={reducedMotion} />
      </ParallaxLayers>

      <Stack space={8} className="relative max-w-[560px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* HEADER WITH AVATAR STACK */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <Stack space={4} align="center" className="text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4" style={{ borderColor: accent, background: `linear-gradient(135deg, ${accent}20, ${secondaryAccent}20)` }}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2rem', color: accent }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Follower avatar stack with pulse rings */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center -space-x-2 mt-3">
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.3 }}
                >
                  <Badge variant="outline" className="h-10 w-10 flex items-center justify-center text-xs px-0" style={{ fontFamily: 'var(--font-geist)', borderColor: accent, color: accent }}>
                    +{profile.links.filter(l => l.isVisible).length + 128}
                  </Badge>
                </motion.div>
              </div>
            </div>

            <Stack space={1} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.4 }}
                style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, letterSpacing: '-0.02em' }}
              >
                {profile.name}
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.5 }}
                  style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.45 0.02 300)' }}
                >
                  {profile.headline}
                </motion.p>
              )}
            </Stack>
          </Stack>
        </motion.div>

        {/* BIO */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
          >
            <MagneticCard
              radius={60}
              strength={0.1}
              className="w-full max-w-[500px] mx-auto"
              style={{
                background: socialCardBg,
                border: `1px solid ${socialBorder}`,
                borderRadius: '16px',
                padding: '1.5rem 2rem',
              }}
            >
              <motion.p
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.1 }}
                style={{ fontFamily: 'var(--font-geist)', fontSize: '1.0625rem', lineHeight: 1.7, color: 'oklch(0.3 0.02 300)', textAlign: 'center' }}
              >
                {profile.bio}
              </motion.p>
            </MagneticCard>
          </motion.div>
        )}

        {/* LINKS - MagneticCard with animated accents */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
          >
            <Stack space={2}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 12)
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
                      boxShadow: '0 2px 12px 0 oklch(0.68 0.18 280 / 0.08)',
                    }}
                  >
                    <motion.a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring.gentle, delay: 0.8 + index * 0.04 }}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left relative overflow-hidden rounded-[12px]"
                      style={{ fontFamily: 'var(--font-geist)' }}
                    >
                      {/* Animated left accent bar */}
                      <motion.div
                        className="absolute left-0 top-0 h-full w-1"
                        style={{ background: `linear-gradient(180deg, ${accent}, ${secondaryAccent})` }}
                        initial={reducedMotion ? { width: '0.25rem' } : { width: 0 }}
                        animate={{ width: '0.25rem' }}
                        transition={{ ...spring.snappy, delay: 0.9 + index * 0.04 }}
                      />
                      <motion.div
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 0.9 + index * 0.04 }}
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
                      </motion.div>
                      <Flex column gap={0.5} flex={1} className="min-w-0">
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: 0.9 + index * 0.04 }}
                          style={{ fontFamily: 'var(--font-geist)', fontWeight: 600, color: 'oklch(0.2 0.02 300)' }}
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
                        transition={{ ...spring.bouncy, delay: 1 + index * 0.04 }}
                        style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}
                      >
                        {link.clicks.toLocaleString()}
                      </motion.span>
                    </motion.a>
                  </MagneticCard>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* PROOFS - MagneticCard Badges */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.9 }}
          >
            <Flex gap={2} wrap centerX>
              {profile.proofs
                .slice(0, 4)
                .map((proof, index) => (
                  <motion.div
                    key={proof.id}
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring.bouncy, delay: 1 + index * 0.08 }}
                  >
                    <MagneticCard
                      radius={60}
                      strength={0.12}
                      className="px-4 py-2.5"
                      style={{
                        background: socialCardBg,
                        border: `1px solid ${socialBorder}`,
                        borderRadius: '9999px',
                      }}
                    >
                      <Flex gap={1.5} align="center">
                        {proof.icon && (
                          <motion.span
                            initial={reducedMotion ? {} : { scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ ...spring.bouncy, delay: 1.1 + index * 0.08 }}
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
          transition={{ ...spring.gentle, delay: 1.1 }}
          className="text-center pt-6"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: socialCardBg, border: `1px solid ${accent}30`, boxShadow: '0 2px 12px 0 oklch(0.68 0.18 280 / 0.08)' }}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
          </div>
        </motion.div>
      </Stack>
    </div>
  );
}

// ==================== PARALLAX SOCIAL ELEMENTS ====================

function ParallaxSocialElement({ x, y, size, color, delay, icon, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; icon: string; reducedMotion: boolean }) {
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

SocialLightTemplate.displayName = 'SocialLightTemplate';
