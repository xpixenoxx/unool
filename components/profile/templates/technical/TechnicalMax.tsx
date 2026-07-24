'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import TiltCard from '@/components/ui/3d/TiltCard';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { ParallaxLayers, ParallaxLayer } from '@/components/ui/3d/ParallaxLayers';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function TechnicalMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || '#22c55e';

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        '--profile-shadow': '0 12px 48px 0 oklch(0.2 0.1 145 / 0.15), 0 8px 24px -6px oklch(0.2 0.1 145 / 0.15)',
      } as React.CSSProperties}
    >
      {/* IDE-style Parallax Background */}
      <ParallaxLayers
        containerClassName="absolute inset-0 -z-10"
        layers={[
          {
            depth: 0.1,
            className: "absolute inset-0",
            children: <OrbitalBackground count={10} speed={0.2} colors={[accent]} className="opacity-20" />,
          },
          {
            depth: 0.3,
            className: "absolute inset-0",
            children: (
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(90deg, ${accent}05 1px, transparent 1px), linear-gradient(${accent}05 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }} />
            ),
          },
        ]}
        mouseStrength={15}
        scrollStrength={30}
      />

      {/* IDE Layout: Sidebar + Editor + Terminal */}
      <div className="flex min-h-[850px] max-w-[1300px] mx-auto">
        {/* File Tree Sidebar */}
        <aside className="w-64 lg:w-72 flex-shrink-0 border-r bg-zinc-950/50 backdrop-blur-xl" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
              <Flex align="center" gap={2}>
                <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
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
              <Text size="xs" weight="medium" color="muted" className="px-2" style={{ fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sources
              </Text>
              {[
                { name: 'profile.tsx', icon: '👤', active: true },
                { name: 'links.ts', icon: '🔗', active: false },
                { name: 'proofs.ts', icon: '🏆', active: false },
                { name: 'theme.css', icon: '🎨', active: false },
                { name: 'config.json', icon: '⚙️', active: false },
              ].map((file) => (
                <Button
                  key={file.name}
                  variant={file.active ? 'default' : 'ghost'}
                  className="w-full justify-start gap-2 px-2 py-1.5 text-xs"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    borderRadius: '4px',
                    background: file.active ? accent : 'transparent',
                    color: file.active ? 'var(--primary-foreground)' : 'inherit',
                  }}
                >
                  <span>{file.icon}</span>
                  <span className="truncate">{file.name}</span>
                </Button>
              ))}

              <Text size="xs" weight="medium" color="muted" className="px-2 mt-4" style={{ fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dependencies
              </Text>
              {['framer-motion', 'lucide-react', 'tailwindcss', '@radix-ui/*'].map((dep) => (
                <div key={dep} className="px-2 py-1.5 text-xs flex items-center gap-2" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--muted-foreground)' }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                  {dep}
                </div>
              ))}
            </div>

            {/* Profile Mini */}
            <div className="p-3 border-t" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
              <Flex align="center" gap={3}>
                <Avatar className="h-10 w-10" style={{ borderColor: accent }}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem' }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Flex column gap={1} flex={1} className="min-w-0">
                  <Text weight="medium" size="sm" className="truncate" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                    {profile.name}
                  </Text>
                  <Text size="xs" color="muted" className="truncate" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                    {profile.headline || 'Developer'}
                  </Text>
                </Flex>
              </Flex>
            </div>
          </div>
        </aside>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Tabs */}
          <Tabs defaultValue="profile" className="border-b flex-shrink-0" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
            <TabsList className="bg-zinc-950/50" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              <TabsTrigger value="profile">profile.tsx</TabsTrigger>
              <TabsTrigger value="links">links.ts</TabsTrigger>
              <TabsTrigger value="theme">theme.css</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="flex-1 p-6 overflow-y-auto bg-zinc-950 font-mono text-sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              <Stack space={4} className="max-w-3xl mx-auto">
                {/* Profile Header in Editor */}
                <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: `1px solid ${accent}20` }}>
                  <Avatar className="h-16 w-16" style={{ borderColor: accent }}>
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                    <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Flex column gap={2} flex={1}>
                    <Heading as="h1" level={2} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                      {profile.name}
                    </Heading>
                    {profile.headline && <Text color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>{profile.headline}</Text>}
                  </Flex>
                  <Badge variant="success" style={{ fontFamily: 'var(--font-geist-mono)', background: accent }}>
                    ⬢ Active
                  </Badge>
                </div>

                {profile.bio && (
                  <Card variant="outlined" padding="lg" style={{ borderColor: accent }}>
                    <CardHeader>
                      <CardTitle style={{ fontFamily: 'var(--font-geist-mono)' }}>Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                        <code>{profile.bio}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {/* Links */}
                <Card variant="outlined" padding="lg" style={{ borderColor: accent }}>
                  <CardHeader>
                    <Flex between>
                      <CardTitle style={{ fontFamily: 'var(--font-geist-mono)' }}>Links ({profile.links.filter((l: any) => l.isVisible).length})</CardTitle>
                      <Badge variant="outline" style={{ fontFamily: 'var(--font-geist-mono)', borderColor: accent, color: accent }}>
                        editable
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {profile.links
                        .filter(l => l.isVisible)
                        .slice(0, 20)
                        .map((link, index) => (
                          <button
                            key={link.id}
                            onClick={() => onLinkClick?.(link)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
                            style={{ fontFamily: 'var(--font-geist-mono)' }}
                          >
                            <span
                              className="flex items-center justify-center font-mono font-medium"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '6px',
                                background: accent,
                                color: 'var(--primary-foreground)',
                                fontSize: '1rem',
                              }}
                            >
                              {link.icon || link.label.charAt(0).toUpperCase()}
                            </span>
                            <Flex column gap={1} flex={1} className="min-w-0">
                              <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                                {link.label}
                              </Text>
                              <Text size="xs" color="muted" className="truncate font-mono">
                                {link.url}
                              </Text>
                            </Flex>
                            <Text size="xs" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                              {link.clicks.toLocaleString()} clicks
                            </Text>
                          </button>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Proofs */}
                {profile.proofs.length > 0 && (
                  <Card variant="outlined" padding="lg" style={{ borderColor: accent }}>
                    <CardTitle style={{ fontFamily: 'var(--font-geist-mono)' }}>Proof Points ({profile.proofs.length})</CardTitle>
                    <CardContent>
                      <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
                        {profile.proofs
                          
                          .slice(0, 10)
                          .map((proof) => (
                            <div key={proof.id} className="p-4 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: `1px solid ${accent}20` }}>
                              <Flex align="center" gap={2} className="mb-2">
                                {proof.icon && <span style={{ fontSize: '1.25rem' }}>{proof.icon}</span>}
                                <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                                  {proof.title}
                                </Text>
                              </Flex>
                              {proof.value && (
                                <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                                  {proof.value}
                                </Text>
                              )}
                            </div>
                          ))}
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </TabsContent>

            <TabsContent value="links" className="flex-1 p-6 overflow-y-auto bg-zinc-950 font-mono text-sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              <Stack space={4} className="max-w-2xl mx-auto">
                <Heading level={4} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                  Links Database
                </Heading>
                <div className="space-y-2">
                  {profile.links
                    .filter(l => l.isVisible)
                    .map((link, index) => (
                      <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: `1px solid ${accent}20` }}>
                        <span className="text-zinc-500" style={{ fontFamily: 'var(--font-geist-mono)' }}>{index + 1}.</span>
                        <span style={{ color: accent, fontWeight: 600 }}>{link.label}</span>
                        <span className="flex-1 text-zinc-500 truncate">{link.url}</span>
                        <Text size="xs" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                          {link.clicks.toLocaleString()}
                        </Text>
                      </div>
                    ))}
                </div>
              </Stack>
            </TabsContent>

            <TabsContent value="theme" className="flex-1 p-6 overflow-y-auto bg-zinc-950 font-mono text-sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              <pre style={{ lineHeight: 1.7 }}>
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
              </pre>
            </TabsContent>
            </Tabs>
        </div>

        {/* Terminal Panel */}
        <div className="h-64 lg:h-72 border-t bg-zinc-950/80 backdrop-blur-xl flex-shrink-0" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
            <Flex align="center" gap={2}>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <Text size="xs" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                terminal.tsx
              </Text>
            </Flex>
            <Badge variant="outline" size="sm" style={{ fontFamily: 'var(--font-geist-mono)', borderColor: accent, color: accent }}>
              RUNNING
            </Badge>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: accent }}>dev@unool</span>
              <span style={{ color: '#64748b' }}>:</span>
              <span style={{ color: '#3b82f6' }}>~</span>
              <span style={{ color: accent }}>$</span>
            </div>
            <div className="space-y-1 text-zinc-300">
              <div className="flex items-center gap-2">
                <span style={{ color: '#64748b' }}>✓</span>
                <span>Profile server started on port 3000</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#64748b' }}>✓</span>
                <span>Template engine: {'technical-max'} loaded</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#64748b' }}>✓</span>
                <span>{profile.links.filter((l: any) => l.isVisible).length} links indexed</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#64748b' }}>✓</span>
                <span>{profile.proofs.length} proofs verified</span>
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: '0.5rem' }}>
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: accent }} />
                <span style={{ color: accent }}>Waiting for connections...</span>
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: '1rem' }}>
                <span style={{ color: accent }}>dev@unool</span>
                <span style={{ color: '#64748b' }}>:</span>
                <span style={{ color: '#3b82f6' }}>~</span>
                <span style={{ color: accent }}>$</span>
                <span className="ml-2" style={{ color: 'var(--foreground)' }}>_</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

TechnicalMaxTemplate.displayName = 'TechnicalMaxTemplate';