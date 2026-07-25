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
import { Terminal, ChevronRight, Zap, Github, Linkedin, Twitter, Code, Server, Database, Zap as ZapIcon, BarChart3, Zap as ZapIcon2 } from 'lucide-react';

const terminalBg = 'oklch(0.08 0.02 240)';
const terminalCardBg = 'oklch(0.1 0.02 240)';
const terminalHeaderBg = 'oklch(0.12 0.02 240)';
const terminalBorder = 'oklch(0.2 0.02 240)';

export function TechnicalStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#22c55e'; // Terminal green
  const secondaryAccent = '#06b6d4'; // Cyan

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        fontFamily: 'var(--font-geist-mono)',
      } as React.CSSProperties}
    >
      {/* Technical Standard Background - Executive Terminal */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, ${terminalBg} 0%, oklch(0.05 0.02 240) 80%, ${terminalBg} 100%)`
        }} />
        {/* Dual glow orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full blur-[250px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[250px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}30 0%, transparent 70%)` }}
        />
        {/* Center terminal glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[300px] opacity-10"
          style={{ background: `radial-gradient(ellipse at center, ${accent}50 0%, transparent 70%)` }}
        />
        {/* Subtle terminal grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-3"
          style={{
            backgroundImage: `linear-gradient(${accent}15 1px, transparent 1px), linear-gradient(90deg, ${accent}15 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Orbital Background - Technical Orbs (5 orbs) */}
      <OrbitalBackground
        orbCount={5}
        orbSizes={[220, 160, 260, 110, 180]}
        colors={[
          `oklch(0.58 0.18 145 / 0.18)`,
          `oklch(0.52 0.2 200 / 0.15)`,
          `oklch(0.62 0.15 140 / 0.12)`,
          `oklch(0.48 0.22 150 / 0.12)`,
          `oklch(0.56 0.16 145 / 0.1)`,
        ]}
        speed={0.12}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blobs - Technical Glows */}
      <MorphingBlob size={320} color={accent} opacity={0.18} speed={0.08} complexity={4} className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={260} color={secondaryAccent} opacity={0.14} speed={0.07} complexity={3} className="absolute bottom-1/4 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Parallax Layers - Floating Terminal Elements */}
      <ParallaxLayers strength={15} className="pointer-events-none">
        <ParallaxTerminalElement x={12} y={18} size={26} color={accent} delay={0} char="▸" reducedMotion={reducedMotion} />
        <ParallaxTerminalElement x={88} y={15} size={30} color={secondaryAccent} delay={0.3} char="◆" reducedMotion={reducedMotion} />
        <ParallaxTerminalElement x={6} y={80} size={26} color={accent} delay={0.6} char="▸" reducedMotion={reducedMotion} />
        <ParallaxTerminalElement x={94} y={85} size={30} color={secondaryAccent} delay={0.9} char="◆" reducedMotion={reducedMotion} />
        <ParallaxTerminalElement x={48} y={8} size={26} color={accent} delay={0.1} char="▸" reducedMotion={reducedMotion} />
        <ParallaxTerminalElement x={95} y={48} size={26} color={secondaryAccent} delay={0.4} char="◆" reducedMotion={reducedMotion} />
        <ParallaxTerminalElement x={18} y={50} size={26} color={accent} delay={0.7} char="▸" reducedMotion={reducedMotion} />
        <ParallaxTerminalElement x={82} y={30} size={26} color={secondaryAccent} delay={1} char="◆" reducedMotion={reducedMotion} />
      </ParallaxLayers>

      <Stack space={8} className="relative max-w-[800px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {/* TERMINAL HEADER - npm run dev */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <div className="w-full max-w-[800px] mx-auto mb-8">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: terminalHeaderBg, borderColor: terminalBorder }}>
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.3 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.35 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#28ca42' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.4 }} />
            </div>
            <div className="p-4" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
              <Stack space={1.5}>
                <Flex gap={2} align="center">
                  <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>$</Text>
                  <Text size="sm" style={{ color: '#a855f7', fontFamily: 'var(--font-geist-mono)' }}>npm</Text>
                  <Text size="sm" style={{ color: '#f97316', fontFamily: 'var(--font-geist-mono)' }}>run</Text>
                  <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>dev</Text>
                  <Text size="sm" style={{ color: '#3b82f6', fontFamily: 'var(--font-geist-mono)' }}>--profile={profile.name.toLowerCase().replace(/\s+/g, '-')}</Text>
                </Flex>
                <div style={{ height: '1px', background: terminalBorder, margin: '0.5rem 0' }} />
                <Stack space={1} style={{ marginLeft: '1.5rem' }}>
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.gentle, delay: 0.3 }}
                    className="flex items-center gap-2"
                  >
                    <Text size="sm" style={{ color: secondaryAccent, fontFamily: 'var(--font-geist-mono)' }}>▸</Text>
                    <Text size="sm" style={{ color: 'oklch(0.7 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>unool@profile:starting</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums' }}>[0.00s]</Text>
                  </motion.div>
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.gentle, delay: 0.4 }}
                    className="flex items-center gap-2"
                  >
                    <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>✔</Text>
                    <Text size="sm" style={{ color: 'oklch(0.7 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>Profile compiled</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>→</Text>
                    <Text size="sm" style={{ color: '#a855f7', fontFamily: 'var(--font-geist-mono)' }}>{profile.links.length} links</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>,</Text>
                    <Text size="sm" style={{ color: '#ec4899', fontFamily: 'var(--font-geist-mono)' }}>{profile.proofs.length} proofs</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>→</Text>
                    <Text size="sm" style={{ color: '#22c55e', fontFamily: 'var(--font-geist-mono)' }}>ready</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>[0.23s]</Text>
                  </motion.div>
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.gentle, delay: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <Text size="sm" style={{ color: secondaryAccent, fontFamily: 'var(--font-geist-mono)' }}>⚡</Text>
                    <Text size="sm" style={{ color: 'oklch(0.7 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>3D primitives initialized</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>→</Text>
                    <Text size="sm" style={{ color: '#fbbf24', fontFamily: 'var(--font-geist-mono)' }}>OrbitalBackground</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>,</Text>
                    <Text size="sm" style={{ color: '#a855f7', fontFamily: 'var(--font-geist-mono)' }}>MorphingBlob</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>,</Text>
                    <Text size="sm" style={{ color: '#22c55e', fontFamily: 'var(--font-geist-mono)' }}>TiltCard</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>[0.41s]</Text>
                  </motion.div>
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.gentle, delay: 0.6 }}
                    className="flex items-center gap-2"
                  >
                    <Text size="sm" style={{ color: '#22c55e', fontFamily: 'var(--font-geist-mono)' }}>✔</Text>
                    <Text size="sm" style={{ color: 'oklch(0.7 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>Live deployment ready</Text>
                    <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>[0.67s]</Text>
                  </motion.div>
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
              {/* Status pulse ring */}
              <motion.div
                className="absolute -inset-1.5 rounded-full border-2"
                style={{ borderColor: `${accent}40` }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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

        {/* BIO - Syntax Highlighted Code Block */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
          >
            <div className="relative" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
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

        {/* GITHUB STATS CARDS WITH TILT */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.8 }}
          >
            <div style={{ height: '1px', background: terminalBorder, marginBottom: '1rem' }} />
            <Stack space={3}>
              <Text size="sm" weight="medium" className="text-center" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 240)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                GitHub Stats
              </Text>
              <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={3}>
                {profile.proofs
                  .filter(p => p.value)
                  .slice(0, 6)
                  .map((proof, index) => (
                    <TiltCard key={proof.id} maxTilt={8} scale={1.02}>
                      <MagneticCard
                        radius={60}
                        strength={0.08}
                        className="w-full"
                        style={{
                          background: terminalCardBg,
                          border: `1px solid ${terminalBorder}`,
                          borderRadius: '8px',
                          padding: '1.5rem',
                          minHeight: '120px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}
                      >
                        {proof.icon && (
                          <motion.span
                            initial={reducedMotion ? {} : { opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ ...spring.bouncy, delay: 0.9 + index * 0.08 }}
                            style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block' }}
                          >
                            {proof.icon}
                          </motion.span>
                        )}
                        <motion.div
                          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring.standard, delay: 1 + index * 0.08 }}
                          style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}
                        >
                          {proof.value}
                        </motion.div>
                        <motion.p
                          initial={reducedMotion ? {} : { opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring.gentle, delay: 1.1 + index * 0.08 }}
                          style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 240)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}
                        >
                          {proof.title}
                        </motion.p>
                      </MagneticCard>
                    </TiltCard>
                  ))}
              </Grid>
            </Stack>
          </motion.div>
        )}

        {/* LINKS - Alternating MagneticCard/TiltCard (every 3rd = TiltCard) */}
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
                .slice(0, 15)
                .map((link, index) => {
                  const isTilt = (index + 1) % 3 === 0; // Every 3rd is TiltCard
                  const Card = isTilt ? TiltCard : MagneticCard;
                  const cardProps = isTilt ? { maxTilt: 6, scale: 1.01, glare: true, glareOpacity: 0.1 } : { radius: 60, strength: 0.12 };

                  return (
                    <Card
                      key={link.id}
                      {...cardProps}
                      className={cn('w-full', isPreview && 'opacity-80')}
                      style={{
                        borderRadius: '8px',
                        border: `1px solid ${terminalBorder}`,
                        background: terminalCardBg,
                      }}
                    >
                      <motion.a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onLinkClick?.(link)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left relative overflow-hidden"
                        style={{ fontFamily: 'var(--font-geist-mono)' }}
                      >
                        {/* Animated top accent bar */}
                        <motion.div
                          className="absolute top-0 left-0 h-0.5 w-full"
                          style={{ background: `linear-gradient(90deg, ${accent}, ${secondaryAccent})` }}
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
                          style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.625rem', borderColor: accent, color: accent }}
                        >
                          {isTilt ? 'TILT' : 'MAG'}
                        </Badge>
                      </motion.a>
                    </Card>
                  );
                })}
            </Stack>
          </motion.div>
        )}

        {/* PROOFS - Terminal Output Stats Grid */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1 }}
          >
            <div style={{ height: '1px', background: terminalBorder, marginBottom: '1rem' }} />
            <div className="relative" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: terminalHeaderBg, borderBottom: `1px solid ${terminalBorder}` }}>
                <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>stats.json</Text>
                <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>verified metrics</Text>
              </div>
              <Grid cols={2} gap={0} className="p-2" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                {profile.proofs
                  .slice(0, 6)
                  .map((proof, index) => (
                    <div
                      key={proof.id}
                      className="flex items-center gap-2 p-2"
                      style={{
                        background: index % 2 === 0 ? terminalCardBg : terminalBg,
                        borderLeft: `2px solid ${accent}`,
                      }}
                    >
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 1.1 + index * 0.05 }}
                        style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}
                      >
                        ▸
                      </motion.span>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...spring.gentle, delay: 1.1 + index * 0.05 }}
                        style={{ color: 'oklch(0.9 0.02 240)', fontWeight: 500, fontFamily: 'var(--font-geist-mono)' }}
                      >
                        {proof.title}
                      </motion.span>
                      {proof.value && (
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: 1.2 + index * 0.05 }}
                          className="ml-auto"
                          style={{ color: 'oklch(0.6 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}
                        >
                          {proof.value}
                        </motion.span>
                      )}
                    </div>
                  ))}
              </Grid>
            </div>
          </motion.div>
        )}

        {/* SUBDOMAIN */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.2 }}
          className="text-center pt-6"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: terminalCardBg, border: `1px solid ${accent}40` }}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
          </div>
        </motion.div>
      </Stack>
    </div>
  );
}

// ==================== PARALLAX TERMINAL ELEMENTS ====================

function ParallaxTerminalElement({ x, y, size, color, delay, char, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; char: string; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.4,
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
        y: [-12, 12, -12],
        x: [-8, 8, -8],
        opacity: [0.2, 0.6, 0.2],
      }}
      transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {char}
    </motion.div>
  );
}

TechnicalStandardTemplate.displayName = 'TechnicalStandardTemplate';
