'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, PerspectiveFlip, OrbitalParticles, LayeredGlowSystem } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Star, Zap, TrendingUp, Users, ExternalLink } from 'lucide-react';

export function SocialMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#8b5cf6';
  const secondaryAccent = '#ec4899';
  const tertiaryAccent = '#06b6d4';
  const accentGold = '#fbbf24';
  const socialBg = 'oklch(0.08 0.02 280)';
  const socialCardBg = 'oklch(0.11 0.02 280)';
  const socialBorder = 'oklch(0.18 0.02 280)';
  const socialHeaderBg = 'oklch(0.13 0.02 280)';

  const mockPosts = [
    {
      id: '1',
      content: 'Just shipped the most comprehensive link-in-bio platform ever built! 🚀 25+ animated templates across 5 categories (Essential, Professional, Creative, Technical, Social) with full 3D orbital backgrounds, magnetic hover cards, tilt effects, perspective flip, and real-time analytics.',
      time: '2h ago',
      likes: 3421,
      replies: 289,
      reposts: 567,
      views: 42100,
      author: profile.name,
      avatar: profile.avatarUrl,
      verified: true,
    },
    {
      id: '2',
      content: 'The new OKLCH design tokens are a game changer for perceptual color uniformity. Combined with Syne variable font for creative templates and Geist Mono for technical ones. Every template has its own personality and adapts to any accent color instantly.',
      time: '1d ago',
      likes: 5234,
      replies: 412,
      reposts: 891,
      views: 67800,
      author: profile.name,
      avatar: profile.avatarUrl,
      verified: true,
    },
    {
      id: '3',
      content: 'MagneticCard + TiltCard + PerspectiveFlip + ParallaxLayers + OrbitalParticles = pure interaction magic ✨ The cursor attraction with 3D rotation makes every interaction feel alive. Built with Framer Motion springs tuned for 60fps across all 7 presets.',
      time: '3d ago',
      likes: 2156,
      replies: 178,
      reposts: 423,
      views: 31200,
      author: profile.name,
      avatar: profile.avatarUrl,
      verified: true,
    },
    {
      id: '4',
      content: 'Thinking in systems, not pages. The new template registry with 25 templates across Essential, Professional, Creative, Technical, and Social categories. Each with 5 intensity levels from Minimal to Max. Full lazy-loading for heavy templates.',
      time: '5d ago',
      likes: 1834,
      replies: 134,
      reposts: 298,
      views: 24500,
      author: profile.name,
      avatar: profile.avatarUrl,
      verified: true,
    },
    {
      id: '5',
      content: 'Live preview iframe switching under 300ms! The TemplateSelector with ProfilePreview component makes choosing your vibe instant. Hover any card, see it live. Click to apply. Zero bundle size impact with dynamic imports.',
      time: '1w ago',
      likes: 4123,
      replies: 289,
      reposts: 634,
      views: 58900,
      author: profile.name,
      avatar: profile.avatarUrl,
      verified: true,
    },
    {
      id: '6',
      content: 'Deploying to Vercel with ENCRYPTION_KEY for secure API keys. Supabase PostgreSQL with RLS for multi-tenant data isolation. Edge functions for webhook delivery with HMAC-SHA256 signing. Production-ready infrastructure.',
      time: '2w ago',
      likes: 892,
      replies: 78,
      reposts: 156,
      views: 12300,
      author: profile.name,
      avatar: profile.avatarUrl,
      verified: true,
    },
  ];

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '0',
        '--profile-shadow': 'none',
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      {/* FULL-BLEED IMMERSIVE BACKGROUND */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        {/* Quad MorphingBlob - Maximum impact */}
        <MorphingBlob size={480} color={accent} opacity={0.18} speed={0.1} complexity={6} className="absolute top-1/4 left-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <MorphingBlob size={400} color={secondaryAccent} opacity={0.14} speed={0.08} complexity={5} className="absolute top-1/3 right-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <MorphingBlob size={340} color={tertiaryAccent} opacity={0.12} speed={0.09} complexity={4} className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <MorphingBlob size={280} color={accentGold} opacity={0.1} speed={0.07} complexity={3} className="absolute bottom-1/3 right-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Triple OrbitalBackground */}
        <div className="absolute inset-0 pointer-events-none">
          <OrbitalBackground
            orbCount={14}
            orbSizes={[350, 260, 400, 200, 320, 180, 380, 160, 300, 220, 360, 140, 280, 240]}
            colors={[
              `oklch(0.68 0.18 280 / 0.22)`,
              `oklch(0.62 0.2 340 / 0.2)`,
              `oklch(0.72 0.15 200 / 0.18)`,
              `oklch(0.58 0.22 280 / 0.18)`,
              `oklch(0.65 0.16 280 / 0.15)`,
              `oklch(0.6 0.18 340 / 0.15)`,
              `oklch(0.68 0.18 280 / 0.12)`,
              `oklch(0.62 0.2 340 / 0.12)`,
              `oklch(0.7 0.15 200 / 0.1)`,
              `oklch(0.55 0.22 280 / 0.1)`,
              `oklch(0.6 0.18 340 / 0.08)`,
              `oklch(0.55 0.16 280 / 0.08)`,
              `oklch(0.65 0.18 280 / 0.06)`,
              `oklch(0.6 0.2 340 / 0.06)`,
            ]}
            speed={0.18}
            className="opacity-30"
          />
          <OrbitalBackground
            orbCount={8}
            orbSizes={[280, 340, 220, 300, 180, 260, 200, 320]}
            colors={[
              `oklch(0.65 0.2 340 / 0.15)`,
              `oklch(0.7 0.18 340 / 0.12)`,
              `oklch(0.6 0.22 300 / 0.1)`,
              `oklch(0.68 0.16 340 / 0.1)`,
              `oklch(0.55 0.2 340 / 0.08)`,
              `oklch(0.62 0.18 300 / 0.08)`,
              `oklch(0.7 0.16 340 / 0.06)`,
              `oklch(0.58 0.2 340 / 0.06)`,
            ]}
            speed={0.25}
            className="opacity-20"
          />
          <OrbitalBackground
            orbCount={5}
            orbSizes={[300, 220, 280, 180, 240]}
            colors={[
              `oklch(0.7 0.18 200 / 0.1)`,
              `oklch(0.65 0.2 200 / 0.08)`,
              `oklch(0.72 0.16 200 / 0.06)`,
              `oklch(0.6 0.22 180 / 0.06)`,
              `oklch(0.58 0.18 200 / 0.04)`,
            ]}
            speed={0.35}
            className="opacity-15"
          />
        </div>

        {/* Orbital Particles - Maximum density */}
        <OrbitalParticles
          count={100}
          size={3}
          color={accent}
          opacity={0.25}
          speed={0.1}
          className="pointer-events-none"
        />

        {/* Layered Glow System - Max intensity */}
        <LayeredGlowSystem
          layers={5}
          baseColor={accent}
          className="pointer-events-none"
        />

        {/* Floating social elements */}
        <SocialMaxFloatingElements accent={accent} secondaryAccent={secondaryAccent} tertiaryAccent={tertiaryAccent} accentGold={accentGold} reducedMotion={reducedMotion} />
      </div>

      {/* MAIN FEED */}
      <main className="relative z-10 min-h-screen">
        {/* STICKY HEADER WITH TABS */}
        <motion.div
          className="sticky top-0 z-50"
          style={{
            background: `${socialCardBg}CC`,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${socialBorder}`,
          }}
          initial={reducedMotion ? {} : { y: -100 }}
          animate={{ y: 0 }}
          transition={{ ...spring.snappy, delay: 0.2 }}
        >
          <Tabs defaultValue="posts" className="max-w-3xl mx-auto px-4" style={{ fontFamily: 'var(--font-geist)' }}>
            <TabsList className="w-full bg-transparent justify-between p-3" style={{ background: socialHeaderBg, border: `1px solid ${socialBorder}`, borderRadius: '12px' }}>
              <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-[var(--profile-accent)] data-[state=active]:text-white data-[state=active]:shadow-lg">
                <MessageCircle className="h-4 w-4 mr-1.5 inline" /> Posts
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-1.5 inline" /> Replies
              </TabsTrigger>
              <TabsTrigger value="media" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-1.5 inline" /> Media
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex-1">
                <Heart className="h-4 w-4 mr-1.5 inline" /> Likes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* CONTENT */}
        <Stack space={0} className="max-w-3xl mx-auto px-4 pb-16" style={{ fontFamily: 'var(--font-geist)' }}>
          {/* PROFILE HERO SECTION */}
          <motion.section
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.3 }}
            className="relative py-12"
          >
            <Stack space={4} align="center" className="text-center">
              <div className="relative">
                {/* Triple pulse rings */}
                <motion.div
                  className="absolute -inset-3 rounded-full border-2"
                  style={{ borderColor: accent }}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -inset-7 rounded-full border-2"
                  style={{ borderColor: secondaryAccent, opacity: 0.4 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.05, 0.6] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
                <motion.div
                  className="absolute -inset-11 rounded-full border-2"
                  style={{ borderColor: tertiaryAccent, opacity: 0.2 }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.02, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
                <Avatar className="h-28 w-28 border-4 relative" style={{ borderColor: accent }}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2.5rem', color: accent }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Stack space={1}>
                <motion.h1
                  initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.4 }}
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, letterSpacing: '-0.04em', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
                >
                  {profile.name}
                </motion.h1>

                {profile.headline && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.5 }}
                    style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)', fontSize: '1.125rem' }}
                  >
                    {profile.headline}
                  </motion.p>
                )}
              </Stack>

              {/* Stats Row */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.6 }}
              >
                <Flex gap={8} wrap centerX>
                  <StatItem value={profile.links.filter(l => l.isVisible).length} label="Links" color={accent} />
                  <StatDivider />
                  <StatItem value="1.2K" label="Followers" color={secondaryAccent} />
                  <StatDivider />
                  <StatItem value={formatCount(profile.links.reduce((sum, l) => sum + l.clicks, 0))} label="Total Clicks" color={tertiaryAccent} />
                  <StatDivider />
                  <StatItem value={mockPosts.reduce((sum, p) => sum + p.views, 0)} label="Total Views" color={accentGold} />
                </Flex>
              </motion.div>

              {/* Followers Avatar Stack */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.7 }}
                className="flex items-center justify-center -space-x-2 mt-4"
              >
                {['Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Avery'].map((name, i) => (
                  <motion.div
                    key={name}
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring.bouncy, delay: 0.8 + i * 0.06 }}
                    className="relative"
                  >
                    <Avatar className="h-10 w-10 ring-2" ringColor={socialCardBg}>
                      <AvatarFallback style={{ fontSize: '0.75rem', fontFamily: 'var(--font-syne)', fontWeight: 600, background: `linear-gradient(135deg, ${accent}20, ${secondaryAccent}20)`, color: accent }}>
                        {name.charAt(0)}
                      </AvatarFallback>
                      <motion.div
                        className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2"
                        style={{ background: accent, borderColor: socialCardBg }}
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                      />
                    </Avatar>
                  </motion.div>
                ))}
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.8 + 8 * 0.06 }}
                >
                  <Badge variant="outline" className="h-10 w-10 flex items-center justify-center text-xs px-0" style={{ fontFamily: 'var(--font-geist)', borderColor: accent, color: accent }}>
                    +99
                  </Badge>
                </motion.div>
              </motion.div>

              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 1 }}
              >
                <Button variant="ghost" className="mt-2" style={{ fontFamily: 'var(--font-syne)', borderColor: accent, color: accent }}>
                  <Users className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              </motion.div>
            </Stack>
          </motion.section>

          {/* BIO CARD */}
          {profile.bio && (
            <motion.section
              initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.8 }}
              className="px-4 pb-8"
            >
              <MagneticCard
                radius={60}
                strength={0.1}
                className="w-full"
                style={{
                  background: `${socialCardBg}E6`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${socialBorder}`,
                  borderRadius: '16px',
                  padding: '1.5rem 2rem',
                }}
              >
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.gentle, delay: 0.1 }}
                  style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.125rem', lineHeight: 1.7, color: 'oklch(0.9 0.02 280)', textAlign: 'center' }}
                >
                  {profile.bio}
                </motion.p>
              </MagneticCard>
            </motion.section>
          )}

          {/* LINKS BAR - Grid of MagneticCards */}
          <motion.section
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
            className="px-4 pb-8"
          >
            <Grid cols={{ base: 1, sm: 2, md: 3, xl: 4 }} gap={3}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 16)
                .map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    radius={80}
                    strength={0.15}
                    className={cn(isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '12px',
                      border: `1px solid ${socialBorder}`,
                      background: socialCardBg,
                      boxShadow: '0 4px 16px -4px oklch(0.68 0.18 280 / 0.1)',
                    }}
                  >
                    <motion.button
                      onClick={() => onLinkClick?.(link)}
                      initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring.gentle, delay: 1 + index * 0.03 }}
                      className="w-full p-3 text-left relative overflow-hidden rounded-[10px]"
                      style={{ fontFamily: 'var(--font-geist)' }}
                    >
                      {/* Animated top accent */}
                      <motion.div
                        className="absolute top-0 left-0 w-full h-0.5"
                        style={{ background: `linear-gradient(90deg, ${accent}, ${secondaryAccent})` }}
                        initial={reducedMotion ? { width: '100%' } : { width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ ...spring.snappy, delay: 1.1 + index * 0.03 }}
                      />
                      <Flex align="center" gap={2}>
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ ...spring.bouncy, delay: 1.1 + index * 0.03 }}
                          className="flex items-center justify-center font-medium"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                            color: 'white',
                            fontSize: '0.875rem',
                            fontFamily: 'var(--font-geist)',
                          }}
                        >
                          {link.icon || link.label.charAt(0).toUpperCase()}
                        </motion.div>
                        <Flex column gap={0.5} flex={1} className="min-w-0">
                          <motion.span
                            initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...spring.gentle, delay: 1.1 + index * 0.03 }}
                            style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, color: 'oklch(0.9 0.02 280)', fontSize: '0.875rem' }}
                          >
                            {link.label}
                          </motion.span>
                          <Text size="xs" className="truncate font-mono" style={{ color: 'oklch(0.5 0.02 280)', fontFamily: 'var(--font-geist-mono)' }}>
                            {link.clicks.toLocaleString()} clicks
                          </Text>
                        </Flex>
                      </Flex>
                    </motion.button>
                  </MagneticCard>
                ))}
            </Grid>
          </motion.section>

          {/* INFINITE FEED - Posts with TiltCard */}
          <motion.section
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1 }}
            className="px-4 pb-16"
          >
            <Stack space={5}>
              <AnimatePresence mode="wait">
                {mockPosts.map((post, postIndex) => (
                  <TiltCard key={post.id} maxTilt={5} scale={1.01}>
                    <motion.div
                      initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ ...spring.gentle, delay: postIndex * 0.08 }}
                      className="relative"
                      style={{
                        background: `${socialCardBg}F0`,
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${socialBorder}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: `0 16px 48px -12px ${accent}15`,
                      }}
                    >
                      <div className="p-5 space-y-4">
                        {/* Post Header */}
                        <Flex align="center" gap={3}>
                          <Avatar className="h-11 w-11" style={{ borderColor: accent }}>
                            <AvatarImage src={post.avatar} alt={post.author} className="object-cover" />
                            <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: accent }}>
                              {post.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Flex column gap={0.5} flex={1}>
                            <Flex align="center" gap={1.5}>
                              <Text weight="semibold" style={{ fontFamily: 'var(--font-syne)' }}>{post.author}</Text>
                              {post.verified && (
                                <motion.span
                                  animate={{ rotate: [0, 5, -5, 0] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  style={{ color: '#3b82f6', fontSize: '0.75rem' }}
                                >
                                  ✓
                                </motion.span>
                              )}
                            </Flex>
                            <Text size="xs" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 280)' }}>
                              {post.time}
                            </Text>
                          </Flex>
                          <MagneticCard radius={60} strength={0.1} className="p-1" style={{ background: 'transparent', border: 'none' }}>
                            <button className="p-2 rounded-full hover:bg-primary/10 transition-colors" style={{ color: 'oklch(0.5 0.02 280)' }}>
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </MagneticCard>
                        </Flex>

                        {/* Post Content */}
                        <motion.p
                          initial={reducedMotion ? {} : { opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring.gentle, delay: 0.1 + postIndex * 0.08 }}
                          style={{ fontFamily: 'var(--font-geist)', fontSize: '1rem', lineHeight: 1.6, color: 'oklch(0.9 0.02 280)' }}
                        >
                          {post.content}
                        </motion.p>

                        {/* Media Placeholder (if needed) */}
                        {/* {post.media && ( ... )} */}

                        {/* Engagement Bar */}
                        <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: socialBorder }}>
                          <Flex gap={6}>
                            <EngagementButton icon={MessageCircle} count={post.replies} color="oklch(0.5 0.02 280)" hoverColor="#3b82f6" label="Replies" />
                            <EngagementButton icon={Heart} count={post.likes} color="oklch(0.5 0.02 280)" hoverColor="#ef4444" label="Likes" />
                            <EngagementButton icon={Share2} count={post.reposts} color="oklch(0.5 0.02 280)" hoverColor="#22c55e" label="Reposts" />
                            <EngagementButton icon={Star} count={post.views} color="oklch(0.5 0.02 280)" hoverColor={accentGold} label="Views" />
                          </Flex>
                          <MagneticCard radius={60} strength={0.12} className="px-3 py-1.5" style={{ background: 'transparent', border: 'none' }}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-primary/10 transition-colors" style={{ fontFamily: 'var(--font-syne)', color: accent }}>
                              <Share2 className="h-3.5 w-3.5" />
                              Share
                            </button>
                          </MagneticCard>
                        </div>
                      </div>
                    </motion.div>
                  </TiltCard>
                ))}
              </AnimatePresence>

              {/* Load More */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 1.2 }}
                className="text-center pt-8"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto" style={{ fontFamily: 'var(--font-syne)', borderColor: accent, color: accent }}>
                  Load more posts
                </Button>
              </motion.div>
            </Stack>
          </motion.section>
        </Stack>
      </main>
    </div>
  );
}

// ==================== STAT ITEM ====================

function StatItem({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <Flex column gap={0.5} align="center">
      <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color }}>
        {value}
      </Text>
      <Text size="xs" style={{ fontFamily: 'var(--font-geist)', color: 'oklch(0.5 0.02 280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Text>
    </Flex>
  );
}

function StatDivider() {
  return <div className="w-px h-6" style={{ background: 'oklch(0.2 0.02 280)' }} />;
}

// ==================== ENGAGEMENT BUTTON ====================

function EngagementButton({ icon: Icon, count, color, hoverColor, label }: { icon: React.ElementType; count: number; color: string; hoverColor: string; label: string }) {
  return (
    <button className="flex items-center gap-1.5 transition-colors py-2 px-2 rounded-lg hover:bg-primary/10" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.8125rem', color }}>
      <Icon className="h-4.5 w-4.5" style={{ color: hoverColor }} />
      <span>{count >= 1000000 ? (count / 1000000).toFixed(1) + 'M' : count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}</span>
    </button>
  );
}

// ==================== SOCIAL MAX FLOATING ELEMENTS ====================

function SocialMaxFloatingElements({ accent, secondaryAccent, tertiaryAccent, accentGold, reducedMotion }: { accent: string; secondaryAccent: string; tertiaryAccent: string; accentGold: string; reducedMotion: boolean }) {
  const elements = [
    { x: 8, y: 12, size: 24, color: accent, delay: 0, icon: "✨" },
    { x: 92, y: 10, size: 28, color: secondaryAccent, delay: 0.3, icon: "★" },
    { x: 5, y: 85, size: 24, color: accent, delay: 0.6, icon: "✨" },
    { x: 95, y: 90, size: 28, color: secondaryAccent, delay: 0.9, icon: "★" },
    { x: 48, y: 5, size: 24, color: tertiaryAccent, delay: 0.1, icon: "✦" },
    { x: 95, y: 48, size: 24, color: accentGold, delay: 0.4, icon: "◆" },
    { x: 12, y: 50, size: 24, color: secondaryAccent, delay: 0.7, icon: "✨" },
    { x: 88, y: 25, size: 24, color: tertiaryAccent, delay: 1, icon: "✦" },
    { x: 25, y: 15, size: 24, color: accent, delay: 1.2, icon: "★" },
    { x: 75, y: 82, size: 24, color: secondaryAccent, delay: 1.5, icon: "✦" },
    { x: 60, y: 8, size: 24, color: accentGold, delay: 1.8, icon: "◆" },
    { x: 90, y: 65, size: 24, color: accent, delay: 2.1, icon: "✨" },
    { x: 35, y: 90, size: 24, color: tertiaryAccent, delay: 2.4, icon: "✦" },
    { x: 15, y: 30, size: 24, color: secondaryAccent, delay: 2.7, icon: "★" },
    { x: 85, y: 70, size: 24, color: accentGold, delay: 3, icon: "◆" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25" aria-hidden="true">
      {elements.map((el, i) => (
        <SocialMaxFloatElement key={i} {...el} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function SocialMaxFloatElement({ x, y, size, color, delay, icon, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; icon: string; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.5,
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
        y: [-18, 18, -18],
        x: [-12, 12, -12],
        opacity: [0.3, 0.7, 0.3],
        rotate: [-10, 10, -10],
        scale: [1, 1.15, 1],
      }}
      transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {icon}
    </motion.div>
  );
}

SocialMaxTemplate.displayName = 'SocialMaxTemplate';
