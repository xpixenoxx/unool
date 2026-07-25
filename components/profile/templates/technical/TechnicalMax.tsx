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
import { Server, Database, Zap, Github, GitCommit, Terminal, ChevronRight, Zap as ZapIcon2, BarChart3, Activity, Code, FileCode, FileText, Settings, Folder, Layers } from 'lucide-react';

const terminalBg = 'oklch(0.05 0.02 240)';
const terminalSidebarBg = 'oklch(0.07 0.02 240)';
const terminalEditorBg = 'oklch(0.06 0.02 240)';
const terminalTerminalBg = 'oklch(0.04 0.02 240)';
const terminalBorder = 'oklch(0.15 0.02 240)';
const terminalAccentBg = 'oklch(0.1 0.02 240)';
const terminalHeaderBg = 'oklch(0.09 0.02 240)';

export function TechnicalMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || '#22c55e';
  const secondaryAccent = '#06b6d4';
  const accentPurple = '#a855f7';

  // Live commit data
  const commits = [
    { hash: 'a1b2c3d', msg: `feat(profile): update ${profile.name.toLowerCase().replace(/\s+/g, '-')}.tsx`, time: '2m ago', type: 'feat' },
    { hash: 'e4f5g6h', msg: 'chore(links): add new configuration schema', time: '15m ago', type: 'chore' },
    { hash: 'i7j8k9l', msg: 'fix(types): resolve proof point definitions', time: '1h ago', type: 'fix' },
    { hash: 'm0n1o2p', msg: 'docs(template): add technical-max documentation', time: '3h ago', type: 'docs' },
    { hash: 'q3r4s5t', msg: 'refactor(3d): optimize magnetic hover animations', time: '1d ago', type: 'refactor' },
    { hash: 'u6v7w8x', msg: 'perf(components): lazy-load heavy 3D primitives', time: '2d ago', type: 'perf' },
    { hash: 'y9z0a1b', msg: 'test(hooks): add vitest coverage for profile', time: '1w ago', type: 'test' },
    { hash: 'c2d3e4f', msg: 'ci(deploy): add production deployment workflow', time: '1w ago', type: 'ci' },
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

  // Files for sidebar
  const files = [
    { name: 'profile.tsx', icon: FileCode, active: true, type: 'tsx' },
    { name: 'links.ts', icon: FileText, active: false, type: 'ts' },
    { name: 'proofs.ts', icon: FileText, active: false, type: 'ts' },
    { name: 'theme.css', icon: Settings, active: false, type: 'css' },
    { name: 'config.json', icon: Settings, active: false, type: 'json' },
    { name: 'components/', icon: Folder, active: false, type: 'dir' },
    { name: 'hooks/', icon: Folder, active: false, type: 'dir' },
    { name: 'utils/', icon: Folder, active: false, type: 'dir' },
  ];

  const deps = [
    { name: 'framer-motion', version: '^11.0.0', icon: Layers },
    { name: 'lucide-react', version: '^0.400.0', icon: Code },
    { name: 'tailwindcss', version: '^3.4.0', icon: Settings },
    { name: '@radix-ui/*', version: 'latest', icon: Layers },
  ];

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        fontFamily: 'var(--font-geist-mono)',
      } as React.CSSProperties}
    >
      {/* Technical Max Background - Full IDE Environment */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, ${terminalBg} 0%, oklch(0.03 0.02 240) 50%, ${terminalBg} 100%)`
        }} />
        {/* Quad glow orbs */}
        <div
          className="absolute top-1/5 left-1/6 w-[500px] h-[500px] rounded-full blur-[350px] opacity-25"
          style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/3 right-1/6 w-[450px] h-[450px] rounded-full blur-[350px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${accentPurple}30 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/5 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[350px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}30 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/3 right-1/6 w-[400px] h-[400px] rounded-full blur-[350px] opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${accent}20 0%, transparent 70%)` }}
        />
        {/* Dense terminal grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-2"
          style={{
            backgroundImage: `linear-gradient(${accent}10 1px, transparent 1px), linear-gradient(90deg, ${accent}10 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Orbital Background - 12 Orbs for Max */}
      <OrbitalBackground
        orbCount={12}
        orbSizes={[320, 240, 380, 180, 280, 220, 340, 160, 300, 200, 360, 140]}
        colors={[
          `oklch(0.62 0.18 145 / 0.22)`,
          `oklch(0.58 0.2 200 / 0.2)`,
          `oklch(0.68 0.15 140 / 0.18)`,
          `oklch(0.55 0.22 150 / 0.18)`,
          `oklch(0.6 0.16 145 / 0.15)`,
          `oklch(0.62 0.18 200 / 0.15)`,
          `oklch(0.58 0.16 145 / 0.12)`,
          `oklch(0.55 0.2 200 / 0.12)`,
          `oklch(0.65 0.18 145 / 0.1)`,
          `oklch(0.6 0.2 200 / 0.1)`,
          `oklch(0.55 0.16 145 / 0.08)`,
          `oklch(0.5 0.18 200 / 0.08)`,
        ]}
        speed={0.2}
        className="pointer-events-none"
      />

      {/* Quad Morphing Blobs - Maximum Glows */}
      <MorphingBlob size={420} color={accent} opacity={0.22} speed={0.12} complexity={6} className="absolute top-1/5 left-1/6 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={340} color={accentPurple} opacity={0.18} speed={0.1} complexity={5} className="absolute top-1/3 right-1/6 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={280} color={secondaryAccent} opacity={0.14} speed={0.09} complexity={4} className="absolute bottom-1/5 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <MorphingBlob size={220} color={accent} opacity={0.1} speed={0.08} complexity={3} className="absolute bottom-1/3 right-1/6 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Orbital Particles - Maximum density */}
      <OrbitalParticles
        count={80}
        size={2.5}
        color={accent}
        opacity={0.3}
        speed={0.08}
        className="pointer-events-none"
      />

      {/* Layered Glow System - Max intensity */}
      <LayeredGlowSystem
        layers={4}
        baseColor={accent}
        className="pointer-events-none"
      />

      {/* Floating terminal elements */}
      <TechnicalMaxFloatingElements accent={accent} secondaryAccent={secondaryAccent} accentPurple={accentPurple} reducedMotion={reducedMotion} />

      {/* IDE LAYOUT - Sidebar + Editor + Terminal */}
      <motion.div
        className="relative max-w-[1400px] mx-auto min-h-[850px] flex"
        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.2 }}
      >
        {/* FILE TREE SIDEBAR */}
        <aside className="w-64 lg:w-72 flex-shrink-0 border-r flex flex-col" style={{ borderColor: terminalBorder, background: terminalSidebarBg }}>
          {/* Sidebar Header */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: terminalBorder }}>
            <Flex align="center" gap={2}>
              <motion.div
                className="h-2 w-2 rounded-full"
                style={{ background: accent }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <Text size="sm" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                {profile.name.toLowerCase().replace(/\s+/g, '-')}
              </Text>
            </Flex>
            <Badge variant="outline" size="sm" style={{ fontFamily: 'var(--font-geist-mono)', borderColor: accent, color: accent }}>
              {profile.links.filter((l: any) => l.isVisible).length} files
            </Badge>
          </div>

          {/* File Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <Text size="xs" weight="medium" color="muted" className="px-2" style={{ fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'oklch(0.5 0.02 240)' }}>
              Sources
            </Text>
            {files.map((file, index) => (
              <motion.button
                key={file.name}
                initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring.gentle, delay: 0.3 + index * 0.04 }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-[4px] transition-all text-left"
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  background: file.active ? `linear-gradient(135deg, ${accent}20, ${accent}10)` : 'transparent',
                  color: file.active ? accent : 'oklch(0.7 0.02 240)',
                  border: file.active ? `1px solid ${accent}30` : 'none',
                }}
              >
                <motion.div
                  initial={reducedMotion ? {} : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.4 + index * 0.04 }}
                  style={{ color: file.active ? accent : 'oklch(0.5 0.02 240)' }}
                >
                  <file.icon className="h-4 w-4" />
                </motion.div>
                <span className="truncate">{file.name}</span>
              </motion.button>
            ))}

            <Text size="xs" weight="medium" color="muted" className="px-2 mt-4" style={{ fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'oklch(0.5 0.02 240)' }}>
              Dependencies
            </Text>
            {deps.map((dep, index) => (
              <motion.div
                key={dep.name}
                initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring.gentle, delay: 0.5 + index * 0.04 }}
                className="px-2 py-1.5 text-xs flex items-center gap-2"
                style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 240)' }}
              >
                <motion.div
                  initial={reducedMotion ? {} : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.6 + index * 0.04 }}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                />
                <span>{dep.name}</span>
                <Text size="xs" style={{ color: 'oklch(0.4 0.02 240)' }}>{dep.version}</Text>
              </motion.div>
            ))}

            {/* Profile Mini */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.7 }}
              className="p-3 border-t"
              style={{ borderColor: terminalBorder }}
            >
              <Flex align="center" gap={3}>
                <Avatar className="h-10 w-10" style={{ borderColor: accent }}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem' }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Flex column gap={1} flex={1} className="min-w-0">
                  <Text weight="medium" size="sm" className="truncate" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                    {profile.name}
                  </Text>
                  <Text size="xs" color="muted" className="truncate" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 240)' }}>
                    {profile.headline || 'Developer'}
                  </Text>
                </Flex>
              </Flex>
            </motion.div>
          </div>
        </aside>

        {/* MAIN EDITOR AREA */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: terminalEditorBg }}>
          {/* Editor Tabs */}
          <div className="border-b flex-shrink-0" style={{ borderColor: terminalBorder }}>
            <Tabs defaultValue="profile" className="w-full" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              <TabsList className="flex h-10 bg-transparent" style={{ background: terminalHeaderBg }}>
                <TabsTrigger value="profile" className="data-[state=active]:bg-transparent data-[state=active]:text-[var(--profile-accent)] data-[state=active]:shadow-none">
                  <FileCode className="h-3.5 w-3.5 mr-1.5" /> profile.tsx
                </TabsTrigger>
                <TabsTrigger value="links" className="data-[state=active]:bg-transparent data-[state=active]:text-[var(--profile-accent)] data-[state=active]:shadow-none">
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> links.ts
                </TabsTrigger>
                <TabsTrigger value="proofs" className="data-[state=active]:bg-transparent data-[state=active]:text-[var(--profile-accent)] data-[state=active]:shadow-none">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> proofs.ts
                </TabsTrigger>
                <TabsTrigger value="theme" className="data-[state=active]:bg-transparent data-[state=active]:text-[var(--profile-accent)] data-[state=active]:shadow-none">
                  <Settings className="h-3.5 w-3.5 mr-1.5" /> theme.css
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:text-[var(--profile-accent)] data-[state=active]:shadow-none">
                  <Activity className="h-3.5 w-3.5 mr-1.5" /> activity.log
                </TabsTrigger>
              </TabsList>

              {/* PROFILE TAB */}
              <TabsContent value="profile" className="flex-1 p-6 overflow-y-auto" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                <Stack space={5} className="max-w-3xl mx-auto">
                  {/* Profile Header Card */}
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.4 }}
                    className="flex items-center gap-4 p-5 rounded-xl relative overflow-hidden"
                    style={{ background: terminalAccentBg, border: `1px solid ${accent}30` }}
                  >
                    <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${accent}10, transparent)` }} />
                    <Avatar className="h-16 w-16 border-2" style={{ borderColor: accent }}>
                      <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                      <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Flex column gap={2} flex={1}>
                      <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                        {profile.name}
                      </Text>
                      {profile.headline && <Text color="muted" style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 240)' }}>{profile.headline}</Text>}
                    </Flex>
                    <Badge variant="default" className="px-3 py-1" style={{ fontFamily: 'var(--font-geist-mono)', background: accent, color: terminalBg }}>
                      ⬢ Active
                    </Badge>
                  </motion.div>

                  {/* Bio */}
                  {profile.bio && (
                    <motion.div
                      initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.standard, delay: 0.5 }}
                      className="relative"
                      style={{ background: terminalAccentBg, border: `1px solid ${terminalBorder}`, borderRadius: '12px', overflow: 'hidden' }}
                    >
                      <div className="flex items-center gap-2 px-4 py-3" style={{ background: terminalHeaderBg, borderBottom: `1px solid ${terminalBorder}` }}>
                        <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>profile.tsx</Text>
                        <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>export const bio = \`</Text>
                        <motion.div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: accent }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                      </div>
                      <div className="p-5">
                        <pre style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.875rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'oklch(0.9 0.02 240)' }}>
                          <code>{profile.bio}</code>
                        </pre>
                      </div>
                    </motion.div>
                  )}

                  {/* Links Card with MagneticCard */}
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.6 }}
                  >
                    <Flex between className="mb-3">
                      <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                        Links ({profile.links.filter((l: any) => l.isVisible).length})
                      </Text>
                      <Badge variant="outline" style={{ fontFamily: 'var(--font-geist-mono)', borderColor: accent, color: accent }}>
                        editable
                      </Badge>
                    </Flex>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {profile.links
                        .filter(l => l.isVisible)
                        .slice(0, 20)
                        .map((link, index) => (
                          <MagneticCard
                            key={link.id}
                            radius={60}
                            strength={0.12}
                            className={cn('w-full', isPreview && 'opacity-80')}
                            style={{
                              borderRadius: '8px',
                              border: `1px solid ${terminalBorder}`,
                              background: terminalAccentBg,
                              padding: '0.5rem',
                            }}
                          >
                            <motion.button
                              onClick={() => onLinkClick?.(link)}
                              initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...spring.gentle, delay: 0.7 + index * 0.03 }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-[6px] hover:bg-primary/5 transition-colors"
                              style={{ fontFamily: 'var(--font-geist-mono)' }}
                            >
                              <motion.div
                                initial={reducedMotion ? {} : { scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ ...spring.bouncy, delay: 0.8 + index * 0.03 }}
                                className="flex items-center justify-center font-mono font-medium"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '6px',
                                  background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                                  color: terminalBg,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {link.icon || link.label.charAt(0).toUpperCase()}
                              </motion.div>
                              <Flex column gap={0.5} flex={1} className="min-w-0">
                                <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                                  {link.label}
                                </Text>
                                <Text size="xs" color="muted" className="truncate font-mono" style={{ color: 'oklch(0.4 0.02 240)' }}>
                                  {link.url}
                                </Text>
                              </Flex>
                              <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums' }}>
                                {link.clicks.toLocaleString()}
                              </Text>
                            </motion.button>
                          </MagneticCard>
                        ))}
                    </div>
                  </motion.div>

                  {/* Proofs Card with TiltCard */}
                  {profile.proofs.length > 0 && (
                    <motion.div
                      initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.standard, delay: 0.7 }}
                    >
                      <Text size="sm" weight="medium" className="mb-3" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                        Proof Points ({profile.proofs.length})
                      </Text>
                      <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={3}>
                        {profile.proofs
                          .slice(0, 9)
                          .map((proof, index) => (
                            <TiltCard key={proof.id} maxTilt={6} scale={1.02}>
                              <motion.div
                                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...spring.standard, delay: 0.8 + index * 0.05 }}
                                className="p-4 rounded-xl"
                                style={{ background: terminalAccentBg, border: `1px solid ${terminalBorder}`, minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                              >
                                <Flex align="center" gap={2} className="mb-2">
                                  {proof.icon && (
                                    <motion.span
                                      initial={reducedMotion ? {} : { scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ ...spring.bouncy, delay: 0.9 + index * 0.05 }}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '8px',
                                        background: `linear-gradient(135deg, ${accent}, ${accentPurple})`,
                                        color: terminalBg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem',
                                      }}
                                    >
                                      {proof.icon}
                                    </motion.span>
                                  )}
                                  <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                                    {proof.title}
                                  </Text>
                                </Flex>
                                {proof.value && (
                                  <motion.div
                                    initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...spring.standard, delay: 0.9 + index * 0.05 }}
                                    style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontSize: '1.75rem', fontWeight: 700 }}
                                  >
                                    {proof.value}
                                  </motion.div>
                                )}
                              </motion.div>
                            </TiltCard>
                          ))}
                      </Grid>
                    </motion.div>
                  )}
                </Stack>
              </TabsContent>

              {/* LINKS TAB - Database View */}
              <TabsContent value="links" className="flex-1 p-6 overflow-y-auto" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                <Stack space={5} className="max-w-2xl mx-auto">
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.4 }}
                  >
                    <Text level={4} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                      Links Database
                    </Text>
                    <div className="space-y-2">
                      {profile.links
                        .filter(l => l.isVisible)
                        .map((link, index) => (
                          <MagneticCard
                            key={link.id}
                            radius={60}
                            strength={0.1}
                            className={cn(isPreview && 'opacity-80')}
                            style={{
                              borderRadius: '8px',
                              border: `1px solid ${terminalBorder}`,
                              background: terminalAccentBg,
                              padding: '0.75rem 1rem',
                            }}
                          >
                            <motion.div
                              initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...spring.gentle, delay: 0.5 + index * 0.03 }}
                              className="flex items-center gap-3 p-2"
                            >
                              <Text size="sm" style={{ color: 'oklch(0.4 0.02 240)', fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums', minWidth: '2rem' }}>
                                {index + 1}.
                              </Text>
                              <Text style={{ color: accent, fontWeight: 600, fontFamily: 'var(--font-geist-mono)' }}>
                                {link.label}
                              </Text>
                              <Text size="sm" className="flex-1 truncate" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>
                                {link.url}
                              </Text>
                              <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>
                                {link.clicks.toLocaleString()}
                              </Text>
                            </motion.div>
                          </MagneticCard>
                        ))}
                    </div>
                  </motion.div>
                </Stack>
              </TabsContent>

              {/* PROOFS TAB - Stats View */}
              <TabsContent value="proofs" className="flex-1 p-6 overflow-y-auto" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                <Stack space={5} className="max-w-3xl mx-auto">
                  {profile.proofs.length > 0 && (
                    <motion.div
                      initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.standard, delay: 0.4 }}
                    >
                      <Text level={4} className="mb-3" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                        Proof Points ({profile.proofs.length})
                      </Text>
                      <div className="space-y-3">
                        {profile.proofs.map((proof, index) => (
                          <PerspectiveFlip key={proof.id} axis="y" duration={0.5}>
                            <div style={{ position: 'relative' }}>
                              <MagneticCard
                                radius={60}
                                strength={0.1}
                                className="w-full"
                                style={{
                                  background: terminalAccentBg,
                                  border: `1px solid ${terminalBorder}`,
                                  borderRadius: '10px',
                                  padding: '1.25rem 1.5rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '1rem',
                                }}
                              >
                                {proof.icon && (
                                  <motion.div
                                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ ...spring.bouncy, delay: 0.5 + index * 0.08 }}
                                    style={{
                                      width: 48,
                                      height: 48,
                                      borderRadius: '10px',
                                      background: `linear-gradient(135deg, ${accent}, ${accentPurple})`,
                                      color: terminalBg,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.5rem',
                                    }}
                                  >
                                    {proof.icon}
                                  </motion.div>
                                )}
                                <Flex column gap={0.25} flex={1}>
                                  <motion.span
                                    initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ ...spring.gentle, delay: 0.5 + index * 0.08 }}
                                    style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.9 0.02 240)', fontWeight: 600, fontSize: '0.9375rem' }}
                                  >
                                    {proof.title}
                                  </motion.span>
                                  {proof.value && (
                                    <motion.span
                                      initial={reducedMotion ? {} : { opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ ...spring.gentle, delay: 0.6 + index * 0.08 }}
                                      style={{ fontFamily: 'var(--font-geist-mono)', color: 'oklch(0.5 0.02 240)', fontSize: '0.875rem' }}
                                    >
                                      {proof.value}
                                    </motion.span>
                                  )}
                                </Flex>
                                <motion.span
                                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ ...spring.bouncy, delay: 0.6 + index * 0.08 }}
                                  style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums' }}
                                >
                                  ✓ verified
                                </motion.span>
                              </MagneticCard>
                            </div>
                          </PerspectiveFlip>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </Stack>
              </TabsContent>

              {/* THEME TAB - Config */}
              <TabsContent value="theme" className="flex-1 p-6 overflow-y-auto" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                <motion.pre
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.4 }}
                  style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'oklch(0.9 0.02 240)' }}
                >
                  <code>{`// Profile Theme Configuration
export const theme = {
  template: '${profile.theme?.template || 'technical-max'}',
  preset: '${profile.theme?.preset || 'technical'}',
  accentColor: '${accent}',
  customCss: ${profile.theme?.customCss ? `'${profile.theme.customCss}'` : 'null'},

  // Design tokens
  tokens: {
    radius: '8px',
    shadow: '0 12px 48px 0 oklch(0.2 0.1 145 / 0.15)',
    font: {
      ui: 'Geist Variable',
      mono: 'Geist Mono Variable',
      display: 'Syne Variable',
    },
    colors: {
      accent: '${accent}',
      accentHover: '#16a34a',
      background: 'oklch(0.98 0 0)',
      surface: 'oklch(1 0 0)',
      border: 'oklch(0.9 0 0)',
    },
  },

  // 3D Features
  features: {
    has3DBackground: true,
    hasParallax: true,
    hasTiltCards: true,
    hasMagneticHover: true,
    hasAnimatedOrbs: true,
    hasGradientText: false,
    supportsVideoBackground: false,
  },
};`}</code>
                </motion.pre>
              </TabsContent>

              {/* ACTIVITY TAB - Live Commit Ticker with AnimatePresence */}
              <TabsContent value="activity" className="flex-1 p-6 overflow-y-auto" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.4 }}
                  className="relative"
                  style={{ background: terminalAccentBg, border: `1px solid ${terminalBorder}`, borderRadius: '12px', overflow: 'hidden' }}
                >
                  <div className="flex items-center gap-2 px-4 py-3" style={{ background: terminalHeaderBg, borderBottom: `1px solid ${terminalBorder}` }}>
                    <Text size="xs" style={{ color: 'oklch(0.5 0.02 240)', fontFamily: 'var(--font-geist-mono)' }}>activity.log</Text>
                    <Text size="xs" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>live feed</Text>
                    <motion.div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: accent }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  </div>
                  <div className="p-5 max-h-[400px] overflow-y-auto">
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
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* TERMINAL PANEL */}
          <div className="h-64 lg:h-72 border-t flex-shrink-0 flex flex-col" style={{ borderColor: terminalBorder, background: terminalTerminalBg }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: terminalBorder }}>
              <Flex align="center" gap={2}>
                <div className="flex gap-1">
                  <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28ca42' }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                </div>
                <Text size="xs" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                  terminal.tsx
                </Text>
              </Flex>
              <Badge variant="outline" size="sm" style={{ fontFamily: 'var(--font-geist-mono)', borderColor: accent, color: accent }}>
                RUNNING
              </Badge>
            </div>
            <motion.div
              className="flex-1 p-4 overflow-y-auto font-mono text-sm"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
              initial={reducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...spring.gentle, delay: 0.8 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Text size="sm" style={{ color: accent }}>dev@unool</Text>
                <Text size="sm" style={{ color: '#64748b' }}>:</Text>
                <Text size="sm" style={{ color: '#3b82f6' }}>~</Text>
                <Text size="sm" style={{ color: accent }}>$</Text>
              </div>
              <Stack space={1} style={{ color: 'oklch(0.7 0.02 240)' }}>
                <Flex align="center" gap={2}>
                  <Text size="sm" style={{ color: accent }}>✓</Text>
                  <Text size="sm">Profile server started on port 3000</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Text size="sm" style={{ color: accent }}>✓</Text>
                  <Text size="sm">Template engine: technical-max loaded</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Text size="sm" style={{ color: accent }}>✓</Text>
                  <Text size="sm">{profile.links.filter((l: any) => l.isVisible).length} links indexed</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Text size="sm" style={{ color: accent }}>✓</Text>
                  <Text size="sm">{profile.proofs.length} proofs verified</Text>
                </Flex>
                <Flex align="center" gap={2} style={{ marginTop: '0.5rem' }}>
                  <motion.div className="h-2 w-2 rounded-full" style={{ background: accent }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  <Text size="sm" style={{ color: accent }}>Waiting for connections...</Text>
                </Flex>
                <div style={{ marginTop: '1rem' }}>
                  <div className="flex items-center gap-2">
                    <Text size="sm" style={{ color: accent }}>dev@unool</Text>
                    <Text size="sm" style={{ color: '#64748b' }}>:</Text>
                    <Text size="sm" style={{ color: '#3b82f6' }}>~</Text>
                    <Text size="sm" style={{ color: accent }}>$</Text>
                    <motion.span className="ml-2 h-4 w-2" style={{ background: accent }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  </div>
                </div>
              </Stack>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== TECHNICAL MAX FLOATING ELEMENTS ====================

function TechnicalMaxFloatingElements({ accent, secondaryAccent, accentPurple, reducedMotion }: { accent: string; secondaryAccent: string; accentPurple: string; reducedMotion: boolean }) {
  const elements = [
    { x: 8, y: 12, size: 6, color: accent, delay: 0, char: '▸' },
    { x: 92, y: 10, size: 8, color: accentPurple, delay: 0.3, char: '◆' },
    { x: 5, y: 85, size: 6, color: accent, delay: 0.6, char: '▸' },
    { x: 95, y: 90, size: 8, color: accentPurple, delay: 0.9, char: '◆' },
    { x: 48, y: 3, size: 6, color: secondaryAccent, delay: 0.1, char: '▸' },
    { x: 96, y: 48, size: 6, color: accent, delay: 0.4, char: '◆' },
    { x: 12, y: 50, size: 6, color: accentPurple, delay: 0.7, char: '▸' },
    { x: 88, y: 22, size: 6, color: secondaryAccent, delay: 1, char: '◆' },
    { x: 25, y: 15, size: 6, color: accent, delay: 1.2, char: '▸' },
    { x: 75, y: 85, size: 6, color: accentPurple, delay: 1.5, char: '◆' },
    { x: 60, y: 8, size: 6, color: secondaryAccent, delay: 1.8, char: '▸' },
    { x: 90, y: 65, size: 6, color: accent, delay: 2.1, char: '◆' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15" aria-hidden="true">
      {elements.map((el, i) => (
        <TechnicalMaxFloatElement key={i} {...el} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function TechnicalMaxFloatElement({ x, y, size, color, delay, char, reducedMotion }: { x: number; y: number; size: number; color: string; delay: number; char: string; reducedMotion: boolean }) {
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
        y: [-15, 15, -15],
        x: [-10, 10, -10],
        opacity: [0.3, 0.8, 0.3],
      }}
      transition={{ duration: 10 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {char}
    </motion.div>
  );
}

TechnicalMaxTemplate.displayName = 'TechnicalMaxTemplate';