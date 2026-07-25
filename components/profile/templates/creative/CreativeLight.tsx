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

export function CreativeLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--primary)';
  const secondaryAccent = 'oklch(0.72 0.25 25)'; // Creative warm coral

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '14px',
        fontFamily: 'var(--font-syne)',
      } as React.CSSProperties}
    >
      {/* Creative Light Background - Airy & Expressive */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div
          className="absolute top-0 left-1/3 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[250px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${accent}35 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[250px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}30 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[200px] opacity-15"
          style={{ background: `radial-gradient(circle at center, oklch(0.7 0.25 80)20 0%, transparent 60%)` }}
        />
        {/* Creative light brush pattern */}
        <CreativeLightBrushStrokes accent={accent} secondaryAccent={secondaryAccent} />
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80), transparent)` }}
        />
      </div>

      {/* Orbital Background - Light Creative */}
      <OrbitalBackground
        orbCount={5}
        orbSizes={[160, 110, 200, 80, 140]}
        colors={[
          `oklch(0.7 0.25 340 / 0.12)`,
          `oklch(0.65 0.22 25 / 0.1)`,
          `oklch(0.75 0.2 300 / 0.08)`,
          `oklch(0.8 0.18 80 / 0.06)`,
          `oklch(0.72 0.25 25 / 0.1)`,
        ]}
        speed={0.15}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blob - Light Creative */}
      <MorphingBlob size={380} color={accent} opacity={0.18} speed={0.1} complexity={4} className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={260} color={secondaryAccent} opacity={0.14} speed={0.08} complexity={3} className="absolute bottom-1/3 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Floating creative shapes */}
      <CreativeLightFloatingShapes accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

      <ParallaxLayers strength={20} className="relative max-w-[850px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-syne)' }}>
        <Stack space={8}>
          {/* Header - Creative Centered */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.2 }}
            className="text-center"
          >
            <Stack space={4} align="center">
              <div className="relative">
                <Avatar className="h-32 w-32 ring-4" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="text-4xl font-black" style={{ fontFamily: 'var(--font-syne)' }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Creative pulse ring */}
                <motion.div
                  className="absolute inset-[-6px] rounded-[28px] pointer-events-none"
                  style={{ border: `2px solid ${accent}40` }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.3, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-[-12px] rounded-[34px] pointer-events-none"
                  style={{ border: `1px solid ${accent}20` }}
                  animate={{ rotate: reducedMotion ? 0 : 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear', delay: 1 }}
                />
              </div>

              <Stack space={2} align="center">
                <motion.h1
                  initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.3 }}
                  className="text-4xl sm:text-5xl font-black tracking-tight"
                  style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em' }}
                >
                  <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 40%, ${secondaryAccent} 70%, oklch(0.7 0.25 80) 100%)` }}>
                    {profile.name}
                  </span>
                </motion.h1>

                {profile.headline && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.4 }}
                    className="text-lg text-muted-foreground font-medium max-w-xl"
                    style={{ fontFamily: 'var(--font-geist)', fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    {profile.headline}
                  </motion.p>
                )}
              </Stack>
            </Stack>
          </motion.div>

          {/* Bio - Light Creative Card */}
          {profile.bio && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.5 }}
            >
              <Stack space={2} align="center" className="max-w-2xl mx-auto">
                <Text size="sm" weight="medium" color="muted" style={{ fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Story
                </Text>
                <div className="relative w-full">
                  <div className="absolute inset-0 rounded-3xl" style={{ background: `linear-gradient(135deg, ${accent}12 0%, ${secondaryAccent}10 100%)` }} />
                  <div className="relative rounded-3xl border p-1.5 overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <div className="relative p-7 rounded-2xl" style={{ background: 'var(--card)' }}>
                      <Text size="lg" color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-syne)', fontSize: '1.15rem', textAlign: 'center', fontWeight: 400 }}>
                        {profile.bio}
                      </Text>
                    </div>
                  </div>
                </div>
              </Stack>
            </motion.div>
          )}

          {/* Proof Points - Creative Badge Cloud */}
          {profile.proofs.length > 0 && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.6 }}
            >
              <Stack space={3} align="center">
                <Text size="sm" weight="medium" color="muted" style={{ fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Creative Cred
                </Text>
                <Flex gap={2.5} className="flex-wrap justify-center" wrap>
                  {profile.proofs
                    .slice(0, 6)
                    .map((proof, index) => (
                      <motion.div
                        key={proof.id}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ ...spring.bouncy, delay: 0.7 + index * 0.08 }}
                      >
                        <Badge
                          variant="secondary"
                          className={cn('gap-2 py-2.5 px-3.5', isPreview && 'opacity-80')}
                          style={{
                            fontFamily: 'var(--font-syne)',
                            fontSize: '0.875rem',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}10)`,
                            borderColor: `${accent}30`,
                            color: accent,
                          }}
                        >
                          {proof.icon && <span style={{ fontSize: '1.2rem' }}>{proof.icon}</span>}
                          {proof.title}
                          {proof.value && (
                            <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                              {proof.value}
                            </Text>
                          )}
                        </Badge>
                      </motion.div>
                    ))}
                </Flex>
              </Stack>
            </motion.div>
          )}

          {/* Links - Light Creative Magnetic Cards */}
          {profile.links.length > 0 && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.7 }}
            >
              <Stack space={2.5} className="max-w-md mx-auto">
                {profile.links
                  .filter(l => l.isVisible)
                  .slice(0, 10)
                  .map((link, index) => (
                    <motion.div
                      key={link.id}
                      initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ ...spring.gentle, delay: 0.8 + index * 0.06 }}
                    >
                      <MagneticCard
                        radius={100}
                        strength={0.2}
                        className={cn('w-full', isPreview && 'opacity-80')}
                        style={{
                          borderRadius: '16px',
                          border: `1px solid ${accent}25`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}08 100%)`,
                          boxShadow: `0 4px 24px -4px ${accent}20`,
                        }}
                      >
                        <CreativeLightLinkButton link={link} accent={accent} secondaryAccent={secondaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} reducedMotion={reducedMotion} />
                      </MagneticCard>
                    </motion.div>
                  ))}
              </Stack>
            </motion.div>
          )}

          {/* Subdomain */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 1.2 }}
            className="text-center pt-4"
          >
            <Box className="inline-flex items-center gap-2 px-5 py-3 rounded-[50px]" style={{ background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}10)`, border: `1px solid ${accent}30` }}>
              <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.9rem', color: accent, fontWeight: 700 }}>
                {profile.subdomain}.unool.co
              </span>
            </Box>
          </motion.div>
        </Stack>
      </ParallaxLayers>
    </div>
  );
}

function CreativeLightLinkButton({
  link,
  accent,
  secondaryAccent,
  index,
  onClick,
  isPreview = false,
  reducedMotion,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  secondaryAccent: string;
  index: number;
  onClick?: (link: TemplateProps['profile']['links'][0]) => void;
  isPreview?: boolean;
  reducedMotion: boolean;
}) {
  return (
    <button
      onClick={() => onClick?.(link)}
      className="relative w-full px-5 py-4 text-left group overflow-hidden"
      style={{ borderRadius: '16px', fontFamily: 'var(--font-syne)' }}
    >
      {/* Animated top accent bar - creative gradient */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{
          background: `linear-gradient(90deg, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80))`,
          borderRadius: '16px 16px 0 0',
          transformOrigin: 'left',
        }}
        initial={reducedMotion ? {} : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 + index * 0.06 }}
      />

      {/* Hover shimmer */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}12, ${secondaryAccent}08, oklch(0.7 0.25 80)10, transparent)` }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          boxShadow: `0 0 0 2px ${accent}30, 0 12px 40px -8px ${accent}20`,
          borderRadius: '16px',
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Flex align="center" gap={3.5} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.05 }}
          className="flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.2rem',
            boxShadow: `0 6px 24px -6px ${accent}`,
            fontFamily: 'var(--font-syne)',
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={1.5} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.04 }}
            className="font-semibold truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-syne)', fontSize: '1.05rem' }}
          >
            {link.label}
          </motion.span>
          <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {link.url}
          </Text>
        </Flex>

        <Flex align="center" gap={2}>
          <motion.span
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.6 + index * 0.04 }}
            style={{ fontSize: '0.8rem', color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}
          >
            {link.clicks.toLocaleString()}
          </motion.span>
          <Badge
            variant="ghost"
            size="sm"
            className="group-hover:bg-primary/10 group-hover:text-primary transition-all"
            style={{ fontSize: '0.7rem', fontFamily: 'var(--font-syne)', fontWeight: 700 }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </button>
  );
}

// ==================== CREATIVE LIGHT BACKGROUND ELEMENTS ====================

function CreativeLightBrushStrokes({ accent, secondaryAccent }: { accent: string; secondaryAccent: string }) {
  return (
    <>
      {/* Soft diagonal brush */}
      <div
        className="absolute top-20 right-10 w-[250px] h-[250px] pointer-events-none opacity-15"
        style={{
          transform: 'rotate(-20deg)',
          background: `linear-gradient(135deg, ${accent} 0%, transparent 50%, ${secondaryAccent} 100%)`,
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 60%)',
        }}
      />
      <div
        className="absolute bottom-20 left-10 w-[200px] h-[200px] pointer-events-none opacity-12"
        style={{
          transform: 'rotate(25deg)',
          background: `linear-gradient(135deg, ${secondaryAccent} 0%, oklch(0.7 0.25 80) 100%)`,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
        }}
      />
      {/* Soft scattered dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-8"
        style={{
          backgroundImage: `radial-gradient(${accent} 1.5px, transparent 1.5px), radial-gradient(${secondaryAccent} 1px, transparent 1px)`,
          backgroundSize: '150px 150px, 75px 75px',
          backgroundPosition: '0 0, 37px 37px',
        }}
      />
    </>
  );
}

function CreativeLightFloatingShapes({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  type ShapeType = 'circle' | 'diamond' | 'square';
  const shapes: { type: ShapeType; x: number; y: number; size: number; color: string; delay: number }[] = [
    { type: 'circle', x: 12, y: 18, size: 18, color: accent, delay: 0 },
    { type: 'diamond', x: 88, y: 12, size: 14, color: secondaryAccent, delay: 0.5 },
    { type: 'square', x: 8, y: 78, size: 16, color: 'oklch(0.7 0.25 80)', delay: 1 },
    { type: 'circle', x: 92, y: 82, size: 12, color: accent, delay: 1.5 },
    { type: 'diamond', x: 50, y: 5, size: 10, color: secondaryAccent, delay: 0.2 },
    { type: 'square', x: 95, y: 45, size: 8, color: 'oklch(0.7 0.25 80)', delay: 0.8 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25" aria-hidden="true">
      {shapes.map((shape, i) => (
        <CreativeLightShape key={i} {...shape} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function CreativeLightShape({ x, y, size, color, delay, type, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; type: 'circle' | 'diamond' | 'square'; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.5,
  };

  const shapeStyle: React.CSSProperties = {
    width: size,
    height: size,
    ...(type === 'diamond' && { width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}` }),
    ...(type === 'square' && { background: color, borderRadius: '3px', transform: 'rotate(45deg)' }),
    ...(type === 'circle' && { background: color, borderRadius: '50%' }),
  };

  if (reducedMotion) {
    return <div className="absolute" style={style}><div style={shapeStyle} /></div>;
  }

  return (
    <motion.div
      style={style}
      animate={{
        y: [-15, 15, -15],
        x: [-10, 10, -10],
        rotate: type === 'circle' ? 0 : [0, 360],
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div style={shapeStyle} />
    </motion.div>
  );
}

CreativeLightTemplate.displayName = 'CreativeLightTemplate';