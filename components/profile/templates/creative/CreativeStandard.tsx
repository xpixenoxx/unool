'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers, PerspectiveFlip } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function CreativeStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.65 0.28 320)'; // Creative purple-magenta

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '14px',
        fontFamily: 'var(--font-syne)',
      } as React.CSSProperties}
    >
      {/* Creative Standard Background - Vibrant & Expressive */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
        <div
          className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[300px] opacity-40"
          style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[300px] opacity-35"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}35 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[250px] opacity-25"
          style={{ background: `radial-gradient(circle at center, oklch(0.7 0.25 80)25 0%, transparent 60%)` }}
        />
        <CreativeStandardPattern accent={accent} secondaryAccent={secondaryAccent} />
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80), transparent)` }}
        />
      </div>

      {/* Orbital Background - Creative Standard */}
      <OrbitalBackground
        orbCount={7}
        orbSizes={[200, 130, 240, 100, 170, 90, 150]}
        colors={[
          `oklch(0.7 0.28 320 / 0.15)`,
          `oklch(0.65 0.25 20 / 0.12)`,
          `oklch(0.72 0.22 300 / 0.11)`,
          `oklch(0.78 0.2 70 / 0.09)`,
          `oklch(0.68 0.26 340 / 0.1)`,
          `oklch(0.75 0.18 30 / 0.08)`,
          `oklch(0.6 0.3 350 / 0.1)`,
        ]}
        speed={0.2}
        className="pointer-events-none"
      />

      {/* Triple Morphing Blob System */}
      <MorphingBlob size={450} color={accent} opacity={0.24} speed={0.12} complexity={5} className="absolute top-1/5 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={320} color={secondaryAccent} opacity={0.2} speed={0.1} complexity={4} className="absolute bottom-1/5 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={280} color="oklch(0.6 0.3 350)" opacity={0.15} speed={0.15} complexity={4} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <CreativeStandardFloatingShapes accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

      <ParallaxLayers strength={25} className="relative max-w-[900px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-syne)' }}>
        <Stack space={10}>

          {/* Asymmetric Grid Layout - Creative */}
          <Grid cols={{ base: 1, lg: 4 }} gap={8} className="items-start">
            {/* Left: Avatar + Name */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.standard, delay: 0.2 }}
              className="lg:col-span-1 lg:pr-8 border-r lg:border-r-0 lg:border-l-0 border-border/30"
            >
              <Stack space={5} align="start" className="text-center lg:text-left">
                <div className="relative">
                  <Avatar className="h-32 w-32 ring-4 relative z-10" ringColor={accent}>
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black" style={{ fontFamily: 'var(--font-syne)' }}>
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Creative gradient status ring */}
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...spring.bouncy, delay: 0.4 }}
                    className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full border-3 flex items-center justify-center"
                    style={{
                      background: `conic-gradient(from 0deg, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80), ${accent})`,
                      borderColor: 'var(--background)',
                      boxShadow: `0 6px 24px -6px ${accent}`,
                    }}
                    aria-label="Creative Active"
                  >
                    <motion.div
                      className="h-3 w-3 rounded-full"
                      style={{ background: 'var(--primary-foreground)' }}
                      animate={{ scale: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>

                  <motion.div
                    className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-full pointer-events-none"
                    style={{ border: `2px solid ${accent}30` }}
                    animate={{ rotate: reducedMotion ? 0 : -360, scale: [1, 1.04, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: 1 }}
                  />
                </div>

                <Stack space={2} align="start" className="w-full">
                  <motion.h1
                    initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.3 }}
                    className="text-4xl sm:text-5xl font-black tracking-tight"
                    style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em' }}
                  >
                    <span style={{ background: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 35%, ${secondaryAccent} 65%, oklch(0.7 0.25 80) 100%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '300% 300%' }}>
                      {profile.name}
                    </span>
                  </motion.h1>

                  {profile.headline && (
                    <motion.p
                      initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.standard, delay: 0.4 }}
                      className="text-lg text-muted-foreground font-medium max-w-xs"
                      style={{ fontFamily: 'var(--font-geist)', fontWeight: 500, letterSpacing: '-0.01em' }}
                    >
                      {profile.headline}
                    </motion.p>
                  )}
                </Stack>
              </Stack>

              {/* Proof Points - Creative Badges */}
              {profile.proofs.length > 0 && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.6 }}
                >
                  <Text size="sm" weight="medium" color="muted" style={{ fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Creative Cred
                  </Text>
                  <Flex gap={2.5} className="flex-wrap" wrap>
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
                            variant="outline"
                            className={cn('gap-2 py-2 px-3', isPreview && 'opacity-80')}
                            style={{ fontFamily: 'var(--font-syne)', fontSize: '0.85rem', borderColor: `${accent}40`, background: `linear-gradient(135deg, ${accent}05, ${secondaryAccent}03)` }}
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
                </motion.div>
              )}
            </motion.div>

            {/* Right: Bio + Links */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.standard, delay: 0.3 }}
              className="lg:col-span-3"
            >
              <Stack space={6}>

                {/* Bio - Creative Card */}
                {profile.bio && (
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.4 }}
                  >
                    <ParallaxLayers strength={20} className="w-full">
                      <div className="relative w-full">
                        <div
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: `linear-gradient(135deg, ${accent}12 0%, ${secondaryAccent}10 50%, oklch(0.7 0.25 80)08 100%)` }}
                        />
                        <div
                          className="relative rounded-2xl border p-1.5 overflow-hidden"
                          style={{
                            borderColor: 'var(--border)',
                            background: 'var(--card)',
                            boxShadow: `0 0 0 1px ${accent}15, 0 4px 24px -4px ${accent}20`,
                          }}
                        >
                          <div className="relative p-7 rounded-xl" style={{ background: 'var(--card)' }}>
                            <Text size="lg" color="foreground" style={{ lineHeight: 1.9, fontFamily: 'var(--font-syne)', fontSize: '1.1rem', fontWeight: 400 }}>
                              {profile.bio}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </ParallaxLayers>
                  </motion.div>
                )}

                {/* Links - Alternating MagneticCard + TiltCard */}
                {profile.links.length > 0 && (
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.5 }}
                  >
                    <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
                      <AnimatePresence>
                        {profile.links
                          .filter(l => l.isVisible)
                          .slice(0, 12)
                          .map((link, index) => (
                            <motion.div
                              key={link.id}
                              initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 30, rotate: -3 }}
                              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -20 }}
                              transition={{ ...spring.magnetic, delay: 0.5 + index * 0.06 }}
                            >
                              {index % 2 === 0 ? (
                                <TiltCard
                                  maxTilt={10}
                                  scale={1.025}
                                  className={cn('h-full', isPreview && 'opacity-80')}
                                  style={{
                                    borderRadius: '14px',
                                    border: `1px solid ${accent}25`,
                                    background: `linear-gradient(145deg, var(--card) 0%, ${accent}08 100%)`,
                                    boxShadow: `0 0 0 1px ${accent}10, 0 8px 32px -8px ${accent}20`,
                                  }}
                                >
                                  <CreativeStandardLinkButton link={link} accent={accent} secondaryAccent={secondaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="tilt" reducedMotion={reducedMotion} />
                                </TiltCard>
                              ) : (
                                <MagneticCard
                                  radius={120}
                                  strength={0.2}
                                  className={cn('h-full', isPreview && 'opacity-80')}
                                  style={{
                                    borderRadius: '14px',
                                    border: `1px solid ${accent}20`,
                                    background: `linear-gradient(135deg, var(--card) 0%, ${secondaryAccent}06 100%)`,
                                    boxShadow: `0 4px 20px -4px ${accent}10`,
                                  }}
                                >
                                  <CreativeStandardLinkButton link={link} accent={accent} secondaryAccent={secondaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="magnetic" reducedMotion={reducedMotion} />
                                </MagneticCard>
                              )}
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </Grid>
                  </motion.div>
                )}

              </Stack>
            </motion.div>
          </Grid>

          {/* Footer Subdomain */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 1 }}
            className="text-center pt-6 lg:hidden"
          >
            <Flex center gap={2} className="mx-auto">
              <Box
                className="px-4 py-2 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}10, oklch(0.7 0.25 80)08)`,
                  border: `1px solid ${accent}30`,
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '0.875rem',
                  color: accent,
                  fontWeight: 600,
                }}
              >
                {profile.subdomain}.unool.co
              </Box>
            </Flex>
          </motion.div>
        </Stack>
      </ParallaxLayers>

      {/* Desktop Sidebar Subdomain */}
      <div className="hidden lg:block absolute bottom-8 left-8 right-auto" style={{ maxWidth: 200 }}>
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
        >
          <Box
            className="px-4 py-2 rounded-full text-center"
            style={{
              background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}10, oklch(0.7 0.25 80)08)`,
              border: `1px solid ${accent}30`,
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.85rem',
              color: accent,
              fontWeight: 600,
            }}
          >
            {profile.subdomain}.unool.co
          </Box>
        </motion.div>
      </div>
    </div>
  );
}

function CreativeStandardLinkButton({
  link,
  accent,
  secondaryAccent,
  index,
  onClick,
  isPreview = false,
  variant,
  reducedMotion,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  secondaryAccent: string;
  index: number;
  onClick?: (link: TemplateProps['profile']['links'][0]) => void;
  isPreview?: boolean;
  variant: 'magnetic' | 'tilt';
  reducedMotion: boolean;
}) {
  return (
    <button
      onClick={() => onClick?.(link)}
      className="relative w-full px-5 py-4 text-left group overflow-hidden"
      style={{ borderRadius: '12px', fontFamily: 'var(--font-syne)' }}
    >
      {/* Animated left accent bar - creative gradient */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: `linear-gradient(180deg, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80))`, borderRadius: '12px 0 0 12px', transformOrigin: 'bottom' }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 + index * 0.06 }}
      />

      {/* Creative hover shimmer */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}12, ${secondaryAccent}08, oklch(0.7 0.25 80)10, transparent)` }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Hover glow - variant specific */}
      {variant === 'magnetic' && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${accent}30, 0 12px 40px -8px ${accent}20`,
            borderRadius: '12px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {variant === 'tilt' && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            boxShadow: `0 0 0 1px ${secondaryAccent}30, 0 8px 32px -8px ${secondaryAccent}15`,
            borderRadius: '12px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <Flex align="center" gap={3.5} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.05 }}
          className="flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-400"
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

        <Flex align="center" gap={2.5}>
          <motion.span
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.6 + index * 0.04 }}
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
          <Badge
            variant="ghost"
            size="sm"
            className="group-hover:bg-primary/10 group-hover:text-primary transition-all"
            style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-syne)', fontWeight: 700 }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </button>
  );
}

// ==================== CREATIVE STANDARD BACKGROUND ELEMENTS ====================

function CreativeStandardPattern({ accent, secondaryAccent }: { accent: string; secondaryAccent: string }) {
  return (
    <>
      {/* Large diagonal brush stroke */}
      <div
        className="absolute top-10 right-10 w-[350px] h-[350px] pointer-events-none opacity-20"
        style={{
          transform: 'rotate(-15deg)',
          background: `linear-gradient(135deg, ${accent} 0%, transparent 40%, ${secondaryAccent} 100%)`,
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 60%)',
        }}
      />
      <div
        className="absolute bottom-10 left-10 w-[300px] h-[300px] pointer-events-none opacity-15"
        style={{
          transform: 'rotate(25deg)',
          background: `linear-gradient(135deg, ${secondaryAccent} 0%, oklch(0.7 0.25 80) 100%)`,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
        }}
      />
      {/* Scattered creative dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-12"
        style={{
          backgroundImage: `radial-gradient(${accent} 2px, transparent 2px), radial-gradient(${secondaryAccent} 1px, transparent 1px), radial-gradient(oklch(0.7 0.25 80) 1px, transparent 1px)`,
          backgroundSize: '100px 100px, 50px 50px, 75px 75px',
          backgroundPosition: '0 0, 25px 25px, 50px 50px',
        }}
      />
    </>
  );
}

function CreativeStandardFloatingShapes({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  const shapes = [
    { x: 12, y: 18, size: 20, color: accent, delay: 0, type: 'circle' as const },
    { x: 88, y: 12, size: 14, color: secondaryAccent, delay: 0.5, type: 'diamond' as const },
    { x: 8, y: 78, size: 18, color: 'oklch(0.7 0.25 80)', delay: 1, type: 'square' as const },
    { x: 92, y: 82, size: 14, color: accent, delay: 1.5, type: 'circle' as const },
    { x: 50, y: 5, size: 12, color: secondaryAccent, delay: 0.2, type: 'diamond' as const },
    { x: 95, y: 45, size: 10, color: 'oklch(0.7 0.25 80)', delay: 0.8, type: 'square' as const },
    { x: 18, y: 55, size: 14, color: accent, delay: 1.2, type: 'diamond' as const },
    { x: 82, y: 25, size: 10, color: secondaryAccent, delay: 1.8, type: 'circle' as const },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30" aria-hidden="true">
      {shapes.map((shape, i) => (
        <CreativeStandardShape key={i} {...shape} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function CreativeStandardShape({
  x,
  y,
  size,
  color,
  delay,
  type,
  reducedMotion,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  type: 'circle' | 'diamond' | 'square';
  reducedMotion: boolean;
}) {
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
      transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div style={shapeStyle} />
    </motion.div>
  );
}

CreativeStandardTemplate.displayName = 'CreativeStandardTemplate';
