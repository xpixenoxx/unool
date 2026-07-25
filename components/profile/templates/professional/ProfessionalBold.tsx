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
import { spring, slideUp, fadeIn } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

const mockTestimonials: Testimonial[] = [
  { id: '1', quote: 'Exceptional vision and execution. This person delivers results that exceed expectations.', author: 'Sarah Chen', role: 'VP Engineering', company: 'TechCorp', rating: 5 },
  { id: '2', quote: 'A rare combination of technical depth and strategic thinking. Highly recommended.', author: 'Marcus Johnson', role: 'Founder', company: 'StartupXYZ', rating: 5 },
  { id: '3', quote: 'The kind of leader who elevates everyone around them. Best hire we made this year.', author: 'Emily Rodriguez', role: 'CTO', company: 'ScaleUp', rating: 5 },
];

export function ProfessionalBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.5 0.2 270)'; // Bold executive purple
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);

  React.useEffect(() => {
    if (!isPreview) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % mockTestimonials.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isPreview]);

  const nextTestimonial = () => setCurrentTestimonial((prev) => (prev + 1) % mockTestimonials.length);
  const prevTestimonial = () => setCurrentTestimonial((prev) => (prev - 1 + mockTestimonials.length) % mockTestimonials.length);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '14px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Bold Executive Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />

        {/* Primary dramatic glow */}
        <div
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[300px] opacity-45"
          style={{ background: `radial-gradient(ellipse at center, ${accent}35 0%, transparent 60%)` }}
        />

        {/* Secondary glow */}
        <div
          className="absolute bottom-0 right-1/5 w-[600px] h-[600px] rounded-full blur-[300px] opacity-35"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}30 0%, transparent 60%)` }}
        />

        {/* Center bridge glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[200px] opacity-25"
          style={{ background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)` }}
        />

        {/* Executive accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}60, ${secondaryAccent}50, transparent)` }}
        />

        {/* Bold grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0, ${accent} 2px, transparent 2px, transparent 50px)`,
          }}
        />
      </div>

      {/* Orbital Background - Bold Density */}
      <OrbitalBackground
        orbCount={6}
        orbSizes={[180, 220, 140, 200, 120, 160]}
        colors={[
          `oklch(0.6 0.18 260 / 0.1)`,
          `oklch(0.55 0.2 270 / 0.09)`,
          `oklch(0.65 0.14 250 / 0.08)`,
          `oklch(0.52 0.22 275 / 0.08)`,
          `oklch(0.7 0.12 245 / 0.07)`,
          `oklch(0.58 0.16 265 / 0.06)`,
        ]}
        speed={0.13}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blobs - Bold */}
      <MorphingBlob
        size={450}
        color={accent}
        opacity={0.16}
        speed={0.07}
        complexity={4}
        className="absolute top-1/5 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />
      <MorphingBlob
        size={320}
        color={secondaryAccent}
        opacity={0.12}
        speed={0.05}
        complexity={3}
        className="absolute bottom-1/5 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <Stack space={12} className="relative max-w-[960px] mx-auto px-4 py-20" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Hero Section - Bold Executive Presence */}
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="text-center relative"
        >
          {/* Layered glow system - Bold */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none blur-2xl"
            style={{ background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full pointer-events-none"
            style={{ border: `2px solid ${accent}30`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : 360, scale: [1, 1.08, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full pointer-events-none"
            style={{ border: `1px solid ${secondaryAccent}20`, borderRadius: '50%' }}
            animate={{ rotate: reducedMotion ? 0 : -360 }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          />

          {/* Top accent bar */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-2 rounded-b-lg"
            style={{
              background: `linear-gradient(90deg, ${accent}, ${secondaryAccent})`,
              transformOrigin: 'center',
            }}
            initial={reducedMotion ? {} : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ ...spring.bouncy, delay: 0.3 }}
          />

          <div className="relative inline-block mb-8">
            <Avatar className="h-36 w-36 ring-4 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-5xl font-bold">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Verified Badge with Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: reducedMotion ? 0 : 360 }}
              transition={{
                scale: { ...spring.bouncy, delay: 0.5 },
                rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
              }}
              className="absolute -bottom-3 -right-3 h-9 w-9 rounded-full border-3 flex items-center justify-center"
              style={{
                background: `conic-gradient(from 0deg, ${accent}, ${secondaryAccent}, ${accent})`,
                borderColor: 'var(--background)',
                boxShadow: `0 0 0 6px ${accent}25, 0 12px 40px -12px ${accent}`,
              }}
              aria-label="Verified"
            >
              <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </motion.div>
          </div>

          <Stack space={5}>
            <motion.h1
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter"
              style={{ fontFamily: 'var(--font-geist)', letterSpacing: '-0.025em' }}
            >
              <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 40%, ${secondaryAccent} 80%, ${accent} 100%)`, backgroundSize: '300% 300%' }}>
                {profile.name}
              </span>
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

            {/* Verified badge */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.6 }}
            >
              <Badge
                variant="success"
                className={cn('gap-2 px-5 py-2.5', isPreview && 'opacity-80')}
                style={{ fontFamily: 'var(--font-geist)', fontSize: '0.9rem' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Verified Professional
              </Badge>
            </motion.div>
          </Stack>
        </motion.div>

        {/* Bio Card - Bold Glassmorphism */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.5 }}
          >
            <ParallaxLayers strength={20} className="w-full">
              <div className="relative w-full max-w-4xl mx-auto">
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: `linear-gradient(135deg, ${accent}12 0%, ${secondaryAccent}08 100%)`, filter: 'blur(2px)' }}
                />
                <div
                  className="relative rounded-3xl border p-2 overflow-hidden"
                  style={{
                    borderColor: `${accent}40`,
                    background: 'var(--card)',
                    boxShadow: `0 0 0 1px ${accent}20, 0 20px 60px -20px ${accent}25, inset 0 2px 0 ${accent}15`,
                  }}
                >
                  <div className="relative p-8 rounded-2xl" style={{ background: 'var(--card)' }}>
                    <Text size="lg" color="foreground" style={{ lineHeight: 1.9, fontFamily: 'var(--font-geist)', textAlign: 'center', maxWidth: '700px', margin: '0 auto', fontSize: '1.15rem' }}>
                      {profile.bio}
                    </Text>
                  </div>
                </div>
              </div>
            </ParallaxLayers>
          </motion.div>
        )}

        {/* Testimonial Carousel - Bold & Interactive */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.6 }}
        >
          <Stack space={6} className="max-w-4xl mx-auto">
            <Flex between className="flex-wrap gap-4" wrap>
              <Text size="sm" weight="semibold" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Trusted By Leaders
              </Text>
              <Badge variant="outline" className="gap-1.5" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem', borderColor: `${accent}30` }}>
                {currentTestimonial + 1} / {mockTestimonials.length}
              </Badge>
            </Flex>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={reducedMotion ? {} : { opacity: 0, x: 40, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={reducedMotion ? {} : { opacity: 0, x: -40, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-full"
                >
                  <PerspectiveFlip axis="y" trigger="hover" duration={0.6}>
                    <div className="relative w-full" style={{ perspective: 1000 }}>
                      <TiltCard
                        maxTilt={4}
                        scale={1.01}
                        className="w-full"
                        style={{
                          borderRadius: '16px',
                          border: `1px solid ${accent}35`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}06 100%)`,
                          boxShadow: `0 0 0 1px ${accent}15, 0 20px 60px -20px ${accent}20`,
                        }}
                      >
                        <div className="p-7 flex flex-col justify-center">
                          <Flex between className="mb-4" wrap>
                            <Flex gap={1}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={i < (mockTestimonials[currentTestimonial].rating || 5) ? 'h-5 w-5 fill-[var(--color-primary)] text-[var(--color-primary)]' : 'h-5 w-5 text-muted/30'}
                                />
                              ))}
                            </Flex>
                          </Flex>

                          <Text size="base" color="foreground" className="mb-6 italic" style={{ lineHeight: 1.8, fontFamily: 'var(--font-geist)' }}>
                            &ldquo;{mockTestimonials[currentTestimonial].quote}&rdquo;
                          </Text>

                          <Flex align="center" gap={4}>
                            <Avatar className="h-12 w-12 ring-2" ringColor={accent}>
                              <AvatarFallback className="text-lg font-medium">{mockTestimonials[currentTestimonial].author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Flex column gap={1}>
                              <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
                                {mockTestimonials[currentTestimonial].author}
                              </Text>
                              <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                                {mockTestimonials[currentTestimonial].role}{mockTestimonials[currentTestimonial].company && `, ${mockTestimonials[currentTestimonial].company}`}
                              </Text>
                            </Flex>
                          </Flex>
                        </div>
                      </TiltCard>
                    </div>
                  </PerspectiveFlip>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Dots - Animated */}
              <Flex center gap={2} className="mt-6" wrap>
                {mockTestimonials.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className="h-2 rounded-full transition-all"
                    style={{
                      background: i === currentTestimonial ? accent : 'var(--muted)',
                      width: i === currentTestimonial ? '1.75rem' : '0.625rem',
                    }}
                    aria-label={`Go to testimonial ${i + 1}`}
                    initial={reducedMotion ? {} : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring.bouncy, delay: 0.8 + i * 0.05 }}
                    whileHover={{ scale: i === currentTestimonial ? 1.2 : 1.5 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </Flex>
            </div>
          </Stack>
        </motion.div>

        {/* Links - Bold Magnetic + Tilt Cards */}
        {profile.links.length > 0 && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
          >
            <Stack space={4} className="w-full max-w-[960px]">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 20)
                .map((link, index) => {
                  const useTilt = index % 2 === 1; // Alternate for visual rhythm
                  return (
                    <motion.div
                      key={link.id}
                      initial={reducedMotion ? {} : { opacity: 0, y: 35, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ ...spring.magnetic, delay: 0.7 + index * 0.04 }}
                    >
                      {useTilt ? (
                        <TiltCard
                          maxTilt={7}
                          scale={1.025}
                          className={cn('w-full', isPreview && 'opacity-80')}
                          style={{
                            borderRadius: '14px',
                            border: `1px solid ${accent}30`,
                            background: `linear-gradient(145deg, var(--card) 0%, ${accent}08 100%)`,
                            boxShadow: `0 0 0 1px ${accent}18, 0 16px 50px -16px ${accent}22`,
                          }}
                        >
                          <BoldLinkButton link={link} accent={accent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="tilt" />
                        </TiltCard>
                      ) : (
                        <MagneticCard
                          radius={170}
                          strength={0.25}
                          className={cn('w-full', isPreview && 'opacity-80')}
                          style={{
                            borderRadius: '14px',
                            border: `1px solid ${accent}25`,
                            background: `linear-gradient(145deg, var(--card) 0%, ${secondaryAccent}05 100%)`,
                            boxShadow: `0 0 0 1px ${accent}12, 0 12px 40px -12px ${accent}18`,
                          }}
                        >
                          <BoldLinkButton link={link} accent={accent} index={index} onClick={onLinkClick} isPreview={isPreview} variant="magnetic" />
                        </MagneticCard>
                      )}
                    </motion.div>
                  );
                })}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points - Bold PerspectiveFlip */}
        {profile.proofs.length > 0 && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
          >
            <Stack space={4} className="w-full max-w-[960px]">
              {profile.proofs
                .slice(0, 8)
                .map((proof, index) => (
                  <PerspectiveFlip key={proof.id} axis={index % 2 === 0 ? 'y' : 'x'} trigger="hover" duration={0.6}>
                    <div className="relative w-full" style={{ perspective: 1000 }}>
                      <MagneticCard
                        radius={130}
                        strength={0.15}
                        className={cn('w-full', isPreview && 'opacity-80')}
                        style={{
                          borderRadius: '14px',
                          border: `1px solid ${accent}40`,
                          background: `linear-gradient(145deg, var(--card) 0%, ${accent}10 100%)`,
                          minHeight: 76,
                          boxShadow: `0 0 0 1px ${accent}20, 0 16px 50px -16px ${accent}25`,
                        }}
                      >
                        <div className="p-5.5 flex items-center gap-5">
                          {proof.icon && (
                            <motion.div
                              initial={reducedMotion ? {} : { scale: 0, rotate: index % 2 === 0 ? -180 : 180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ ...spring.bouncy, delay: 0.8 + index * 0.08 }}
                              className="group-hover:rotate-12 group-hover:scale-110 transition-all duration-500"
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: '14px',
                                background: `linear-gradient(135deg, ${accent}, ${secondaryAccent}, ${accent})`,
                                color: 'var(--primary-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                boxShadow: `0 10px 40px -10px ${accent}`,
                              }}
                            >
                              {proof.icon}
                            </motion.div>
                          )}
                          <Flex column gap={2.5} flex={1} className="min-w-0">
                            <Text weight="bold" size="base" style={{ fontFamily: 'var(--font-geist)' }}>
                              {proof.title}
                            </Text>
                            {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>{proof.value}</Text>}
                          </Flex>
                        </div>
                      </MagneticCard>
                    </div>
                  </PerspectiveFlip>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* Footer - Bold Subdomain */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring.magnetic, delay: 1.5 }}
          className="text-center pt-8"
        >
          <Flex center gap={3} className="mx-auto">
            <Box
              className="px-6 py-3.5 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                border: `2px solid ${accent}45`,
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '1rem',
                color: accent,
                fontWeight: 700,
                letterSpacing: '0.05em',
                boxShadow: `0 0 0 6px ${accent}12, 0 12px 48px -12px ${accent}25`,
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

function BoldLinkButton({
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
  variant: 'magnetic' | 'tilt';
}) {
  const reducedMotion = useReducedMotion();

  return (
    <button
      onClick={() => onClick?.(link)}
      className="relative w-full px-7 py-5.5 text-left group overflow-hidden"
      style={{ borderRadius: '14px', fontFamily: 'var(--font-geist)' }}
    >
      {/* Anim left accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{
          background: `linear-gradient(180deg, ${accent}, oklch(0.5 0.2 270))`,
          borderRadius: '14px 0 0 14px',
          transformOrigin: 'bottom',
        }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.magnetic, delay: 0.6 + index * 0.04 }}
      />

      {/* Shimmer */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}12, transparent)` }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Magnetic hover glow */}
      {variant === 'magnetic' && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${accent}40, 0 20px 60px -20px ${accent}30`,
            borderRadius: '14px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}

      <Flex align="center" gap={6} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.06 }}
          className="flex-shrink-0 group-hover:scale-115 group-hover:rotate-6 transition-all duration-400"
          style={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${accent}, oklch(0.55 0.18 260))`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.4rem',
            boxShadow: `0 12px 40px -12px ${accent}`,
          }}
        >
          {link.icon || link.label.charAt(0).toUpperCase()}
        </motion.div>

        <Flex column gap={3} flex={1} className="min-w-0">
          <motion.span
            initial={reducedMotion ? {} : { x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.gentle, delay: index * 0.05 }}
            className="font-semibold truncate group-hover:text-primary transition-colors"
            style={{ fontFamily: 'var(--font-geist)', fontSize: '1.2rem' }}
          >
            {link.label}
          </motion.span>
          <Text size="sm" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {link.url}
          </Text>
        </Flex>

        <Flex align="center" gap={3}>
          <motion.span
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.7, x: 15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ ...spring.gentle, delay: 0.8 + index * 0.04 }}
            style={{
              fontSize: '0.875rem',
              color: accent,
              fontFamily: 'var(--font-geist-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
            }}
          >
            {link.clicks.toLocaleString()}
          </motion.span>
          <Badge
            variant="default"
            size="sm"
            className="group-hover:bg-primary/90 group-hover:text-primary-foreground transition-all"
            style={{ fontSize: '0.7rem', fontFamily: 'var(--font-geist)', fontWeight: 700, background: accent }}
          >
            #{index + 1}
          </Badge>
        </Flex>
      </Flex>
    </button>
  );
}

ProfessionalBoldTemplate.displayName = 'ProfessionalBoldTemplate';
