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
import { Terminal, ChevronRight, Zap, Github, Linkedin, Twitter } from 'lucide-react';

export function TechnicalMinimalTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#22c55e'; // Terminal green
  const secondaryAccent = '#06b6d4'; // Cyan for technical
  const terminalBg = 'oklch(0.08 0.02 240)'; // Deep terminal background

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '6px',
        fontFamily: 'var(--font-geist-mono)',
      } as React.CSSProperties}
    >
      {/* Terminal Background - Deep Technical */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: terminalBg }} />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-[300px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[300px] opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}30 0%, transparent 60%)` }}
        />
        {/* Terminal scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.03) 2px, rgba(34,197,94,0.03) 4px)',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `linear-gradient(${accent}33 1px, transparent 1px), linear-gradient(90deg, ${accent}33 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Orbital Background - Terminal Orbs */}
      <OrbitalBackground
        orbCount={5}
        orbSizes={[180, 120, 220, 90, 150]}
        colors={[
          `oklch(0.55 0.18 145 / 0.12)`,
          `oklch(0.5 0.2 200 / 0.1)`,
          `oklch(0.6 0.15 140 / 0.08)`,
          `oklch(0.45 0.22 150 / 0.08)`,
          `oklch(0.55 0.16 145 / 0.06)`,
        ]}
        speed={0.08}
        className="pointer-events-none"
      />

      {/* Single Morphing Blob - Terminal Glow */}
      <MorphingBlob size={320} color={accent} opacity={0.18} speed={0.06} complexity={3} className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Floating terminal elements */}
      <TechnicalFloatingElements accent={accent} secondaryAccent={secondaryAccent} reducedMotion={reducedMotion} />

      <Stack space={8} className="relative max-w-[720px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {/* TERMINAL HEADER */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <div className="w-full max-w-[720px] mx-auto mb-8">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: 'oklch(0.12 0.02 240)', borderColor: 'oklch(0.2 0.02 240)' }}>
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.3 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.35 }} />
              <motion.div className="w-3 h-3 rounded-full" style={{ background: '#28ca42' }} initial={reducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.4 }} />
            </div>
            <div className="p-4" style={{ background: 'oklch(0.1 0.02 240)', border: '1px solid oklch(0.2 0.02 240)', borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
              <Stack space={1.5}>
                <Flex gap={2} align="center">
                  <Text size="sm" style={{ color: accent }}>$</Text>
                  <Text size="sm" style={{ color: 'oklch(0.5 0.02 240)' }}>whoami</Text>
                </Flex>
                <Flex gap={2} align="center" style={{ marginLeft: '1.5rem' }}>
                  <Text size="sm" style={{ color: 'oklch(0.9 0.02 240)' }}>{profile.name}</Text>
                </Flex>
                <div style={{ height: '1px', background: 'oklch(0.2 0.02 240)', margin: '0.5rem 0' }} />
                <Flex gap={2} align="center">
                  <Text size="sm" style={{ color: accent }}>$</Text>
                  <Text size="sm" style={{ color: 'oklch(0.5 0.02 240)' }}>cat headline.txt</Text>
                </Flex>
                <Flex gap={2} align="center" style={{ marginLeft: '1.5rem' }}>
                  <Text size="sm" style={{ color: 'oklch(0.6 0.02 240)' }}>{profile.headline || 'No headline set'}</Text>
                </Flex>
              </Stack>
            </div>
          </div>
        </motion.div>

        {/* PROFILE - Terminal Style */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.4 }}
        >
          <Stack space={3} align="center" className="text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2" style={{ borderColor: accent }}>
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

        {/* BIO - Code Block Style */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
          >
            <div className="relative" style={{ background: 'oklch(0.1 0.02 240)', border: '1px solid oklch(0.2 0.02 240)', borderRadius: '6px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'oklch(0.12 0.02 240)', borderBottom: '1px solid oklch(0.2 0.02 240)' }}>
                <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>about.md</Text>
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

        {/* LINKS - Terminal Output Lines */}
        {profile.links.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.8 }}
          >
            <div style={{ height: '1px', background: 'oklch(0.2 0.02 240)', marginBottom: '1rem' }} />
            <div className="relative" style={{ background: 'oklch(0.1 0.02 240)', border: '1px solid oklch(0.2 0.02 240)', borderRadius: '6px' }}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    radius={60}
                    strength={0.1}
                    className={cn('w-full', isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '0',
                      border: index > 0 ? '1px solid oklch(0.2 0.02 240)' : 'none',
                      borderTop: 'none',
                      background: 'transparent',
                      boxShadow: 'none',
                    }}
                  >
                    <button
                      onClick={() => onLinkClick?.(link)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      style={{
                        fontFamily: 'var(--font-geist-mono)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'oklch(0.15 0.02 240)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
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
                        transition={{ ...spring.gentle, delay: 0.8 + index * 0.03 }}
                        style={{ color: accent, fontWeight: 600, fontFamily: 'var(--font-geist-mono)' }}
                      >
                        {link.label}
                      </motion.span>
                      <Text size="xs" className="flex-1 truncate" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>
                        {link.url}
                      </Text>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 0.9 + index * 0.03 }}
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
                  </MagneticCard>
                ))}
            </div>
          </motion.div>
        )}

        {/* PROOFS - Terminal Stats */}
        {profile.proofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
          >
            <div style={{ height: '1px', background: 'oklch(0.2 0.02 240)', marginBottom: '1rem' }} />
            <div className="relative" style={{ background: 'oklch(0.1 0.02 240)', border: '1px solid oklch(0.2 0.02 240)', borderRadius: '6px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'oklch(0.12 0.02 240)', borderBottom: '1px solid oklch(0.2 0.02 240)' }}>
                <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>stats.json</Text>
                <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>verified</Text>
              </div>
              <div className="p-4 font-mono text-sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                {profile.proofs
                  .slice(0, 5)
                  .map((proof) => (
                    <div key={proof.id} className="flex items-center gap-3 py-2" style={{ borderLeft: `2px solid ${accent}`, paddingLeft: '0.75rem' }}>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ ...spring.gentle }}
                        style={{ color: '#64748b', fontFamily: 'var(--font-geist-mono)' }}
                      >
                        ▸
                      </motion.span>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...spring.gentle, delay: 0.1 }}
                        style={{ color: accent, fontWeight: 600, fontFamily: 'var(--font-geist-mono)' }}
                      >
                        {proof.title}
                      </motion.span>
                      {proof.value && (
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring.gentle, delay: 0.2 }}
                          className="ml-auto"
                          style={{ color: 'oklch(0.6 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}
                        >
                          {proof.value}
                        </motion.span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBDOMAIN - Terminal Footer */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.1 }}
          className="text-center pt-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'oklch(0.1 0.02 240)', border: `1px solid ${accent}40` }}>
            <Text size="sm" weight="bold" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
              {profile.subdomain}.unool.co
            </Text>
          </div>
        </motion.div>
      </Stack>
    </div>
  );
}

// ==================== TECHNICAL FLOATING ELEMENTS ====================

function TechnicalFloatingElements({ accent, secondaryAccent, reducedMotion }: { accent: string; secondaryAccent: string; reducedMotion: boolean }) {
  const elements = [
    { x: 10, y: 15, size: 6, color: accent, delay: 0, char: '▸' },
    { x: 90, y: 10, size: 8, color: secondaryAccent, delay: 0.5, char: '◆' },
    { x: 8, y: 82, size: 6, color: accent, delay: 1, char: '▸' },
    { x: 92, y: 88, size: 8, color: secondaryAccent, delay: 1.5, char: '◆' },
    { x: 45, y: 5, size: 6, color: accent, delay: 0.2, char: '▸' },
    { x: 95, y: 45, size: 6, color: secondaryAccent, delay: 0.8, char: '◆' },
    { x: 15, y: 50, size: 6, color: accent, delay: 1.2, char: '▸' },
    { x: 85, y: 25, size: 6, color: secondaryAccent, delay: 1.8, char: '◆' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15" aria-hidden="true">
      {elements.map((el, i) => (
        <TechnicalFloatElement key={i} {...el} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function TechnicalFloatElement({ x, y, size, color, delay, char, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; char: string; reducedMotion: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.6,
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
        y: [-8, 8, -8],
        x: [-5, 5, -5],
        opacity: [0.4, 0.8, 0.4],
      }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {char}
    </motion.div>
  );
}

TechnicalMinimalTemplate.displayName = 'TechnicalMinimalTemplate';