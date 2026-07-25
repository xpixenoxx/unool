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
import { Server, Database, Zap, Github, GitCommit, Terminal, ChevronRight, Zap as ZapIcon2, BarChart3, Activity } from 'lucide-react';

export function TechnicalBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#22c55e';
  const secondaryAccent = '#06b6d4';
  const accentPurple = '#a855f7';
  const terminalBg = 'oklch(0.06 0.02 240)';
  const terminalCardBg = 'oklch(0.09 0.02 240)';
  const terminalHeaderBg = 'oklch(0.11 0.02 240)';
  const terminalBorder = 'oklch(0.18 0.02 240)';

  // Live commit data
  const commits = [
    { hash: 'a1b2c3d', msg: `feat: update ${profile.name.toLowerCase().replace(/\s+/g, '-')}.profile.ts`, time: '2m ago', type: 'feat' },
    { hash: 'e4f5g6h', msg: 'chore: add new links configuration', time: '15m ago', type: 'chore' },
    { hash: 'i7j8k9l', msg: 'fix: resolve type definitions for proofs', time: '1h ago', type: 'fix' },
    { hash: 'm0n1o2p', msg: 'docs: update readme with new template', time: '3h ago', type: 'docs' },
    { hash: 'q3r4s5t', msg: 'refactor: optimize magnetic hover animations', time: '1d ago', type: 'refactor' },
    { hash: 'u6v7w8x', msg: 'perf: lazy-load heavy 3D components', time: '2d ago', type: 'perf' },
    { hash: 'y9z0a1b', msg: 'test: add vitest coverage for profile hooks', time: '1w ago', type: 'test' },
    { hash: 'c2d3e4f', msg: 'ci: add production deployment workflow', time: '1w ago', type: 'ci' },
  ];

  const getCommitColor = (type: string) => {
    switch (type) {
      case 'feat': return accent;
      case 'fix': return '#ef4444';
      case 'chore': return '#64748b';
      case 'docs': return '#3b82f6';
      case 'refactor': return accentPurple;
      case 'perf': return '#fbbf24';
      case 'test': return '#ec4899';
      case 'ci': return '#06b6d4';
      default: return accent;
    }
  };

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '10px',
        fontFamily: 'var(--font-geist-mono)',
      } as React.CSSProperties}
    >
      {/* Technical Bold Background - Bold Terminal */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, ${terminalBg} 0%, oklch(0.04 0.02 240) 60%, ${terminalBg} 100%)`
        }} />
        {/* Triple glow orbs */}
        <div
          className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full blur-[300px] opacity-30"
          style={{ background: `radial-gradient(ellipse at center, ${accent}50 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/2 right-1/5 w-[450px] h-[450px] rounded-full blur-[300px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${accentPurple}40 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[300px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}30 0%, transparent 70%)` }}
        />
        {/* Terminal scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.05) 2px, rgba(34,197,94,0.05) 4px)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-2"
          style={{
            backgroundImage: `linear-gradient(${accent}12 1px, transparent 1px), linear-gradient(90deg, ${accent}12 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Orbital Background - 8 Orbs for Bold */}
      <OrbitalBackground
        orbCount={8}
        orbSizes={[280, 200, 320, 140, 240, 180, 260, 120]}
        colors={[
          `oklch(0.6 0.18 145 / 0.2)`,
          `oklch(0.55 0.2 200 / 0.18)`,
          `oklch(0.65 0.15 140 / 0.15)`,
          `oklch(0.5 0.22 150 / 0.15)`,
          `oklch(0.58 0.16 145 / 0.12)`,
          `oklch(0.6 0.18 200 / 0.12)`,
          `oklch(0.55 0.16 145 / 0.1)`,
          `oklch(0.5 0.2 200 / 0.1)`,
        ]}
        speed={0.18}
        className="pointer-events-none"
      />

      {/* Triple Morphing Blobs - Bold Glows */}
      <MorphingBlob size={380} color={accent} opacity={0.2} speed={0.1} complexity={5} className="absolute top-1/4 left-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={300} color={accentPurple} opacity={0.15} speed={0.09} complexity={4} className="absolute top-1/2 right-1/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={260} color={secondaryAccent} opacity={0.12} speed={0.08} complexity={3} className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Parallax Layers - Floating Technical Elements */}
      <ParallaxLayers strength={20} className="pointer-events-none">
        <ParallaxBoldElement x={10} y={15} size={28} color={accent} delay={0} char="▸" reducedMotion={reducedMotion} />
        <ParallaxBoldElement x={90} y={12} size={32} color={accentPurple} delay={0.3} char="◆" reducedMotion={reducedMotion} />
        <ParallaxBoldElement x={5} y={82} size={28} color={accent} delay={0.6} char="▸" reducedMotion={reducedMotion} />
        <ParallaxBoldElement x={95} y={88} size={32} color={accentPurple} delay={0.9} char="◆" reducedMotion={reducedMotion} />
        <ParallaxBoldElement x={50} y={5} size={28} color={secondaryAccent} delay={0.1} char="▸" reducedMotion={reducedMotion} />
        <ParallaxBoldElement x={95} y={50} size={28} color={accent} delay={0.4} char="◆" reducedMotion={reducedMotion} />
        <ParallaxBoldElement x={15} y={50} size={28} color={accentPurple} delay={0.7} char="▸" reducedMotion={reducedMotion} />
        <ParallaxBoldElement x={85} y={25} size={28} color={secondaryAccent} delay={1} char="◆" reducedMotion={reducedMotion} />
      </ParallaxLayers>

      <Stack space={8} className="relative max-w-[900px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {/* TERMINAL HEADER - git log --oneline */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <div className="w-full max-w-[900px] mx-auto mb-8">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: terminalHeaderBg, borderColor: terminalBorder }}>
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.3 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.35 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#28ca42' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.4 }} />
            </div>
            <div className="p-4" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
              <Stack space={1.5}>
                <Flex gap={2} align="center">
                  <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>$</Text>
                  <Text size="sm" style={{ color: '#a855f7', fontFamily: 'var(--font-geist-mono)' }}>git</Text>
                  <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>log</Text>
                  <Text size="sm" style={{ color: '#3b82f6', fontFamily: 'var(--font-geist-mono)' }}>--oneline</Text>
                  <Text size="sm" style={{ color: secondaryAccent, fontFamily: 'var(--font-geist-mono)' }}>-8</Text>
                </Flex>
                <div style={{ height: '1px', background: terminalBorder, margin: '0.5rem 0' }} />
                <Stack space={1} style={{ marginLeft: '1.5rem' }}>
                  {commits.slice(0, 5).map((commit, i) => (
                    <motion.div
                      key={commit.hash}
                      initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.gentle, delay: 0.3 + i * 0.08 }}
                      className="flex items-center gap-2"
                    >
                      <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>{commit.hash}</Text>
                      <Text size="sm" style={{ color: getCommitColor(commit.type), fontFamily: 'var(--font-geist-mono)' }}>
                        {commit.type}:
                      </Text>
                      <Text size="sm" style={{ color: 'oklch(0.7 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>{commit.msg}</Text>
                      <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>{commit.time}</Text>
                    </motion.div>
                  ))}
                </Stack>
              </Stack>
            </div>
          </div>
        </motion.div>

        {/* PROFILE */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.4 }}
        >
          <Stack space={3} align="center" className="text-center">
            <div className="relative">
              <Avatar className="h-28 w-28 border-2" style={{ borderColor: accent }}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 600, fontSize: '2rem' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Triple pulse rings */}
              <motion.div
                className="absolute -inset-1.5 rounded-full border-2"
                style={{ borderColor: `${accent}40` }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -inset-3 rounded-full border-2"
                style={{ borderColor: `${accentPurple}30` }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.05, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
              <motion.div
                className="absolute -inset-4.5 rounded-full border-2"
                style={{ borderColor: `${secondaryAccent}20` }}
                animate={{ scale: [1, 1.14, 1], opacity: [0.3, 0.02, 0.3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            </div>

            <Stack space={1} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.5 }}
                style={{ fontFamily: 'var(--font-geist-mono)', letterSpacing: '-0.02em' }}
              >
                {profile.name}
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.6 }}
                  style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.6 0.02 240)' }}
                >
                  {profile.headline}
                </motion.p>
              )}
            </Stack>
          </Stack>
        </motion.div>

        {/* BIO - Syntax Highlighted */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
          >
            <div className="relative" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: terminalHeaderBg, borderBottom: `1px solid ${terminalBorder}` }}>
                <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>profile.ts</Text>
                <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>export const profile = {'{'}</Text>
                <motion.div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: accent }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              </div>
              <div className="p-4 font-mono text-sm" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.875rem', lineHeight: 1.8 }}>
                <pre style={{ color: 'oklch(0.9 0.02 240)', whiteSpace: 'pre-wrap' }}>
                  <code>{`  name: "${profile.name}",
  headline: "${profile.headline || ''}",
  bio: \`${profile.bio}\`,
  links: ${profile.links.filter(l => l.isVisible).length},
  proofs: ${profile.proofs.length},
  subdomain: "${profile.subdomain}",
}`}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* LIVE COMMIT TICKER - AnimatePresence */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.8 }}
        >
          <div style={{ height: '1px', background: terminalBorder, marginBottom: '1rem' }} />
          <div className="relative" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderRadius: '10px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ background: terminalHeaderBg, borderBottom: `1px solid ${terminalBorder}` }}>
              <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>activity.log</Text>
              <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>live feed</Text>
              <motion.div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: accent }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
            </div>
            <div className="p-4 max-h-80 overflow-y-auto" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              <Stack space={2}>
                <AnimatePresence mode="wait">
                  {commits.map((commit, index) => (
                    <motion.div
                      key={commit.hash}
                      initial={reducedMotion ? {} : { opacity: 0, x: -30, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 30, height: 0 }}
                      transition={{ ...spring.gentle, delay: index * 0.05 }}
                      className="flex items-center gap-3 py-1.5"
                      style={{ borderLeft: `2px solid ${getCommitColor(commit.type)}`, paddingLeft: '0.75rem' }}
                    >
                      <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums' }}>{commit.hash}</Text>
                      <Text size="xs" style={{ color: getCommitColor(commit.type), fontFamily: 'var(--font-geist-mono)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {commit.type}
                      </Text>
                      <Text size="sm" style={{ color: 'oklch(0.7 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>{commit.msg}</Text>
                      <Text size="xs" className="ml-auto" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>{commit.time}</Text>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>
            </div>
          </div>
        </motion.div>

        {/* LINKS - Alternating TiltCard/MagneticCard (every 2nd = TiltCard) */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
          >
            <div style={{ height: '1px', background: terminalBorder, marginBottom: '1rem' }} />
            <Stack space={2}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 18)
                .map((link, index) => {
                  const isTilt = index % 2 === 0; // Every 2nd is TiltCard
                  const Card = isTilt ? TiltCard : MagneticCard;
                  const cardProps = isTilt ? { maxTilt: 7, scale: 1.015, glare: true, glareOpacity: 0.12 } : { radius: 60, strength: 0.15 };

                  return (
                    <Card
                      key={link.id}
                      {...cardProps}
                      className={cn('w-full', isPreview && 'opacity-80')}
                      style={{
                        borderRadius: '10px',
                        border: `1px solid ${terminalBorder}`,
                        background: terminalCardBg,
                      }}
                    >
                      <button
                        onClick={() => onLinkClick?.(link)}
                        className="w-full flex items-center gap-3 px-4 py-4 text-left relative overflow-hidden"
                        style={{ fontFamily: 'var(--font-geist-mono)' }}
                      >
                        {/* Animated top accent bar */}
                        <motion.div
                          className="absolute top-0 left-0 h-0.5 w-full"
                          style={{ background: `linear-gradient(90deg, ${accent}, ${secondaryAccent}, ${accentPurple})` }}
                          initial={reducedMotion ? { width: '100%' } : { width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ ...spring.snappy, delay: 1 + index * 0.04 }}
                        />
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: index * 0.03 }}
                          style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}
                        >
                          ▸
                        </motion.span>
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: 0.9 + index * 0.03 }}
                          style={{ color: accent, fontWeight: 600, fontFamily: 'var(--font-geist-mono)' }}
                        >
                          {link.label}
                        </motion.span>
                        <Text size="sm" className="flex-1 truncate" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>
                          {link.url}
                        </Text>
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ ...spring.bouncy, delay: 1 + index * 0.03 }}
                          style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {link.clicks.toLocaleString()}
                        </motion.span>
                        <Badge
                          variant="outline"
                          size="sm"
                          className="px-2 py-0.5"
                          style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.625rem', borderColor: isTilt ? accentPurple : accent, color: isTilt ? accentPurple : accent }}
                        >
                          {isTilt ? 'TILT' : 'MAG'}
                        </Badge>
                      </button>
                    </Card>
                  );
                })}
            </Stack>
          </motion.div>
        )}

        {/* PROOFS - PerspectiveFlip for Bold */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1 }}
          >
            <div style={{ height: '1px', background: terminalBorder, marginBottom: '1rem' }} />
            <Stack space={2}>
              {profile.proofs
                .slice(0, 6)
                .map((proof, index) => (
                  <PerspectiveFlip
                    key={proof.id}
                    axis="y"
                    duration={0.5}
                    style={{ width: '100%' }}
                  >
                    <div style={{ position: 'relative' }}>
                      <MagneticCard
                        radius={60}
                        strength={0.1}
                        className="w-full"
                        style={{
                          background: terminalCardBg,
                          border: `1px solid ${terminalBorder}`,
                          borderRadius: '10px',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                        }}
                      >
                        {proof.icon && (
                          <motion.span
                            initial={reducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ ...spring.bouncy, delay: 1.1 + index * 0.08 }}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '10px',
                              background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                              color: terminalBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                            }}
                          >
                            {proof.icon}
                          </motion.span>
                        )}
                        <Flex column gap={0.25} flex={1}>
                          <motion.span
                            initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...spring.gentle, delay: 1.1 + index * 0.08 }}
                            style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.9 0.02 240)', fontWeight: 600, fontSize: '0.9375rem' }}
                          >
                            {proof.title}
                          </motion.span>
                          {proof.value && (
                            <motion.span
                              initial={reducedMotion ? {} : { opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...spring.gentle, delay: 1.2 + index * 0.08 }}
                              style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 240)', fontSize: '0.875rem' }}
                            >
                              {proof.value}
                            </motion.span>
                          )}
                        </Flex>
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ ...spring.bouncy, delay: 1.2 + index * 0.08 }}
                          style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          ✓ verified
                        </motion.span>
                      </MagneticCard>
                    </div>
                  </PerspectiveFlip>
                ))}
            </Stack>
          </motion.div>
        )}

        {/* SUBDOMAIN */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
          className="text-center pt-6"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{ background: terminalCardBg, border: `1px solid ${accent}40` }}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
          </div>
        </motion.div>
      </Stack>
    </div>
  );
}

// ==================== PARALLAX BOLD ELEMENTS ====================

function ParallaxBoldElement({ x, y, size, color, delay, char, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; char: string; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.5,
    fontFamily: 'var(--font-geist-mono)',
    fontSize: size,
    color,
  };

  if (reducedMotion) {
    return <div className="absolute" style={style}>{char}</div>;
  }

  return (
    <motion.div
      style={style}
      animate={{
        y: [-15, 15, -15],
        x: [-10, 10, -10],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {char}
    </motion.div>
  );
}

TechnicalBoldTemplate.displayName = 'TechnicalBoldTemplate';