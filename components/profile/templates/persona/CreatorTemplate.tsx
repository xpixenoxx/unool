'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text, Heading, Overline } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MagneticCard, OrbitalBackground, MorphingBlob, ParallaxLayers, TiltCard } from '@/components/ui/3d';
import { spring, slideUp, staggerContainer, staggerItem } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Play, Image, MessageSquare, Heart, Share2, ExternalLink } from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  url: string;
  caption?: string;
  likes?: number;
  comments?: number;
}

export function CreatorTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const secondaryAccent = 'oklch(0.65 0.22 340)'; // Creative magenta-pink
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 15);
  const visibleProofs = profile.proofs.slice(0, 10);

  // Extract media from proofs (type badge with thumbnail)
  const mediaItems: MediaItem[] = profile.proofs
    .filter((p) => p.type === 'badge' && p.icon)
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      type: 'image' as const,
      thumbnail: p.icon || `https://via.placeholder.com/400x400?text=${encodeURIComponent(p.title || 'Media')}`,
      url: p.value || '#',
      caption: p.title,
      likes: parseInt(p.value?.replace(/[^\d]/g, '') || '0'),
      comments: Math.floor(Math.random() * 50),
    }));

  // Follower count from proofs
  const followerProof = profile.proofs.find((p) => p.type === 'metric' && p.title.toLowerCase().includes('follow'));
  const followerCount = followerProof?.value || '12.5K';

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '16px',
        fontFamily: 'var(--font-syne)',
      } as React.CSSProperties}
    >
      {/* Creative Gradient Background */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
        <div
          className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[250px] opacity-40"
          style={{ background: `radial-gradient(ellipse at center, ${accent}35 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[250px] opacity-35"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}30 0%, transparent 60%)` }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[200px] opacity-25"
          style={{ background: `radial-gradient(circle at center, oklch(0.7 0.25 80)20 0%, transparent 60%)` }}
        />
        {/* Top creative accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80), transparent)` }}
        />
      </div>

      {/* Orbital Background - Creative Energy */}
      <OrbitalBackground
        orbCount={6}
        orbSizes={[180, 120, 220, 90, 160, 70]}
        colors={[
          `oklch(0.7 0.25 340 / 0.12)`,
          `oklch(0.65 0.22 15 / 0.1)`,
          `oklch(0.75 0.2 280 / 0.09)`,
          `oklch(0.8 0.18 80 / 0.08)`,
          `oklch(0.6 0.28 350 / 0.1)`,
          `oklch(0.72 0.15 30 / 0.08)`,
        ]}
        speed={0.2}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blob System - Creative Expression */}
      <MorphingBlob size={420} color={accent} opacity={0.22} speed={0.12} complexity={5} className="absolute top-1/5 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={300} color={secondaryAccent} opacity={0.18} speed={0.1} complexity={4} className="absolute bottom-1/5 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <Stack space={10} className="relative max-w-[520px] mx-auto px-4 py-12 sm:py-16" style={{ fontFamily: 'var(--font-syne)' }}>
        {/* Hero: Avatar + Name - Creative */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.2 }}
          className="text-center"
        >
          <div className="relative inline-block mb-6">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 relative z-10" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-4xl sm:text-5xl font-black" style={{ fontFamily: 'var(--font-syne)' }}>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Creative status ring - animated gradient */}
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...spring.bouncy, delay: 0.4 }}
              className="absolute -bottom-3 -right-3 h-10 w-10 rounded-full border-3 flex items-center justify-center"
              style={{
                background: `conic-gradient(from 0deg, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80), ${accent})`,
                borderColor: 'var(--background)',
                boxShadow: `0 8px 32px -8px ${accent}`,
              }}
              aria-label="Creative Active"
            >
              <motion.div
                className="h-3.5 w-3.5 rounded-full"
                style={{ background: 'var(--primary-foreground)' }}
                animate={{ scale: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Creative orbit ring */}
            <motion.div
              className="absolute -top-5 -left-5 -right-5 -bottom-5 rounded-full pointer-events-none"
              style={{ border: `2px solid ${accent}30` }}
              animate={{ rotate: reducedMotion ? 0 : 360, scale: [1, 1.05, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: 1 }}
            />
          </div>

          <Stack space={2} align="center" className="w-full">
            <motion.h1
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.3 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em' }}
            >
              <span
                style={{
                  background: `linear-gradient(135deg, var(--foreground) 0%, ${accent} 40%, ${secondaryAccent} 70%, oklch(0.7 0.25 80) 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  backgroundSize: '300% 300%',
                }}
              >
                {profile.name}
              </span>
            </motion.h1>

            {profile.headline && (
              <motion.p
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.4 }}
                className="text-lg text-muted-foreground font-medium max-w-xs"
                style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                {profile.headline}
              </motion.p>
            )}

            {/* Follower count badge */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.5 }}
            >
              <Badge
                variant="outline"
                className="gap-2 py-2 px-4"
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: '0.9rem',
                  borderColor: `${accent}40`,
                  background: `linear-gradient(135deg, ${accent}05, ${secondaryAccent}03)`,
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>✦</span>
                {followerCount} Followers
              </Badge>
            </motion.div>
          </Stack>
        </motion.div>

        {/* Bio - Creative Card with Parallax */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.4 }}
          >
            <ParallaxLayers strength={15} className="w-full">
              <div className="relative w-full">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${accent}10 0%, ${secondaryAccent}08 50%, oklch(0.7 0.25 80)06 100%)` }}
                />
                <div
                  className="relative rounded-2xl border p-[1.5px] overflow-hidden"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--card)',
                    boxShadow: `0 0 0 1px ${accent}15, 0 4px 24px -4px ${accent}15`,
                  }}
                >
                  <div className="relative p-6 rounded-xl" style={{ background: 'var(--card)' }}>
                    <Text size="base" color="foreground" style={{ lineHeight: 1.9, fontFamily: 'var(--font-syne)', fontSize: '1.0625rem', fontWeight: 400 }}>
                      {profile.bio}
                    </Text>
                  </div>
                </div>
              </div>
            </ParallaxLayers>
          </motion.div>
        )}

        {/* Links - Creative Feed Cards */}
        {visibleLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.5 }}
          >
            <Stack space={4}>
              <AnimatePresence>
                {visibleLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={reducedMotion ? {} : { opacity: 0, y: 30, scale: 0.95, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ ...spring.magnetic, delay: 0.5 + index * 0.06 }}
                  >
                    {/* Alternate TiltCard and MagneticCard for visual variety */}
                    {index % 2 === 0 ? (
                      <CreativeFeedCard
                        link={link}
                        accent={accent}
                        secondaryAccent={secondaryAccent}
                        index={index}
                        isPreview={isPreview}
                        variant="tilt"
                        reducedMotion={reducedMotion}
                        onLinkClick={onLinkClick}
                      />
                    ) : (
                      <CreativeFeedCard
                        link={link}
                        accent={accent}
                        secondaryAccent={secondaryAccent}
                        index={index}
                        isPreview={isPreview}
                        variant="magnetic"
                        reducedMotion={reducedMotion}
                        onLinkClick={onLinkClick}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </Stack>
          </motion.div>
        )}

        {/* Media Grid - Instagram/TikTok style */}
        {mediaItems.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
          >
            <Stack space={3} className="w-full">
              <Flex between align="center">
                <Overline color="muted" style={{ fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Latest Content
                </Overline>
              </Flex>
              <Grid cols={{ base: 2, sm: 3 }} gap={3}>
                <AnimatePresence>
                  {mediaItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ ...spring.standard, delay: 0.6 + index * 0.05 }}
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group block aspect-square rounded-xl overflow-hidden"
                        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                        onMouseEnter={() => isPreview && onLinkClick?.({ id: item.id, label: item.caption || 'Media', url: item.url, icon: null, clicks: 0, order: 0, isVisible: true })}
                      >
                        {/* Thumbnail placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}20, ${secondaryAccent}15)` }}>
                          <img src={item.thumbnail} alt={item.caption} className="w-full h-full object-cover" loading="lazy" />
                        </div>

                        {/* Overlay on hover */}
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center gap-3 opacity-0"
                          style={{ background: 'linear-gradient(180deg, transparent 40%, oklch(0 0 0 / 0.8))' }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--background/90)', color: 'var(--foreground)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)' }}
                            aria-label="Play"
                          >
                            <Play className="h-6 w-6 ml-1" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--background/90)', color: 'var(--foreground)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)' }}
                            aria-label="View"
                          >
                            <ExternalLink className="h-6 w-6" />
                          </motion.button>
                        </motion.div>

                        {/* Stats on bottom */}
                        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between gap-2" style={{ background: 'linear-gradient(180deg, transparent, oklch(0 0 0 / 0.7))' }}>
                          <Flex gap={1.5} align="center">
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                              <Heart className="h-3.5 w-3.5 text-red-400" />
                              {item.likes?.toLocaleString() || '1.2K'}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                              <MessageSquare className="h-3.5 w-3.5" />
                              {item.comments?.toLocaleString() || '89'}
                            </span>
                          </Flex>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Grid>
            </Stack>
          </motion.div>
        )}

        {/* Proof Points - Creative Badges */}
        {visibleProofs.filter((p) => p.type !== 'badge' && p.type !== 'testimonial').length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
            className="w-full"
          >
            <Stack space={3}>
              <Overline color="muted" style={{ fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Creative Cred
              </Overline>
              <Flex gap={3} className="flex-wrap" wrap>
                {visibleProofs
                  .filter((p) => p.type !== 'badge' && p.type !== 'testimonial')
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
                        className={cn('gap-2 py-2.5 px-3.5', isPreview && 'opacity-80')}
                        style={{ fontFamily: 'var(--font-syne)', fontSize: '0.875rem', borderColor: `${accent}40`, background: `linear-gradient(135deg, ${accent}05, ${secondaryAccent}03)` }}
                      >
                        {proof.icon && <span style={{ fontSize: '1.2rem' }}>{proof.icon}</span>}
                        {proof.title}
                        {proof.value && (
                          <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-mono)' }}>
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

        {/* Subdomain - Creative Sidebar */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1 }}
          className="text-center pt-4 lg:hidden"
        >
          <Flex center gap={2} className="mx-auto">
            <Box
              className="px-4 py-2 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}10, oklch(0.7 0.25 80)08)`,
                border: `1px solid ${accent}30`,
                fontFamily: 'var(--font-mono)',
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

      {/* Desktop Only: Creative Subdomain Sidebar */}
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
              fontFamily: 'var(--font-mono)',
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

function CreativeFeedCard({
  link,
  accent,
  secondaryAccent,
  index,
  isPreview = false,
  variant,
  reducedMotion,
  onLinkClick,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  secondaryAccent: string;
  index: number;
  isPreview?: boolean;
  variant: 'magnetic' | 'tilt';
  reducedMotion: boolean;
  onLinkClick?: (link: any) => void;
}) {
  const isVideo = link.label.toLowerCase().includes('youtube') || link.label.toLowerCase().includes('tiktok') || link.label.toLowerCase().includes('reels');

  return (
    <>
      {variant === 'tilt' ? (
        <TiltCard
          maxTilt={8}
          scale={1.02}
          className={cn('h-auto w-full', isPreview && 'opacity-80')}
          style={{
            borderRadius: '16px',
            border: `1px solid ${accent}25`,
            background: `linear-gradient(145deg, var(--card) 0%, ${accent}08 100%)`,
            boxShadow: `0 0 0 1px ${accent}10, 0 8px 32px -8px ${accent}20`,
          }}
        >
          <CreativeLinkButton link={link} accent={accent} secondaryAccent={secondaryAccent} index={index} isPreview={isPreview} variant="tilt" reducedMotion={reducedMotion} isVideo={isVideo} onLinkClick={onLinkClick} />
        </TiltCard>
      ) : (
        <MagneticCard
          radius={120}
          strength={0.18}
          className={cn('h-auto w-full', isPreview && 'opacity-80')}
          style={{
            borderRadius: '16px',
            border: `1px solid ${accent}20`,
            background: `linear-gradient(135deg, var(--card) 0%, ${secondaryAccent}06 100%)`,
            boxShadow: `0 4px 20px -4px ${accent}10`,
          }}
        >
          <CreativeLinkButton link={link} accent={accent} secondaryAccent={secondaryAccent} index={index} isPreview={isPreview} variant="magnetic" reducedMotion={reducedMotion} isVideo={isVideo} onLinkClick={onLinkClick} />
        </MagneticCard>
      )}
    </>
  );
}

function CreativeLinkButton({
  link,
  accent,
  secondaryAccent,
  index,
  isPreview = false,
  variant,
  reducedMotion,
  isVideo = false,
  onLinkClick,
}: {
  link: TemplateProps['profile']['links'][0];
  accent: string;
  secondaryAccent: string;
  index: number;
  isPreview?: boolean;
  variant: 'magnetic' | 'tilt';
  reducedMotion: boolean;
  isVideo?: boolean;
  onLinkClick?: (link: any) => void;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative w-full px-5 py-4 text-left group overflow-hidden no-underline"
      style={{ borderRadius: '14px', fontFamily: 'var(--font-syne)', display: 'flex' }}
      onMouseEnter={() => isPreview && onLinkClick?.(link)}
    >
      {/* Animated left accent bar - creative gradient */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: `linear-gradient(180deg, ${accent}, ${secondaryAccent}, oklch(0.7 0.25 80))`, borderRadius: '14px 0 0 14px', transformOrigin: 'bottom' }}
        initial={reducedMotion ? {} : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 + index * 0.06 }}
      />

      {/* Creative hover shimmer - multi-color */}
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
            borderRadius: '14px',
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
            borderRadius: '14px',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Video play indicator */}
      {isVideo && (
        <motion.div
          className="absolute top-3 right-3 z-10"
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: 0.5 + index * 0.05 }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Play className="h-4 w-4 text-white ml-1" />
          </div>
        </motion.div>
      )}

      <Flex align="center" gap={3.5} className="relative z-10">
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: index * 0.05 }}
          className="flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-400"
          style={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.25rem',
            boxShadow: `0 8px 24px -6px ${accent}`,
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
          <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
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
              fontFamily: 'var(--font-mono)',
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
    </a>
  );
}

CreatorTemplate.displayName = 'CreatorTemplate';