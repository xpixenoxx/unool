'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import TiltCard from '@/components/ui/3d/TiltCard';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { Separator } from '@/components/ui/separator';

export function TechnicalBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || '#22c55e';

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '10px',
        '--profile-shadow': '0 8px 32px 0 oklch(0.2 0.1 145 / 0.12), 0 4px 16px -4px oklch(0.2 0.1 145 / 0.12)',
      } as React.CSSProperties}
    >
      <OrbitalBackground className="absolute inset-0 -z-10 opacity-15" count={8} speed={0.25} colors={[accent]}  />

      <Stack space={8} className="max-w-[900px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {/* Header */}
        <Stack space={3} align="center" className="text-center">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4" style={{ borderColor: accent }}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 700, fontSize: '2rem' }}>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <Stack space={1} align="center">
            <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-geist-mono)', letterSpacing: '-0.02em' }}>
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text level={4} color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                {profile.headline}
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="lg" style={{ borderColor: accent, maxWidth: '720px', margin: '0 auto' }}>
            <CardContent>
              <pre style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.9375rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                <code style={{ color: 'var(--foreground)' }}>{profile.bio}</code>
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Live Commit Ticker */}
        <Stack space={4} className="max-w-[900px] mx-auto">
          <Text size="sm" weight="medium" color="muted" className="text-center" style={{ fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Activity Feed
          </Text>
          <div className="bg-zinc-950 border rounded-[8px] p-4 font-mono text-sm" style={{ borderColor: accent, fontFamily: 'var(--font-geist-mono)' }}>
            <div className="space-y-2">
              {[
                { hash: 'a1b2c3d', msg: `feat: update ${profile.name.toLowerCase().replace(/\s+/g, '-')}.profile.ts`, time: '2m ago' },
                { hash: 'e4f5g6h', msg: 'chore: add new links configuration', time: '15m ago' },
                { hash: 'i7j8k9l', msg: 'fix: resolve type definitions for proofs', time: '1h ago' },
                { hash: 'm0n1o2p', msg: 'docs: update readme with new template', time: '3h ago' },
                { hash: 'q3r4s5t', msg: 'refactor: optimize magnetic hover animations', time: '1d ago' },
              ].map((commit, i) => (
                <div key={commit.hash} className="flex items-center gap-3 py-1" style={{ borderLeft: `2px solid ${i % 2 === 0 ? accent : '#64748b'}`, paddingLeft: '0.75rem' }}>
                  <span style={{ color: accent, fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem' }}>{commit.hash}</span>
                  <span className="flex-1 truncate" style={{ color: 'var(--foreground)' }}>{commit.msg}</span>
                  <span style={{ color: '#64748b', fontFamily: 'var(--font-geist-mono)' }}>{commit.time}</span>
                </div>
              ))}
            </div>
          </div>
        </Stack>

        {/* Links */}
        <Separator style={{ opacity: 0.3, borderColor: accent }} />
        <Stack space={3} className="w-full max-w-[900px] mx-auto">
          {profile.links
            .filter(l => l.isVisible)
            .slice(0, 20)
            .map((link, index) => (
              <TiltCard key={link.id} maxTilt={5} scale={1.02} >
                <MagneticCard
                  
                  radius={80}
                  className={cn('w-full', isPreview && 'opacity-80')}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    boxShadow: 'var(--profile-shadow)',
                  }}
                >
                  <button
                    onClick={() => onLinkClick?.(link)}
                    className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                    style={{
                      borderRadius: '10px',
                      fontFamily: 'var(--font-geist-mono)',
                    }}
                  >
                    <Flex align="center" gap={3}>
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '10px',
                          background: accent,
                          color: 'var(--primary-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '1.125rem',
                          fontFamily: 'var(--font-geist-mono)',
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
                      <Flex align="center" gap={3}>
                        <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                          {link.clicks.toLocaleString()}
                        </Text>
                        <Badge variant="outline" size="sm" style={{ fontSize: '0.625rem', fontFamily: 'var(--font-geist-mono)' }}>
                          #{index + 1}
                        </Badge>
                      </Flex>
                    </Flex>
                  </button>
                </MagneticCard>
              </TiltCard>
            ))}
        </Stack>

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full max-w-[900px] mx-auto">
            <Separator style={{ opacity: 0.3, borderColor: accent }} />
            {profile.proofs
              
              .slice(0, 8)
              .map((proof) => (
                <Card key={proof.id} variant="outlined" padding="md" style={{ borderColor: accent }}>
                  <CardContent className="flex items-center gap-3">
                    {proof.icon && (
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
                        }}
                      >
                        {proof.icon}
                      </span>
                    )}
                    <Flex column gap={0.5} flex={1}>
                      <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                        {proof.title}
                      </Text>
                      {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>{proof.value}</Text>}
                    </Flex>
                  </CardContent>
                </Card>
              ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
}

TechnicalBoldTemplate.displayName = 'TechnicalBoldTemplate';