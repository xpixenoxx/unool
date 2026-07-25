'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers, PerspectiveFlip } from '@/components/ui/3d';
import { Flex, Stack, Box } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring, slideUp, fadeIn } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function EssentialMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--primary)';
  const secondaryAccent = 'oklch(0.65 0.18 280)';

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '18px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Maximum Visual Impact Background */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40" />

        {/* Multi-layer radial gradients */}
        <div
          className="absolute top-0 left-1/3 w-[800px] h-[800px] rounded-full blur-[300px] opacity-50 -translate-x-1/2"
          style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[300px] opacity-40"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}35 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full blur-[200px] opacity-30 -translate-x-1/2 -translate-y-1/2"
          style={{ background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)` }}
        />

        {/* Animated mesh gradient */}
        <MeshGradient accent={accent} secondaryAccent={secondaryAccent} className="absolute inset-0 opacity-60" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Corner accents */}
        <CornerAccent accent={accent} position="top-left" />
        <CornerAccent accent={secondaryAccent} position="bottom-right" />
      </div>

      {/* Orbital Background - Maximum Density */}
      <OrbitalBackground
        orbCount={8}
        orbSizes={[220, 160, 280, 120, 200, 140, 180, 100]}
        colors={[
          `oklch(0.72 0.18 200 / 0.14)`,
          `oklch(0.68 0.16 280 / 0.12)`,
          `oklch(0.78 0.14 200 / 0.1)`,
          `oklch(0.65 0.2 280 / 0.11)`,
          `oklch(0.74 0.15 200 / 0.09)`,
          `oklch(0.67 0.18 280 / 0.1)`,
          `oklch(0.76 0.13 200 / 0.08)`,
          `oklch(0.64 0.19 280 / 0.09)`,
        ]}
        speed={0.18}
        className="pointer-events-none"
      />

      {/* Triple Morphing Blob System */}
      <MorphingBlob size={600} color={accent} opacity={0.2} speed={0.09} complexity={6} className="absolute top-1/5 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={450} color={secondaryAccent} opacity={0.15} speed={0.07} complexity={5} className="absolute bottom-1/5 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={300} color="oklch(0.75 0.12 200)" opacity={0.12} speed={0.11} complexity={4} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Floating geometric shapes */}
      <FloatingShapes accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

      <Stack space={14} className="relative max-w-[800px] mx-auto px-4 py-24" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero Section - Maximum Expression */}
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="text-center relative"
        >
          {/* Layered glow system */}
          <LayeredGlowSystem accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

          {/* Orbital particles around avatar */}
          <OrbitalParticles accent={accent} count={8} radius={160} speed={8} reducedMotion={reducedMotion} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="relative inline-block mb-10">
            <Avatar className="h-40 w-40 ring-4 relative z-20" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-6xl font-bold">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Animated status ring with particles */}
            <StatusRing accent={accent} reducedMotion={reducedMotion} />

            {/* Triple rotating borders */}
            <TripleBorder accent={accent} reducedMotion={reducedMotion} />
          </div>

          <Stack space={6}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                opacity: { ...spring.gentle, delay: 0.1 },
                y: { ...spring.gentle, delay: 0.1 },
                backgroundPosition: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tightest bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                fontFamily: 'var(--font-geist)',
                backgroundImage: `linear-gradient(135deg, ${accent} 0%, oklch(0.8 0.15 280) 20%, oklch(0.85 0.12 200) 40%, ${secondaryAccent} 60%, ${accent} 80%, oklch(0.9 0.1 280) 100%)`,
                backgroundSize: '400% 400%',
              }}
            >
              {profile.name}
            </motion.h1>

            {profile.headline && (
              <motion.p
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="text-2xl sm:text-3xl lg:text-4xl font-medium max-w-5xl mx-auto"
                style={{
                  fontFamily: 'var(--font-geist)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  background: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 30%, ${secondaryAccent} 70%, var(--muted-foreground) 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {profile.headline}
              </motion.p>
            )}

            {/* Animated tagline underline */}
            <motion.div
              className="w-32 h-1 mx-auto mt-2"
              style={{ background: `linear-gradient(90deg, ${accent}, ${secondaryAccent})`, borderRadius: '10px', transformOrigin: 'left' }}
              initial={reducedMotion ? {} : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ ...spring.bouncy, delay: 0.8 }}
            />
          </Stack>
        </motion.div>

        {/* Bio Card - Maximum Glassmorphism with Parallax */}
        {profile.bio && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <ParallaxLayers strength={35} className="w-full">
              <div className="relative w-full">
                {/* Multi-layer background */}
                <div className="absolute inset-0 rounded-3xl" style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${secondaryAccent}12 30%, transparent 60%, ${accent}10 100%)`, filter: 'blur(2px)' }} />
                <div className="absolute inset-0 rounded-3xl" style={{ background: `radial-gradient(ellipse at 30% 30%, ${accent}15 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, ${secondaryAccent}12 0%, transparent 60%)` }} />

                <div
                  className="relative rounded-3xl border p-1.5 overflow-hidden"
                  style={{
                    borderColor: `${accent}50`,
                    background: `linear-gradient(145deg, var(--card) 0%, var(--card) 100%)`,
                    boxShadow: `0 0 0 2px ${accent}20, 0 30px 100px -30px ${accent}30, 0 0 0 1px ${accent}10, inset 0 2px 0 ${accent}15, inset 0 -1px 0 var(--border)`,
                  }}
                >
                  <div className="relative p-10 sm:p-12 rounded-2xl" style={{ background: 'var(--card)' }}>
                    <Text size="xl" color="foreground" style={{ lineHeight: 2, fontFamily: 'var(--font-geist)', textAlign: 'center', maxWidth: '750px', margin: '0 auto', fontSize: '1.25rem', letterSpacing: '-0.005em' }}>
                      {profile.bio}
                    </Text>
                  </div>
                </div>
              </div>
            </ParallaxLayers>
          </motion.div>
        )}

        {/* Links - Maximum Polish: Magnetic + Tilt + PerspectiveFlip rotation */}
        {profile.links.length > 0 && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Stack space={5} className="w-full max-w-[800px]">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 18)
                .map((link, index) => {
                  const cardType = index % 4;
                  return (
                    <motion.div
                      key={link.id}
                      initial={reducedMotion ? {} : { opacity: 0, y: 50, scale: 0.92, rotateX: -5 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                      transition={{ ...spring.magnetic, delay: 0.6 + index * 0.045 }}
                      style={{ perspective: 1000 }}
                    >
                      {cardType === 0 && (
                        <PerspectiveFlip axis="y" trigger="hover" duration={0.7}>
                          <div className="relative w-full" style={{ perspective: 1000 }}>
                            <TiltCard
                              maxTilt={10}
                              scale={1.03}
                              className={cn('w-full', isPreview && 'opacity-85')}
                              style={{
                                borderRadius: '18px',
                                border: `1px solid ${accent}35`,
                                background: `linear-gradient(145deg, var(--card) 0%, ${accent}10 100%)`,
                                boxShadow: `0 0 0 1px ${accent}20, 0 20px 60px -20px ${accent}30`,
                              }}
                            >
                              <MaxLinkButton link={link} accent={accent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="tilt" />
                            </TiltCard>
                          </div>
                        </PerspectiveFlip>
                      )}
                      {cardType === 1 && (
                        <MagneticCard
                          radius={200}
                          strength={0.3}
                          className={cn('w-full', isPreview && 'opacity-85')}
                          style={{
                            borderRadius: '18px',
                            border: `1px solid ${accent}30`,
                            background: `linear-gradient(145deg, var(--card) 0%, ${secondaryAccent}08 100%)`,
                            boxShadow: `0 0 0 1px ${accent}15, 0 16px 48px -16px ${accent}25`,
                          }}
                        >
                          <MaxLinkButton link={link} accent={accent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="magnetic" />
                        </MagneticCard>
                      )}
                      {cardType === 2 && (
                        <PerspectiveFlip axis="x" trigger="hover" duration={0.6}>
                          <div className="relative w-full" style={{ perspective: 1000 }}>
                            <TiltCard
                              maxTilt={8}
                              scale={1.025}
                              className={cn('w-full', isPreview && 'opacity-85')}
                              style={{
                                borderRadius: '18px',
                                border: `1px solid ${secondaryAccent}30`,
                                background: `linear-gradient(145deg, var(--card) 0%, ${secondaryAccent}10 100%)`,
                                boxShadow: `0 0 0 1px ${secondaryAccent}20, 0 20px 60px -20px ${secondaryAccent}30`,
                              }}
                            >
                              <MaxLinkButton link={link} accent={secondaryAccent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="flip" />
                            </TiltCard>
                          </div>
                        </PerspectiveFlip>
                      )}
                      {cardType === 3 && (
                        <MagneticCard
                          radius={180}
                          strength={0.28}
                          className={cn('w-full', isPreview && 'opacity-85')}
                          style={{
                            borderRadius: '18px',
                            border: `2px solid ${accent}40`,
                            background: `linear-gradient(135deg, ${accent}08 0%, var(--card) 50%, ${secondaryAccent}08 100%)`,
                            boxShadow: `0 0 0 1px ${accent}25, 0 24px 80px -24px ${accent}35`,
                          }}
                        >
                          <MaxLinkButton link={link} accent={accent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="featured" />
                        </MagneticCard>
                      )}
                    </motion.div>
                  );
                })}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points - PerspectiveFlip with Maximum Polish */}
        {profile.proofs.length > 0 && (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Stack space={4} className="w-full max-w-[800px]">
              {profile.proofs
                .slice(0, 8)
                .map((proof, index) => (
                  <PerspectiveFlip key={proof.id} axis="x" trigger="hover" duration={0.7}>
                    <div className="relative w-full" style={{ perspective: 1000 }}>
                      <MagneticCard
                        radius={160}
                        strength={0.18}
                        className={cn('w-full', isPreview && 'opacity-85')}
                        style={{
                          borderRadius: '18px',
                          border: `1px solid ${accent}40`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}12 100%)`,
                          minHeight: 88,
                          boxShadow: `0 0 0 1px ${accent}25, 0 16px 50px -16px ${accent}30`,
                        }}
                      >
                        <div className="p-6 flex items-center gap-6">
                          {proof.icon && (
                            <motion.div
                              initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ ...spring.bouncy, delay: 0.8 + index * 0.1 }}
                              className="group-hover:rotate-12 group-hover:scale-110 transition-all duration-500"
                              style={{
                                width: 60,
                                height: 60,
                                borderRadius: '18px',
                                background: `linear-gradient(135deg, ${accent}, oklch(0.7 0.15 280), ${accent})`,
                                color: 'var(--primary-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.75rem',
                                boxShadow: `0 12px 50px -12px ${accent}`,
                              }}
                            >
                              {proof.icon}
                            </motion.div>
                          )}
                          <Flex column gap={3.5} flex={1} className="min-w-0">
                            <Text weight="bold" size="lg" style={{ fontFamily: 'var(--font-geist)' }}>
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

        {/* Footer - Maximum subdomain */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring.magnetic, delay: 1.6 }}
          className="text-center pt-8"
        >
          <Flex center gap={3} className="mx-auto">
            <Box
              className="px-6 py-3.5 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
                border: `2px solid ${accent}50`,
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '1.1rem',
                color: accent,
                fontWeight: 700,
                letterSpacing: '0.05em',
                boxShadow: `0 0 0 6px ${accent}10, 0 12px 40px -12px ${accent}25`,
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

// ==================== HELPER COMPONENTS ====================

function MaxLinkButton({
  link,
  accent,
  index,
  onClick,
  isPreview = false,
  variant,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  index: number;
  onClick?: (link: TemplateProps['profile']['links'][0]) => void;
  isPreview?: boolean;
  variant: 'tilt' | 'magnetic' | 'flip' | 'featured';
}) {
  const reducedMotion = useReducedMotion();
  const isFeatured = variant === 'featured';

  return (
    <button
      onClick={() => onClick?.(link)}
      className="relative w-full px-7 py-6 text-left group overflow-hidden"
      style={{ borderRadius: '18px', fontFamily: 'var(--font-geist)' }}
    >
      {/* Accent bar on left - featured gets gradient */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{
          background: isFeatured
            ? `linear-gradient(180deg, ${accent}, oklch(0.7 0.15 280), ${accent})`
            : `linear-gradient(180deg, ${accent}, oklch(0.65 0.18 280))`,
          transformOrigin: 'bottom',
        }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.magnetic, delay: 0.6 + index * 0.05 }}
      />

      {/* Full background sweep */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}12, transparent)` }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          boxShadow: `0 0 0 2px ${accent}50, 0 30px 100px -30px ${accent}45`,
          borderRadius: '18px',
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Background color shift on hover */}
      <motion.div
        className="absolute inset-0 opacity-0"
        style={{
          background: `linear-gradient(135deg, ${accent}12, ${accent}06)`,
          borderRadius: '18px',
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Flex align="center" gap={7} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.07 }}
          className="flex-shrink-0 group-hover:scale-120 group-hover:rotate-8 transition-all duration-500"
          style={{
            width: isFeatured ? 72 : 64,
            height: isFeatured ? 72 : 64,
            borderRadius: '18px',
            background: `linear-gradient(135deg, ${accent}, oklch(0.7 0.15 280), ${accent})`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: isFeatured ? '1.8rem' : '1.6rem',
            boxShadow: `0 16px 60px -20px ${accent}`,
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={4} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.05 }}
            className="font-semibold truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-geist)', fontSize: isFeatured ? '1.35rem' : '1.25rem', letterSpacing: '-0.01em' }}
          >
            {link.label}
          </motion.span>
          <Text size="sm" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {link.url}
          </Text>
        </Flex>

        <Flex align="center" gap={4}>
          <motion.span
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.6, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ ...spring.gentle, delay: 0.9 + index * 0.05 }}
            style={{
              fontSize: '0.95rem',
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
            className="group-hover:bg-primary/15 group-hover:text-primary transition-all"
            style={{ fontSize: '0.75rem', fontFamily: 'var(--font-geist)', fontWeight: 700 }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </button>
  );
}

function MeshGradient({ accent, secondaryAccent, className }: { accent: string; secondaryAccent: string; className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn('absolute inset-0', className)}
      style={{
        background: `linear-gradient(135deg, ${accent}08 0%, transparent 30%), linear-gradient(225deg, ${secondaryAccent}06 0%, transparent 30%), linear-gradient(45deg, ${accent}04 0%, transparent 50%)`,
        filter: 'blur(60px)',
      }}
      animate={reducedMotion ? {} : { opacity: [0.4, 0.8, 0.4], scale: [1, 1.02, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function CornerAccent({ accent, position }: { accent: string; position: 'top-left' | 'bottom-right' }) {
  const styles: Record<string, React.CSSProperties> = {
    'top-left': { top: 0, left: 0, transform: 'translate(-50%, -50%)' },
    'bottom-right': { bottom: 0, right: 0, transform: 'translate(50%, 50%)' },
  };

  return (
    <motion.div
      className="absolute w-64 h-64 rounded-full pointer-events-none opacity-20 blur-2xl"
      style={{
        ...styles[position],
        background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`,
      }}
      animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function LayeredGlowSystem({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  return (
    <>
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent}60 0%, transparent 70%)` }}
        animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none blur-2xl"
        style={{ background: `radial-gradient(circle, ${secondaryAccent}40 0%, transparent 70%)` }}
        animate={reducedMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none blur-2xl"
        style={{ background: `radial-gradient(circle, ${accent}20 0%, ${secondaryAccent}15 50%, transparent 80%)` }}
        animate={reducedMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </>
  );
}

function OrbitalParticles({ accent, count, radius, speed, reducedMotion, className }: { accent: string; count: number; radius: number; speed: number; reducedMotion: boolean; className?: string }) {
  const colors = [accent, 'oklch(0.7 0.15 280)', 'oklch(0.8 0.12 200)', accent];

  return (
    <div className={cn('pointer-events-none', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <OrbitalParticle
          key={i}
          index={i}
          count={count}
          accent={colors[i % colors.length]}
          radius={radius}
          speed={speed}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

function OrbitalParticle({ index, count, accent, radius, speed, reducedMotion }: { index: number; count: number; accent: string; radius: number; speed: number; reducedMotion: boolean }) {
  const angle = (index / count) * 360;
  const size = 6 + (index % 3) * 3;
  const delay = (index / count) * 2;

  if (reducedMotion) {
    return (
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size,
          height: size,
          background: accent,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)`,
          boxShadow: `0 0 ${size * 2}px ${accent}`,
        }}
      />
    );
  }

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: accent,
        top: '50%',
        left: '50%',
        transformOrigin: 'center center',
        boxShadow: `0 0 ${size * 2}px ${accent}`,
      }}
      animate={{
        rotate: [angle, angle + 360],
        scale: [1, 1.5, 1],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear', delay }}
    />
  );
}

function StatusRing({ accent, reducedMotion }: { accent: string; reducedMotion: boolean }) {
  return (
    <>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: reducedMotion ? 0 : 360 }}
        transition={{
          scale: { ...spring.bouncy, delay: 0.6 },
          rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
        }}
        className="absolute -bottom-4 -right-4 h-10 w-10 rounded-full border-4 flex items-center justify-center"
        style={{
          background: `conic-gradient(from 0deg, ${accent}, oklch(0.65 0.18 280), oklch(0.8 0.12 200), ${accent})`,
          borderColor: 'var(--background)',
          boxShadow: `0 0 0 8px ${accent}25, 0 16px 50px -16px ${accent}`,
        }}
        aria-label="Active"
      >
        <motion.div
          className="h-3 w-3 rounded-full"
          style={{ background: 'var(--primary-foreground)' }}
          animate={{ scale: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Particle ring */}
      <ParticleRing accent={accent} count={6} radius={56} reducedMotion={reducedMotion} />
    </>
  );
}

function ParticleRing({ accent, count, radius, reducedMotion }: { accent: string; count: number; radius: number; reducedMotion: boolean }) {
  const colors = [accent, 'oklch(0.7 0.15 280)', accent];

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            background: colors[i % colors.length],
            top: '50%',
            left: '50%',
            transformOrigin: `${-radius}px ${-radius}px`,
            boxShadow: `0 0 8px ${accent}`,
          }}
          animate={reducedMotion ? {} : { rotate: [0, 360], scale: [1, 0.5, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}

function TripleBorder({ accent, reducedMotion }: { accent: string; reducedMotion: boolean }) {
  const configurations = [
    { size: 48, borderWidth: 2, opacity: 0.3, duration: 20, direction: 1 },
    { size: 56, borderWidth: 1.5, opacity: 0.2, duration: 30, direction: -1 },
    { size: 64, borderWidth: 1, opacity: 0.15, duration: 40, direction: 1 },
  ];

  return (
    <>
      {configurations.map((config, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
          style={{
            width: config.size,
            height: config.size,
            border: `${config.borderWidth}px solid ${accent}${Math.round(config.opacity * 255).toString(16).padStart(2, '0')}`,
            borderRadius: '50%',
          }}
          animate={{ rotate: reducedMotion ? 0 : config.direction * 360, scale: [1, 1.05, 1] }}
          transition={{ duration: config.duration, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
        />
      ))}
    </>
  );
}

function FloatingShapes({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  type ShapeType = 'triangle' | 'square' | 'circle';
  const shapes: { type: ShapeType; x: number; y: number; size: number; color: string; delay: number }[] = [
    { type: 'triangle', x: 10, y: 15, size: 24, color: accent, delay: 0 },
    { type: 'square', x: 90, y: 20, size: 18, color: secondaryAccent, delay: 1 },
    { type: 'circle', x: 15, y: 80, size: 16, color: accent, delay: 2 },
    { type: 'triangle', x: 85, y: 75, size: 20, color: secondaryAccent, delay: 3 },
    { type: 'square', x: 50, y: 5, size: 14, color: accent, delay: 0.5 },
    { type: 'circle', x: 5, y: 50, size: 12, color: secondaryAccent, delay: 1.5 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30" aria-hidden="true">
      {shapes.map((shape, i) => (
        <FloatingShape key={i} {...shape} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function FloatingShape({ type, x, y, size, color, delay, reducedMotion }: { type: 'triangle' | 'square' | 'circle'; x: number; y: number; size: number; color: string; delay: number; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.4,
  };

  const shapeStyle: React.CSSProperties = {
    width: size,
    height: size,
    ...(type === 'triangle' && { width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}` }),
    ...(type === 'square' && { background: color, borderRadius: '3px' }),
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
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div style={shapeStyle} />
    </motion.div>
  );
}

EssentialMaxTemplate.displayName = 'EssentialMaxTemplate';