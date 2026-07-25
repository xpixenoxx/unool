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
import { spring, slideUp, fadeIn } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function EssentialStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Layered Gradient Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[250px] opacity-40"
          style={{ background: `radial-gradient(circle at 30% 30%, ${accent}25, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[250px] opacity-30"
          style={{ background: `radial-gradient(circle at 70% 70%, oklch(0.65 0.15 280 / 0.3), transparent 60%)` }}
        />
      </div>

      {/* Orbital Background - balanced */}
      <OrbitalBackground
        orbCount={4}
        orbSizes={[140, 100, 180, 80]}
        colors={[
          `oklch(0.72 0.16 200 / 0.08)`,
          `oklch(0.68 0.14 280 / 0.07)`,
          `oklch(0.75 0.12 200 / 0.05)`,
          `oklch(0.7 0.18 280 / 0.06)`,
        ]}
        speed={0.12}
        className="pointer-events-none"
      />

      {/* Morphing Blob as hero accent */}
      <MorphingBlob
        size={400}
        color={accent}
        opacity={0.15}
        speed={0.07}
        complexity={4}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <Stack space={10} className="relative max-w-[720px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero Section */}
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="text-center relative"
        >
          {/* Glow behind avatar */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none blur-xl"
            style={{ background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative inline-block mb-7">
            <Avatar className="h-32 w-32 ring-4 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-4xl font-semibold">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Status pulse ring */}
            <motion.div
              className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full border-3 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                borderColor: 'var(--background)',
                boxShadow: `0 0 0 4px ${accent}20, 0 8px 32px -8px ${accent}`,
              }}
              animate={{ scale: [1, 1.05, 1], rotate: reducedMotion ? 0 : 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              aria-label="Active"
            >
              <motion.div
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: 'var(--primary-foreground)' }}
                animate={{ scale: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Rotating accent border */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${accent}30` }}
              animate={{ rotate: reducedMotion ? 0 : 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <Stack space={4}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                opacity: { ...spring.gentle, delay: 0.1 },
                y: { ...spring.gentle, delay: 0.1 },
                backgroundPosition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                fontFamily: 'var(--font-geist)',
                backgroundImage: `linear-gradient(135deg, ${accent}, oklch(0.7 0.12 280), ${accent})`,
                backgroundSize: '200% 200%',
              }}
            >
              {profile.name}
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
          </Stack>
        </motion.div>

        {/* Bio Card with depth */}
        {profile.bio && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <ParallaxLayers strength={15} className="w-full">
              <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'linear-gradient(145deg, var(--card) 0%, var(--card) 100%)' }}>
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent}08 0%, oklch(0.65 0.15 280 / 0.06) 100%)`,
                  }}
                />
                <div className="relative p-7 sm:p-8">
                  <Text size="lg" color="foreground" style={{ lineHeight: 1.85, fontFamily: 'var(--font-geist)', textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
                    {profile.bio}
                  </Text>
                </div>
              </div>
            </ParallaxLayers>
          </motion.div>
        )}

        {/* Links - Alternating MagneticCard + TiltCard */}
        {profile.links.length > 0 && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Stack space={4} className="w-full max-w-[720px]">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => {
                  const useTilt = index % 3 === 2; // Every 3rd card gets tilt
                  return (
                    <motion.div
                      key={link.id}
                      initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.gentle, delay: 0.4 + index * 0.04 }}
                    >
                      {useTilt ? (
                        <TiltCard
                          maxTilt={6}
                          scale={1.02}
                          className={cn('w-full', isPreview && 'opacity-75')}
                          style={{
                            borderRadius: '14px',
                            border: `1px solid ${accent}25`,
                            background: `linear-gradient(145deg, var(--card) 0%, ${accent}05 100%)`,
                          }}
                        >
                          <LinkButton link={link} accent={accent} index={index} onClick={onLinkClick} isPreview={isPreview} />
                        </TiltCard>
                      ) : (
                        <MagneticCard
                          radius={160}
                          strength={0.2}
                          className={cn('w-full', isPreview && 'opacity-75')}
                          style={{
                            borderRadius: '14px',
                            border: `1px solid ${accent}20`,
                            background: `linear-gradient(145deg, var(--card) 0%, ${accent}05 100%)`,
                          }}
                        >
                          <LinkButton link={link} accent={accent} index={index} onClick={onLinkClick} isPreview={isPreview} />
                        </MagneticCard>
                      )}
                    </motion.div>
                  );
                })}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points with PerspectiveFlip */}
        {profile.proofs.length > 0 && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Stack space={3} className="w-full max-w-[720px]">
              {profile.proofs
                .slice(0, 8)
                .map((proof, index) => (
                  <PerspectiveFlip key={proof.id} axis="y" trigger="hover" duration={0.5}>
                    <div className="relative w-full" style={{ perspective: 1000 }}>
                      <MagneticCard
                        radius={120}
                        strength={0.12}
                        className={cn('w-full', isPreview && 'opacity-75')}
                        style={{
                          borderRadius: '14px',
                          border: `1px solid ${accent}30`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}08 100%)`,
                          minHeight: 72,
                        }}
                      >
                        <div className="p-5.5 flex items-center gap-4.5">
                          {proof.icon && (
                            <motion.div
                              initial={reducedMotion ? {} : { scale: 0, rotate: -120 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ ...spring.bouncy, delay: 0.6 + index * 0.06 }}
                              className="flex-shrink-0"
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: '14px',
                                background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                                color: 'var(--primary-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                boxShadow: `0 8px 32px -8px ${accent}`,
                              }}
                            >
                              {proof.icon}
                            </motion.div>
                          )}
                          <Flex column gap={2.5} flex={1} className="min-w-0">
                            <Text weight="semibold" size="base" style={{ fontFamily: 'var(--font-geist)' }}>
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

        {/* Footer with animated subdomain */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
          className="text-center pt-4"
        >
          <Flex center gap={2} className="mx-auto">
            <Box
              className="px-4 py-2 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
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
    </div>
  );
}

function LinkButton({
  link,
  accent,
  index,
  onClick,
  isPreview = false,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  index: number;
  onClick?: (link: TemplateProps['profile']['links'][0]) => void;
  isPreview?: boolean;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <button
      onClick={() => onClick?.(link)}
      className="relative w-full px-6 py-5 text-left group overflow-hidden"
      style={{ borderRadius: '14px', fontFamily: 'var(--font-geist)' }}
    >
      {/* Animated background sweep */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}10, transparent)`,
        }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Glow ring on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          boxShadow: `0 0 0 1px ${accent}40, 0 20px 60px -20px ${accent}30`,
          borderRadius: '14px',
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Flex align="center" gap={5} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.05 }}
          className="flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
          style={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '1.4rem',
            boxShadow: `0 8px 32px -8px ${accent}`,
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={2.5} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.04 }}
            className="font-medium truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-geist)', fontSize: '1.15rem' }}
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
              fontWeight: 600,
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
    </button>
  );
}

EssentialStandardTemplate.displayName = 'EssentialStandardTemplate';