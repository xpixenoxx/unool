'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers, PerspectiveFlip } from '@/components/ui/3d';
import { Flex, Stack, Box } from '@/components/ui/layout';
import { Heading, Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring, fadeIn, slideUp } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function EssentialMinimalTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Ambient Background */}
      <OrbitalBackground
        orbCount={2}
        orbSizes={[120, 80]}
        colors={['oklch(0.75 0.15 200 / 0.08)', 'oklch(0.7 0.12 280 / 0.06)']}
        speed={0.15}
        className="pointer-events-none"
      />

      {/* Subtle Morphing Blob Accent */}
      <MorphingBlob
        size={300}
        color="oklch(0.65 0.18 200 / 0.12)"
        speed={0.08}
        complexity={3}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <Stack space={10} className="relative max-w-[640px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero: Avatar + Name */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.standard}
          className="text-center"
        >
          <div className="relative inline-block mb-6">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${accent}20, transparent 70%)`,
                filter: 'blur(24px)',
                transform: 'scale(1.3)',
              }}
            />
            <Avatar className="h-28 w-28 ring-4 ring-offset-2 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-3xl font-medium">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.3 }}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-3 flex items-center justify-center"
              style={{
                background: accent,
                borderColor: 'var(--background)',
              }}
              aria-label="Active"
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--primary-foreground)' }}
                animate={{ scale: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          <Stack space={2}>
            <motion.h1
              initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.2 }}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-geist)' }}
            >
              {profile.name}
            </motion.h1>
            {profile.headline && (
              <motion.p
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.3 }}
                className="text-lg text-muted-foreground font-medium max-w-xl mx-auto"
                style={{ fontFamily: 'var(--font-geist)' }}
              >
                {profile.headline}
              </motion.p>
            )}
          </Stack>
        </motion.div>

        {/* Bio */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.4 }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, oklch(0.65 0.18 200 / 0.05) 0%, transparent 100%)',
                filter: 'blur(1px)',
              }}
            />
            <div
              className="relative p-6 sm:p-8 rounded-xl border"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--card)',
                boxShadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.08)',
              }}
            >
              <Text size="base" color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-geist)', textAlign: 'center' }}>
                {profile.bio}
              </Text>
            </div>
          </motion.div>
        )}

        {/* Links - Magnetic Cards */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.5 }}
          >
            <Stack space={3} className="w-full max-w-[640px]">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 12)
                .map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    radius={120}
                    strength={0.15}
                    className={cn('w-full', isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                    }}
                  >
                    <button
                      onClick={() => onLinkClick?.(link)}
                      className="relative w-full px-5 py-4.5 text-left overflow-hidden"
                      style={{
                        borderRadius: '10px',
                        fontFamily: 'var(--font-geist)',
                      }}
                    >
                      {/* Glow on hover */}
                      <motion.div
                        className="absolute inset-0 opacity-0"
                        style={{
                          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accent}15, transparent 70%)`,
                        }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />

                      <Flex align="center" gap={4} className="relative z-10">
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ ...spring.bouncy, delay: index * 0.04 }}
                          className="flex-shrink-0"
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                            color: 'var(--primary-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '1.25rem',
                            boxShadow: `0 4px 16px -4px ${accent}`,
                          }}
                        >
                          {link.icon || link.label.charAt(0).toUpperCase()}
                        </motion.div>

                        <Flex column gap={1.5} flex={1} className="min-w-0">
                          <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-geist)', fontSize: '1.05rem' }}>
                            {link.label}
                          </Text>
                          <Text size="sm" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
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
                              fontFamily: 'var(--font-geist-mono)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {link.clicks.toLocaleString()}
                          </motion.span>
                          <Badge variant="ghost" size="sm" style={{ fontSize: '0.65rem', fontFamily: 'var(--font-geist)' }}>
                            #{index + 1}
                          </Badge>
                        </Flex>
                      </Flex>
                    </button>
                  </MagneticCard>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
            className="w-full max-w-[640px]"
          >
            <Stack space={3}>
              {profile.proofs
                .slice(0, 6)
                .map((proof, index) => (
                  <MagneticCard
                    key={proof.id}
                    radius={100}
                    strength={0.1}
                    className={cn('w-full', isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '10px',
                      border: `1px solid ${accent}40`,
                      background: 'var(--card)',
                    }}
                  >
                    <div className="p-4.5 flex items-center gap-4">
                      {proof.icon && (
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ ...spring.bouncy, delay: 0.7 + index * 0.05 }}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                            color: 'var(--primary-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0,
                          }}
                        >
                          {proof.icon}
                        </motion.div>
                      )}
                      <Flex column gap={1.5} flex={1} className="min-w-0">
                        <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
                          {proof.title}
                        </Text>
                        {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>{proof.value}</Text>}
                      </Flex>
                    </div>
                  </MagneticCard>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* Subdomain indicator */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.8 }}
          className="text-center text-sm text-muted-foreground"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {profile.subdomain}.unool.co
        </motion.div>
      </Stack>
    </div>
  );
}

EssentialMinimalTemplate.displayName = 'EssentialMinimalTemplate';
