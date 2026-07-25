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
import { Heart, MessageCircle, Share2, ChevronRight, MoreHorizontal, Star, Zap, TrendingUp } from 'lucide-react';

export function SocialBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#8b5cf6';
  const secondaryAccent = '#ec4899';
  const tertiaryAccent = '#06b6d4';
  const accentGold = '#fbbf24';
  const socialBg = 'oklch(0.08 0.02 280)';
  const socialCardBg = 'oklch(0.11 0.02 280)';
  const socialBorder = 'oklch(0.2 0.02 280)';
  const socialHeaderBg = 'oklch(0.13 0.02 280)';

  const mockPosts = [
    {
      id: '1',
      content: 'Just launched the most comprehensive link-in-bio platform with 25+ animated templates! 🎉 Full 3D orbital backgrounds, magnetic hover cards, tilt cards, and real-time analytics. Built with Next.js 15 + Supabase.',
      time: '2h ago',
      likes: 1234,
      replies: 89,
      reposts: 234,
      views: 12400,
    },
    {
      id: '2',
      content: 'The new OKLCH design tokens are a game changer. Perceptual uniformity across all 5 profile themes. No more guessing games with color contrast. Every template adapts perfectly to any accent color instantly.',
      time: '1d ago',
      likes: 2156,
      replies: 134,
      reposts: 412,
      views: 28900,
    },
    {
      id: '3',
      content: 'MagneticCard + TiltCard + PerspectiveFlip = pure magic ✨ The cursor attraction with 3D rotation makes every interaction feel alive. Framer Motion spring configs (snappy, standard, gentle, bouncy, smooth, magnetic, orbital) power it all.',
      time: '3d ago',
      likes: 892,
      replies: 56,
      reposts: 178,
      views: 15600,
    },
    {
      id: '4',
      content: 'Thinking in systems, not pages. The new template registry with 25 templates across Essential, Professional, Creative, Technical, and Social categories. Each with 5 intensity levels: Minimal, Light, Standard, Bold, Max.',
      time: '5d ago',
      likes: 645,
      replies: 41,
      reposts: 123,
      views: 9800,
    },
  ];

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '16px',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* Social Bold Background - Dark & Dramatic */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, ${socialBg} 0%, oklch(0.06 0.02 280) 50%, ${socialBg} 100%)`
        }} />
        {/* Dual OrbitalBackground - Primary */}
        <div className="absolute inset-0 pointer-events-none">
          <OrbitalBackground
            orbCount={10}
            orbSizes={[300, 220, 360, 180, 280, 140, 320, 160, 240, 200]}
            colors={[
              `oklch(0.65 0.18 280 / 0.18)`,
              `oklch(0.6 0.2 340 / 0.15)`,
              `oklch(0.7 0.15 200 / 0.12)`,
              `oklch(0.55 0.22 280 / 0.12)`,
              `oklch(0.62 0.16 280 / 0.1)`,
              `oklch(0.58 0.18 340 / 0.1)`,
              `oklch(0.68 0.18 280 / 0.08)`,
              `oklch(0.62 0.2 340 / 0.08)`,
              `oklch(0.55 0.16 280 / 0.06)`,
              `oklch(0.6 0.18 340 / 0.06)`,
            ]}
            speed={0.2}
            className="pointer-events-none"
          />
        </div>
        {/* Dual OrbitalBackground - Secondary (Purple/Gold) */}
        <div className="absolute inset-0 pointer-events-none">
          <OrbitalBackground
            orbCount={5}
            orbSizes={[280, 340, 200, 260, 180]}
            colors={[
              `oklch(0.6 0.25 270 / 0.12)`,
              `oklch(0.65 0.18 80 / 0.1)`,
              `oklch(0.55 0.22 280 / 0.08)`,
              `oklch(0.62 0.2 270 / 0.08)`,
              `oklch(0.6 0.25 80 / 0.06)`,
            ]}
            speed={0.35}
            className="pointer-events-none"
          />
        </div>
        {/* Glow orbs */}
        <div
          className="absolute top-1/4 left-1/5 w-[450px] h-[450px] rounded-full blur-[300px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/3 right-1/5 w-[400px] h-[400px] rounded-full blur-[300px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${accentGold}30 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/5 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[350px] opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}25 0%, transparent 70%)` }}
        />

      </div>

      {/* Triple Morphing Blob - Bold Glows */}
      <MorphingBlob size={380} color={accent} opacity={0.2} speed={0.1} complexity={5} className="absolute top-1/4 left-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={320} color={accentGold} opacity={0.15} speed={0.09} complexity={4} className="absolute top-1/3 right-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={260} color={secondaryAccent} opacity={0.12} speed={0.08} complexity={3} className="absolute bottom-1/5 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Parallax Layers - Floating Social Elements */}
      <ParallaxLayers strength={20} className="pointer-events-none">
        <ParallaxBoldSocial x={10} y={15} size={28} color={accent} delay={0} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxBoldSocial x={90} y={12} size={32} color={secondaryAccent} delay={0.3} icon="★" reducedMotion={reducedMotion} />
        <ParallaxBoldSocial x={8} y={82} size={28} color={accent} delay={0.6} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxBoldSocial x={92} y={88} size={32} color={secondaryAccent} delay={0.9} icon="★" reducedMotion={reducedMotion} />
        <ParallaxBoldSocial x={45} y={8} size={28} color={accentGold} delay={0.1} icon="⚡" reducedMotion={reducedMotion} />
        <ParallaxBoldSocial x={95} y={45} size={28} color={accent} delay={0.4} icon="★" reducedMotion={reducedMotion} />
        <ParallaxBoldSocial x={12} y={50} size={28} color={secondaryAccent} delay={0.7} icon="✨" reducedMotion={reducedMotion} />
        <ParallaxBoldSocial x={88} y={28} size={28} color={accentGold} delay={1} icon="⚡" reducedMotion={reducedMotion} />
      </ParallaxLayers>

      <Stack space={8} className="relative max-w-[760px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* HEADER WITH ENGAGEMENT RINGS */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <Stack space={4} align="center" className="text-center">
            <div className="relative">
              {/* Triple pulse rings */}
              <motion.div
                className="absolute -inset-4 rounded-full border-2"
                style={{ borderColor: accent }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute -inset-8 rounded-full border-2"
                style={{ borderColor: accentGold }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              />
              <motion.div
                className="absolute -inset-12 rounded-full border-2"
                style={{ borderColor: secondaryAccent }}
                animate={{ scale: [1, 1.45, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 1 }}
              />
              <Avatar className="h-28 w-28 border-4 relative" style={{ borderColor: accent, background: `linear-gradient(135deg, ${accent}20, ${accentGold}20)` }}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2.5rem', color: accent }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <Stack space={1} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.3 }}
                style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, letterSpacing: '-0.03em' }}
              >
                {profile.name}
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.4 }}
                  style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)' }}
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
              <Flex gap={7} centerX>
                <Flex column gap={0.25} align="center">
                  <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                    {profile.links.filter(l => l.isVisible).length}
                  </Text>
                  <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Links
                  </Text>
                </Flex>
                <Flex column gap={0.25} align="center">
                  <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accentGold }}>
                    1.2K
                  </Text>
                  <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Followers
                  </Text>
                </Flex>
                <Flex column gap={0.25} align="center">
                  <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: secondaryAccent }}>
                    5.4M
                  </Text>
                  <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Clicks
                  </Text>
                </Flex>
              </Flex>
            </motion.div>
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
              className="w-full max-w-[700px] mx-auto"
              style={{
                background: socialCardBg,
                border: `1px solid ${socialBorder}`,
                borderRadius: '20px',
                padding: '2rem 2.5rem',
                boxShadow: '0 20px 40px -12px oklch(0.65 0.18 280 / 0.15)',
              }}
            >
              <motion.p
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.1 }}
                className="text-center"
                style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.25rem', lineHeight: 1.7, color: 'oklch(0.9 0.02 280)' }}
              >
                {profile.bio}
              </motion.p>
            </MagneticCard>
          </motion.div>
        )}

        {/* FEATURED POSTS - TiltCard with PerspectiveFlip */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.7 }}
        >
          <div style={{ height: '1px', background: socialBorder, marginBottom: '1.5rem' }} />
          <Stack space={4}>
            <AnimatePresence mode="wait">
              {mockPosts.map((post, index) => (
                <PerspectiveFlip
                  key={post.id}
                  axis="y"
                  duration={0.6}
                  style={{ width: '100%' }}
                >
                  <div style={{ position: 'relative' }}>
                    <TiltCard maxTilt={6} scale={1.01}>
                      <motion.div
                        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ ...spring.gentle, delay: index * 0.08 }}
                        className="relative"
                        style={{ background: socialCardBg, border: `1px solid ${socialBorder}`, borderRadius: '20px', overflow: 'hidden' }}
                      >
                        {/* Top accent bar */}
                        <motion.div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ background: `linear-gradient(90deg, ${accent}, ${secondaryAccent}, ${accentGold})` }}
                          initial={reducedMotion ? { width: '100%' } : { width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ ...spring.snappy, delay: 0.8 + index * 0.08 }}
                        />
                        <div className="p-5">
                          {/* Post Header */}
                          <Flex align="center" gap={3} className="mb-3">
                            <Avatar className="h-12 w-12" style={{ borderColor: accent }}>
                              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                              <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.25rem', color: accent }}>
                                {profile.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Flex column gap={0.5} flex={1}>
                              <Flex align="center" gap={1.5}>
                                <Text weight="semibold" style={{ fontFamily: 'var(--font-syne)' }}>{profile.name}</Text>
                                <motion.span
                                  animate={{ rotate: [0, 8, -8, 0] }}
                                  transition={{ duration: 2.5, repeat: Infinity }}
                                  style={{ color: '#3b82f6', fontSize: '0.75rem' }}
                                >
                                  ✓
                                </motion.span>
                              </Flex>
                              <Text size="xs" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 280)' }}>
                                {post.time}
                              </Text>
                            </Flex>
                            <MagneticCard radius={60} strength={0.1} className="p-1" style={{ background: 'transparent', border: 'none' }}>
                              <button className="p-2 rounded-full hover:bg-primary/10 transition-colors" style={{ color: 'oklch(0.5 0.02 280)' }}>
                                <MoreHorizontal className="h-5 w-5" />
                              </button>
                            </MagneticCard>
                          </Flex>

                          {/* Post Content */}
                          <motion.p
                            initial={reducedMotion ? {} : { opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...spring.gentle, delay: 0.9 + index * 0.08 }}
                            style={{ fontFamily: 'var(--font-geist)', fontSize: '1rem', lineHeight: 1.6, color: 'oklch(0.85 0.02 280)' }}
                          >
                            {post.content}
                          </motion.p>

                          {/* Engagement Bar */}
                          <div className="flex items-center justify-between pt-4 mt-4 border-t" style={{ borderColor: socialBorder }}>
                            <Flex gap={6}>
                              <EngagementButtonBold icon={MessageCircle} count={post.replies} iconText="Replies" accent={accent} />
                              <EngagementButtonBold icon={Heart} count={post.likes} iconText="Likes" accent={secondaryAccent} />
                              <EngagementButtonBold icon={Share2} count={post.reposts} iconText="Reposts" accent={tertiaryAccent} />
                              <EngagementButtonBold icon={TrendingUp} count={post.views} iconText="Views" accent={accentGold} />
                            </Flex>
                            <MagneticCard radius={60} strength={0.12} className="px-4 py-2" style={{ background: 'transparent', border: 'none' }}>
                              <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/10 transition-colors" style={{ fontFamily: 'var(--font-geist)', color: accent }}>
                                <Share2 className="h-4 w-4" />
                                Share
                              </button>
                            </MagneticCard>
                          </div>
                        </div>
                      </motion.div>
                    </TiltCard>
                  </div>
                </PerspectiveFlip>
              ))}
            </AnimatePresence>
          </Stack>
        </motion.div>

        {/* LINKS - TiltCard + MagneticCard Grid */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
          >
            <div style={{ height: '1px', background: socialBorder, marginBottom: '1.5rem' }} />
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => (
                  <TiltCard key={link.id} maxTilt={8} scale={1.015}>
                    <MagneticCard
                      radius={60}
                      strength={0.12}
                      className={cn('w-full h-full flex flex-col', isPreview && 'opacity-80')}
                      style={{
                        borderRadius: '16px',
                        border: `1px solid ${socialBorder}`,
                        background: socialCardBg,
                        boxShadow: '0 12px 32px -8px oklch(0.65 0.18 280 / 0.15)',
                        padding: '0.5rem',
                      }}
                    >
                      <motion.button
                        onClick={() => onLinkClick?.(link)}
                        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring.gentle, delay: 1 + index * 0.04 }}
                        className="w-full h-full flex flex-col p-5 text-left"
                        style={{ fontFamily: 'var(--font-geist)' }}
                      >
                        <Flex align="center" gap={4} className="mb-4">
                          <motion.div
                            initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ ...spring.bouncy, delay: 1.1 + index * 0.04 }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '12px',
                              background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '1.25rem',
                              fontFamily: 'var(--font-geist)',
                              boxShadow: `0 8px 24px -4px ${accent}40`,
                            }}
                          >
                            {link.icon || link.label.charAt(0).toUpperCase()}
                          </motion.div>
                          <Flex column gap={1} flex={1} className="min-w-0">
                            <motion.span
                              initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...spring.gentle, delay: 1.1 + index * 0.04 }}
                              style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, color: 'oklch(0.9 0.02 280)' }}
                            >
                              {link.label}
                            </motion.span>
                            <Text size="xs" className="truncate font-mono" style={{ color: 'oklch(0.5 0.02 280)', fontFamily: 'var(--font-geist-mono)' }}>
                              {link.url}
                            </Text>
                          </Flex>
                        </Flex>
                        <div className="flex-1" />
                        <Flex between centerY className="pt-4 border-t" style={{ borderColor: socialBorder }}>
                          <motion.span
                            initial={reducedMotion ? {} : { opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...spring.gentle, delay: 1.2 + index * 0.04 }}
                            style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 600, color: accent, fontSize: '0.875rem' }}
                          >
                            {link.clicks.toLocaleString()} clicks
                          </motion.span>
                          <motion.div
                            initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ ...spring.bouncy, delay: 1.2 + index * 0.04 }}
                          >
                            <Badge
                              variant="default"
                              size="sm"
                              className="px-3 py-1"
                              style={{ fontFamily: 'var(--font-syne)', background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})` }}
                            >
                              #{index + 1}
                            </Badge>
                          </motion.div>
                        </Flex>
                      </motion.button>
                    </MagneticCard>
                  </TiltCard>
                ))}
            </Grid>
          </motion.div>
        )}

        {/* SUBDOMAIN */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.1 }}
          className="text-center pt-6"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{ background: socialCardBg, border: `1px solid ${accent}40`, boxShadow: '0 8px 24px -8px oklch(0.65 0.18 280 / 0.2)' }}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
          </div>
        </motion.div>
      </Stack>
    </div>
  );
}

// ==================== ENGAGEMENT BUTTON BOLD ====================

function EngagementButtonBold({ icon: Icon, count, iconText, accent }: { icon: React.ElementType; count: number; iconText: string; accent: string }) {
  return (
    <button className="flex items-center gap-1.5 transition-colors" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.8125rem', color: 'oklch(0.5 0.02 280)' }}>
      <Icon className="h-4 w-4" style={{ color: accent }} />
      <span>{count >= 1000000 ? (count / 1000000).toFixed(1) + 'M' : count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}</span>
    </button>
  );
}

// ==================== PARALLAX BOLD SOCIAL ELEMENTS ====================

function ParallaxBoldSocial({ x, y, size, color, delay, icon, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; icon: string; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.4,
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
        y: [-15, 15, -15],
        x: [-10, 10, -10],
        opacity: [0.25, 0.6, 0.25],
        rotate: [-8, 8, -8],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {icon}
    </motion.div>
  );
}

SocialBoldTemplate.displayName = 'SocialBoldTemplate';
