'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, ParallaxLayers } from '@/components/ui/3d';
import { Flex, Stack, Box } from '@/components/ui/layout';
import { Heading, Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function EssentialLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.standard;

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Airy Gradient Mesh Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-30"
          style={{
            background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`,
            transformOrigin: 'center',
          }}
        />
        <div
          className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full blur-[200px] opacity-20"
          style={{
            background: `radial-gradient(circle, oklch(0.7 0.12 280) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Orbital Background - subtle */}
      <OrbitalBackground
        orbCount={3}
        orbSizes={[100, 150, 80]}
        colors={[
          `oklch(0.75 0.15 200 / 0.06)`,
          `oklch(0.7 0.12 280 / 0.05)`,
          `oklch(0.8 0.1 200 / 0.04)`,
        ]}
        speed={0.1}
        className="pointer-events-none"
      />

      <Stack space={10} className="relative max-w-[680px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.standard}
          className="text-center relative"
        >
          {/* Floating accent ring behind avatar */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full pointer-events-none"
            style={{
              border: `2px solid ${accent}40`,
              borderRadius: '50%',
            }}
            animate={{ rotate: reducedMotion ? 0 : 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
            style={{
              border: `2px solid ${accent}20`,
              borderRadius: '50%',
            }}
            animate={{ rotate: reducedMotion ? 0 : -360, scale: [1, 1.05, 1] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative inline-block mb-6">
            <Avatar className="h-30 w-30 ring-4 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-4xl font-medium">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
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
                animate={{ scale: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          <Stack space={3}>
            <motion.h1
              initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.3 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                fontFamily: 'var(--font-geist)',
                backgroundImage: `linear-gradient(135deg, ${accent}, oklch(0.7 0.12 280))`,
              }}
            >
              {profile.name}
            </motion.h1>
            {profile.headline && (
              <motion.p
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.4 }}
                className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto"
                style={{ fontFamily: 'var(--font-geist)', fontWeight: 500 }}
              >
                {profile.headline}
              </motion.p>
            )}
          </Stack>
        </motion.div>

        {/* Bio with subtle card */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.5 }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${accent}10 0%, oklch(0.7 0.12 280 / 0.06) 100%)`,
              }}
            />
            <div className="relative p-7 sm:p-8 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <Text size="lg" color="foreground" style={{ lineHeight: 1.85, fontFamily: 'var(--font-geist)', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                {profile.bio}
              </Text>
            </div>
          </motion.div>
        )}

        {/* Links - Magnetic Cards with Spring */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
          >
            <Stack space={4} className="w-full max-w-[680px]">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 12)
                .map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    radius={140}
                    strength={0.18}
                    className={cn('w-full', isPreview && 'opacity-75')}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                    }}
                  >
                    <button
                      onClick={() => onLinkClick?.(link)}
                      className="relative w-full px-6 py-5 text-left group overflow-hidden"
                      style={{ borderRadius: '12px', fontFamily: 'var(--font-geist)' }}
                    >
                      {/* Animated gradient border on hover */}
                      <motion.div
                        className="absolute inset-0 opacity-0"
                        style={{
                          background: `linear-gradient(135deg, ${accent}20, transparent 50%, oklch(0.7 0.12 280 / 0.15))`,
                        }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      />

                      {/* Shimmer sweep */}
                      <motion.div
                        className="absolute inset-0 -translate-x-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        }}
                        whileHover={{ x: '200%' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />

                      <Flex align="center" gap={4} className="relative z-10">
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ ...spring.bouncy, delay: index * 0.05 }}
                          className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                            color: 'var(--primary-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '1.3rem',
                            boxShadow: `0 6px 24px -6px ${accent}`,
                          }}
                        >
                          {link.icon || link.label.charAt(0).toUpperCase()}
                        </motion.div>

                        <Flex column gap={2} flex={1} className="min-w-0">
                          <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-geist)', fontSize: '1.1rem' }}>
                            {link.label}
                          </Text>
                          <Text size="sm" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                            {link.url}
                          </Text>
                        </Flex>

                        <Flex align="center" gap={3}>
                          <motion.span
                            initial={reducedMotion ? {} : { opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...spring.gentle, delay: 0.7 + index * 0.04 }}
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
                          <Badge variant="ghost" size="sm" className="group-hover:bg-primary/10 transition-colors" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-geist)' }}>
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

        {/* Proof Points with hover lift */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
            className="w-full max-w-[680px]"
          >
            <Stack space={3}>
              {profile.proofs
                .slice(0, 6)
                .map((proof, index) => (
                  <MagneticCard
                    key={proof.id}
                    radius={120}
                    strength={0.12}
                    className={cn('w-full', isPreview && 'opacity-75')}
                    style={{
                      borderRadius: '12px',
                      border: `1px solid ${accent}30`,
                      background: `linear-gradient(135deg, var(--card) 0%, ${accent}05 100%)`,
                    }}
                  >
                    <div className="p-5 flex items-center gap-4 group-hover:gap-5 transition-gap duration-300">
                      {proof.icon && (
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ ...spring.bouncy, delay: 0.8 + index * 0.06 }}
                          className="group-hover:rotate-6 transition-transform duration-300"
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                            color: 'var(--primary-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            flexShrink: 0,
                          }}
                        >
                          {proof.icon}
                        </motion.div>
                      )}
                      <Flex column gap={2} flex={1} className="min-w-0">
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

        {/* Subdomain */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring.gentle, delay: 0.9 }}
          className="text-center text-sm text-muted-foreground"
          style={{ fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.02em' }}
        >
          <span style={{ color: accent, fontWeight: 500 }}>{profile.subdomain}</span>.unool.co
        </motion.div>
      </Stack>
    </div>
  );
}

EssentialLightTemplate.displayName = 'EssentialLightTemplate';
