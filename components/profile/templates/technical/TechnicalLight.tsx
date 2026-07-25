'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { OrbitalBackground, MorphingBlob, MagneticCard, TiltCard, ParallaxLayers } from '@/components/ui/3d';
import { Flex, Stack, Box, Grid, Divider } from '@/components/ui/layout';
import { Text, Heading } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Server, Database, Zap, ChevronRight, Github, Linkedin, Twitter } from 'lucide-react';

const terminalBg = 'oklch(0.08 0.02 240)';
const terminalBorder = 'oklch(0.2 0.02 240)';
const terminalCardBg = 'oklch(0.1 0.02 240)';
const terminalHeaderBg = 'oklch(0.12 0.02 240)';

export function TechnicalLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#22c55e'; // Terminal green
  const secondaryAccent = '#06b6d4'; // Cyan

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '6px',
        fontFamily: 'var(--font-geist-mono)',
      } as React.CSSProperties}
    >
      {/* Terminal Background - Light Technical */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: terminalBg }} />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-[300px] opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${accent}30 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[300px] opacity-10"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}20 0%, transparent 60%)` }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-3"
          style={{
            backgroundImage: `linear-gradient(${accent}1a 1px, transparent 1px), linear-gradient(90deg, ${accent}1a 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Orbital Background - Terminal Orbs */}
      <OrbitalBackground
        orbCount={4}
        orbSizes={[160, 200, 120, 180]}
        colors={[
          `oklch(0.55 0.18 145 / 0.1)`,
          `oklch(0.5 0.2 200 / 0.08)`,
          `oklch(0.6 0.15 140 / 0.06)`,
          `oklch(0.45 0.22 150 / 0.06)`,
        ]}
        speed={0.06}
        className="pointer-events-none"
      />

      {/* Dual Morphing Blob - Terminal Glows */}
      <MorphingBlob size={280} color={accent} opacity={0.12} speed={0.05} complexity={3} className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={220} color={secondaryAccent} opacity={0.08} speed={0.07} complexity={4} className="absolute bottom-1/4 right-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Floating terminal elements */}
      <TechnicalLightFloatingElements accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

      <Stack space={8} className="relative max-w-[720px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {/* TERMINAL HEADER - npm start style */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <div className="w-full max-w-[720px] mx-auto mb-8">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: terminalHeaderBg, borderColor: terminalBorder }}>
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.3 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.35 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#28ca42' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.4 }} />
            </div>
            <div className="p-4" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
              <Stack space={1.5}>
                <Flex gap={2} align="center">
                  <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>$</Text>
                  <Text size="sm" style={{ color: '#a855f7', fontFamily: 'var(--font-geist-mono)' }}>npm</Text>
                  <Text size="sm" style={{ color: '#f97316', fontFamily: 'var(--font-geist-mono)' }}>start</Text>
                  <Text size="sm" style={{ color: '#3b82f6', fontFamily: 'var(--font-geist-mono)' }}>{profile.name.toLowerCase().replace(/\s+/g, '-')}</Text>
                  <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>--profile</Text>
                </Flex>
                <Flex gap={2} align="center" style={{ marginLeft: '1.5rem' }}>
                  <Text size="sm" style={{ color: '#64748b', fontFamily: 'var(--font-geist-mono)' }}>✓</Text>
                  <Text size="sm" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>Profile compiled</Text>
                  <Text size="sm" style={{ color: '#64748b', fontFamily: 'var(--font-geist-mono)' }}>→</Text>
                  <Text size="sm" style={{ color: '#a855f7', fontFamily: 'var(--font-geist-mono)' }}>{profile.links.length} links</Text>
                  <Text size="sm" style={{ color: '#64748b', fontFamily: 'var(--font-geist-mono)' }}>,</Text>
                  <Text size="sm" style={{ color: '#ec4899', fontFamily: 'var(--font-geist-mono)' }}>{profile.proofs.length} proofs</Text>
                </Flex>
              </Stack>
            </div>
          </div>
        </motion.div>

        {/* PROFILE HEADER */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.4 }}
        >
          <Stack space={3} align="center" className="text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4" style={{ borderColor: accent }}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 600, fontSize: '1.75rem' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Terminal cursor blink */}
              <motion.div
                className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 flex items-center justify-center"
                style={{ background: accent, borderColor: terminalBg }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div className="h-1.5 w-1.5 rounded-full" style={{ background: terminalBg }} animate={{ scale: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              </motion.div>
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

        {/* SYNTAX-HIGHLIGHTED BIO - Code Block Style */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
          >
            <div className="relative" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: terminalHeaderBg, borderBottom: `1px solid ${terminalBorder}` }}>
                <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>bio.txt</Text>
                <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>utf-8</Text>
                <motion.div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: accent }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              </div>
              <div className="p-4">
                <pre style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.875rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'oklch(0.9 0.02 240)' }}>
                  <code>{profile.bio}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* TECH STACK BADGES - MagneticCard grid */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.8 }}
        >
          <Flex gap={2} wrap align="center" className="justify-center">
            <MagneticCard radius={60} strength={0.15} className="px-4 py-2.5" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}` }}>
              <Flex gap={1.5} align="center">
                <Server className="h-4 w-4" style={{ color: secondaryAccent }} />
                <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.9 0.02 240)' }}>Node.js / TypeScript</Text>
              </Flex>
            </MagneticCard>
            <MagneticCard radius={60} strength={0.15} className="px-4 py-2.5" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}` }}>
              <Flex gap={1.5} align="center">
                <Database className="h-4 w-4" style={{ color: accent }} />
                <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.9 0.02 240)' }}>Supabase / PostgreSQL</Text>
              </Flex>
            </MagneticCard>
            <MagneticCard radius={60} strength={0.15} className="px-4 py-2.5" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}` }}>
              <Flex gap={1.5} align="center">
                <Zap className="h-4 w-4" style={{ color: '#fbbf24' }} />
                <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.9 0.02 240)' }}>Framer Motion 3D</Text>
              </Flex>
            </MagneticCard>
            <MagneticCard radius={60} strength={0.15} className="px-4 py-2.5" style={{ background: terminalCardBg, border: `1px solid ${terminalBorder}` }}>
              <Flex gap={1.5} align="center">
                <ChevronRight className="h-4 w-4" style={{ color: '#a855f7' }} />
                <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.9 0.02 240)' }}>Next.js 15 App Router</Text>
              </Flex>
            </MagneticCard>
          </Flex>
        </motion.div>

        {/* LINKS - Alternating MagneticCard/TiltCard with animated accents */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
          >
            <Divider style={{ opacity: 0.3, borderColor: accent }} />
            <Stack space={2}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 12)
                .map((link, index) => {
                  const isEven = index % 2 === 0;
                  const Card = isEven ? MagneticCard : TiltCard;
                  const cardProps = isEven ? { radius: 60, strength: 0.12 } : { radius: 60, glare: true, maxTilt: 4, scale: 1.01 };

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
                      <button
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
                          OPEN
                        </Badge>
                      </button>
                    </Card>
                  );
                })}
            </Stack>
          </motion.div>
        )}

        {/* PROOFS - Terminal Output Stats */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1 }}
          >
            <Divider style={{ opacity: 0.3, borderColor: accent }} />
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

// ==================== TECHNICAL LIGHT FLOATING ELEMENTS ====================

function TechnicalLightFloatingElements({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  const elements = [
    { x: 8, y: 18, size: 6, color: accent, delay: 0, char: '▸' },
    { x: 90, y: 12, size: 8, color: secondaryAccent, delay: 0.5, char: '◆' },
    { x: 6, y: 82, size: 6, color: accent, delay: 1, char: '▸' },
    { x: 94, y: 88, size: 8, color: secondaryAccent, delay: 1.5, char: '◆' },
    { x: 50, y: 5, size: 6, color: accent, delay: 0.2, char: '▸' },
    { x: 95, y: 50, size: 6, color: secondaryAccent, delay: 0.8, char: '◆' },
    { x: 15, y: 50, size: 6, color: accent, delay: 1.2, char: '▸' },
    { x: 85, y: 25, size: 6, color: secondaryAccent, delay: 1.8, char: '◆' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10" aria-hidden="true">
      {elements.map((el, i) => (
        <TechnicalLightFloatElement key={i} {...el} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function TechnicalLightFloatElement({ x, y, size, color, delay, char, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; char: string; reducedMotion: boolean }) {
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
        y: [-10, 10, -10],
        x: [-5, 5, -5],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{ duration: 10 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {char}
    </motion.div>
  );
}

TechnicalLightTemplate.displayName = 'TechnicalLightTemplate';
