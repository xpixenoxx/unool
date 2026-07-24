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
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { Separator } from '@/components/ui/separator';

export function CreativeLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        '--profile-shadow': '0 4px 16px 0 oklch(0.12 0.02 247.8 / 0.08)',
      } as React.CSSProperties}
    >
      {/* Floating Blobs Background */}
      <OrbitalBackground
        className="absolute inset-0 -z-10 opacity-40"
        count={8}
        speed={0.3}
        colors={[accent]}
      />

      <Stack space={8} className="max-w-[720px] mx-auto px-4 py-16 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header */}
        <Stack space={4} align="center" className="text-center">
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2.5rem' }}>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <Stack space={1}>
            <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text level={3} color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist)' }}>
                {profile.headline}
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="xl" style={{ borderColor: 'var(--border)', maxWidth: '640px', margin: '0 auto' }}>
            <CardContent>
              <Text level={4} color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.25rem', textAlign: 'center' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Links as floating cards */}
        {profile.links.length > 0 && (
          <Stack space={4} className="w-full max-w-[640px] mx-auto">
            <Separator style={{ opacity: 0.2 }} />
            {profile.links
              .filter(l => l.isVisible)
              .slice(0, 12)
              .map((link, index) => (
                <MagneticCard
                  key={link.id}
                  
                  radius={100}
                  className={cn(
                    'w-full',
                    isPreview && 'opacity-80'
                  )}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    boxShadow: 'var(--profile-shadow)',
                  }}
                >
                  <button
                    onClick={() => onLinkClick?.(link)}
                    className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-all duration-200"
                    style={{
                      borderRadius: '12px',
                      fontFamily: 'var(--font-geist)',
                    }}
                  >
                    <Flex align="center" gap={3}>
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                          color: 'var(--primary-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '1.125rem',
                          fontFamily: 'var(--font-syne)',
                          boxShadow: `0 4px 12px -2px ${accent}40`,
                        }}
                      >
                        {link.icon || link.label.charAt(0).toUpperCase()}
                      </span>
                      <Flex column gap={1} flex={1} className="min-w-0">
                        <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-syne)', fontWeight: 500 }}>
                          {link.label}
                        </Text>
                        <Text size="xs" color="muted" className="truncate font-mono">
                          {link.url}
                        </Text>
                      </Flex>
                    </Flex>
                  </button>
                </MagneticCard>
              ))}
          </Stack>
        )}

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full max-w-[640px] mx-auto">
            <Separator style={{ opacity: 0.2 }} />
            {profile.proofs
              
              .slice(0, 4)
              .map((proof) => (
                <Card key={proof.id} variant="filled" padding="md" style={{ maxWidth: '640px', margin: '0 auto' }}>
                  <CardContent className="flex items-center gap-3">
                    {proof.icon && (
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
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
                      <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-syne)' }}>
                        {proof.title}
                      </Text>
                      {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>{proof.value}</Text>}
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

CreativeLightTemplate.displayName = 'CreativeLightTemplate';