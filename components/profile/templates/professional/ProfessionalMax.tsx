'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import TiltCard from '@/components/ui/3d/TiltCard';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { ParallaxLayers, ParallaxLayer } from '@/components/ui/3d/ParallaxLayers';
import { Progress } from '@/components/ui/progress';

export function ProfessionalMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        '--profile-shadow': '0 12px 40px 0 oklch(0.12 0.02 247.8 / 0.15), 0 8px 24px -6px oklch(0.12 0.02 247.8 / 0.15)',
      } as React.CSSProperties}
    >
      {/* Full-page parallax background */}
      <ParallaxLayers
        containerClassName="absolute inset-0 -z-10"
        layers={[
          {
            depth: 0.1,
            className: "absolute inset-0",
            children: <OrbitalBackground count={16} speed={0.3} colors={[accent]} className="opacity-30" />,
          },
          {
            depth: 0.3,
            className: "absolute inset-0",
            children: <OrbitalBackground count={8} speed={0.5} colors={[accent]} className="opacity-15" />,
          },
        ]}
        mouseStrength={20}
        scrollStrength={50}
      />

      {/* Dashboard Layout: Sidebar + Main */}
      <div className="flex min-h-[800px] max-w-[1200px] mx-auto">
        {/* Sidebar */}
        <aside className="w-64 lg:w-72 flex-shrink-0 border-r bg-background/50 backdrop-blur-xl" style={{ borderColor: 'var(--border)' }}>
          <Stack space={6} className="p-6 h-full">
            {/* Profile Header in Sidebar */}
            <Stack space={3} align="center" className="text-center border-b pb-6" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback style={{ fontSize: '2rem' }}>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2"
                  style={{ background: accent, borderColor: 'var(--background)' }}
                  aria-label="Active"
                />
              </div>
              <Stack space={0.5}>
                <Heading as="h2" level={3} style={{ fontFamily: 'var(--font-geist)' }}>
                  {profile.name}
                </Heading>
                {profile.headline && (
                  <Text size="sm" color="muted" weight="medium">
                    {profile.headline}
                  </Text>
                )}
              </Stack>
            </Stack>

            {/* Navigation */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
                { id: 'links', label: 'Links', icon: 'link-2' },
                { id: 'analytics', label: 'Analytics', icon: 'bar-chart-2' },
                { id: 'proofs', label: 'Proofs', icon: 'award' },
                { id: 'settings', label: 'Settings', icon: 'settings' },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2.5 text-sm"
                  style={{ fontFamily: 'var(--font-geist)', borderRadius: '8px' }}
                >
                  <span className="h-5 w-5" aria-hidden="true">📊</span>
                  <span>{item.label}</span>
                </Button>
              ))}
            </nav>

            {/* Quick Stats */}
            <Card variant="outlined" padding="md" style={{ borderColor: 'var(--border)' }}>
              <CardContent className="space-y-3">
                <Text size="xs" weight="medium" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Quick Stats
                </Text>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Clicks', value: profile.links.reduce((a: number, l: any) => a + l.clicks, 0) },
                    { label: 'Links', value: profile.links.filter((l: any) => l.isVisible).length },
                    { label: 'Proofs', value: profile.proofs.filter((p: any) => p.isVisible).length },
                    { label: 'Views', value: '12.4K' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <Text level={3} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                        {stat.value.toLocaleString ? stat.value.toLocaleString() : stat.value}
                      </Text>
                      <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                        {stat.label}
                      </Text>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Stack>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto" style={{ maxWidth: 'calc(100% - 18rem)' }}>
          <Stack space={8}>
            {/* Hero Section */}
            <section className="max-w-3xl">
              <Stack space={2}>
                <Badge variant="success" className="gap-1.5" style={{ fontFamily: 'var(--font-geist)', background: accent }}>
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: accent }} />
                  Live Profile
                </Badge>
                <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-geist)', letterSpacing: '-0.02em' }}>
                  {profile.name}
                </Heading>
                {profile.headline && (
                  <Text level={3} color="muted" weight="medium">
                    {profile.headline}
                  </Text>
                )}
              </Stack>
            </section>

            {/* Bio Section */}
            {profile.bio && (
              <section>
                <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)' }}>
                  <CardContent>
                    <Text level={4} color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)' }}>
                      {profile.bio}
                    </Text>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Metrics Dashboard */}
            {profile.proofs.length > 0 && (
              <section>
                <Flex between className="mb-4">
                  <Stack space={1}>
                    <Heading level={4} style={{ fontFamily: 'var(--font-geist)' }}>
                      Performance Metrics
                    </Heading>
                    <Text size="sm" color="muted">Real-time tracking across all platforms</Text>
                  </Stack>
                  <Badge variant="outline" className="gap-1" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                    Updated now
                  </Badge>
                </Flex>
                <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap={4}>
                  {profile.proofs
                    .filter(p => p.value)
                    .slice(0, 8)
                    .map((proof) => (
                      <TiltCard key={proof.id} maxTilt={8} scale={1.03} >
                        <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)', height: '100%' }}>
                          <CardContent className="flex flex-col h-full">
                            <Flex between>
                              {proof.icon && <span style={{ fontSize: '1.5rem' }}>{proof.icon}</span>}
                              <Badge variant="secondary" size="sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                                KPI
                              </Badge>
                            </Flex>
                            <Flex column gap={1} className="mt-4 flex-1 justify-end">
                              <Text level={1} style={{ fontFamily: 'var(--font-geist-mono)', color: accent, lineHeight: 1 }}>
                                {proof.value}
                              </Text>
                              <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {proof.title}
                              </Text>
                            </Flex>
                            <Progress
                              value={Math.min(100, Number(proof.value.replace(/[^0-9.]/g, '')) * 10)}
                              className="mt-4 h-1.5"
                            />
                          </CardContent>
                        </Card>
                      </TiltCard>
                    ))}
                </Grid>
              </section>
            )}

            {/* Links Management Table */}
            <section>
              <Flex between className="mb-4">
                <Heading level={4} style={{ fontFamily: 'var(--font-geist)' }}>
                  Links
                </Heading>
                <Badge variant="outline" className="gap-1" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                  {profile.links.filter((l: any) => l.isVisible).length} active
                </Badge>
              </Flex>
              <Card variant="outlined" padding="none" style={{ borderColor: 'var(--border)' }}>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontFamily: 'var(--font-geist)' }}>
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="px-4 py-3 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Link</th>
                          <th className="px-4 py-3 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Clicks</th>
                          <th className="px-4 py-3 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Status</th>
                          <th className="px-4 py-3 text-left text-xs weight-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.links
                          .filter(l => l.isVisible)
                          .slice(0, 15)
                          .map((link: any, index: number) => (
                            <tr key={link.id} className="border-b transition-colors hover:bg-muted/30" style={{ borderColor: 'var(--border)' }}>
                              <td className="px-4 py-3">
                                <Flex align="center" gap={3}>
                                  <span
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: '8px',
                                      background: accent,
                                      color: 'var(--primary-foreground)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    {link.icon || link.label.charAt(0).toUpperCase()}
                                  </span>
                                  <Flex column gap={0.5}>
                                    <Text weight="medium" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
                                      {link.label}
                                    </Text>
                                    <Text size="xs" color="muted" className="truncate font-mono" style={{ maxWidth: '200px' }}>
                                      {link.url}
                                    </Text>
                                  </Flex>
                                </Flex>
                              </td>
                              <td className="px-4 py-3">
                                <Text weight="medium" size="sm" style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                                  {link.clicks.toLocaleString()}
                                </Text>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="success" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
                                  Active
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onLinkClick?.(link)}>
                                  <span className="h-4 w-4" aria-hidden="true">→</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Proof Points */}
            {profile.proofs.length > 0 && (
              <section>
                <Heading level={4} className="mb-4" style={{ fontFamily: 'var(--font-geist)' }}>
                  Verified Proof Points
                </Heading>
                <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {profile.proofs
                    
                    .slice(0, 10)
                    .map((proof) => (
                      <Card key={proof.id} variant="outlined" padding="lg" style={{ borderColor: accent }}>
                        <CardContent className="flex items-start gap-3">
                          {proof.icon && (
                            <span
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: accent,
                                color: 'var(--primary-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0,
                              }}
                            >
                              {proof.icon}
                            </span>
                          )}
                          <Flex column gap={1} flex={1}>
                            <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
                              {proof.title}
                            </Text>
                            {proof.value && (
                              <Text level={4} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                                {proof.value}
                              </Text>
                            )}
                          </Flex>
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
              </section>
            )}
          </Stack>
        </main>
      </div>
    </div>
  );
}

ProfessionalMaxTemplate.displayName = 'ProfessionalMaxTemplate';