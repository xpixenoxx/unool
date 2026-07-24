'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack } from '@/components/ui/layout';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import { Separator } from '@/components/ui/separator';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';

export function EssentialMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        '--profile-shadow': '0 8px 32px 0 oklch(0.12 0.02 247.8 / 0.15), 0 4px 16px -4px oklch(0.12 0.02 247.8 / 0.15)',
      } as React.CSSProperties}
    >
      {/* Orbital Background */}
      <OrbitalBackground
        className="absolute inset-0 -z-10 opacity-60"
        count={12}
        speed={0.4}
        colors={[accent]}
        
      />

      <Stack space={8} className="max-w-[720px] mx-auto px-4 py-12 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Avatar + Name */}
        <Stack space={4} align="center" className="text-center">
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback style={{ fontSize: '3rem' }}>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2"
              style={{
                background: accent,
                borderColor: 'var(--background)',
              }}
              aria-label="Active"
            />
          </div>
          <Stack space={1}>
            <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-geist)', letterSpacing: '-0.02em' }}>
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text level={3} color="muted" weight="medium">
                {profile.headline}
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Bio with glow effect */}
        {profile.bio && (
          <Card variant="outlined" padding="lg" style={{ borderColor: accent, maxWidth: '720px', boxShadow: 'var(--profile-shadow)' }}>
            <CardContent>
              <Text level={4} color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)', textAlign: 'center' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Links */}
        {profile.links.length > 0 && (
          <Stack space={4} className="w-full max-w-[720px]">
            <Separator style={{ opacity: 0.3 }} />
            {profile.links
              .filter(l => l.isVisible)
              .slice(0, 20)
              .map((link, index) => (
                <MagneticCard
                  key={link.id}
                  
                  radius={50}
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
                    className="w-full px-6 py-5 text-left hover:bg-primary/5 transition-all duration-200"
                    style={{
                      borderRadius: '12px',
                      fontFamily: 'var(--font-geist)',
                    }}
                  >
                    <Flex align="center" gap={4}>
                      <span
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: accent,
                          color: 'var(--primary-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '1.25rem',
                          boxShadow: `0 4px 12px -2px ${accent}40`,
                        }}
                      >
                        {link.icon || link.label.charAt(0).toUpperCase()}
                      </span>
                      <Flex column gap={1} flex={1} className="min-w-0">
                        <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-geist)', fontSize: '1.125rem' }}>
                          {link.label}
                        </Text>
                        <Text size="sm" color="muted" className="truncate font-mono">
                          {link.url}
                        </Text>
                      </Flex>
                      <Flex align="center" gap={3}>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            color: accent,
                            fontFamily: 'var(--font-geist-mono)',
                            fontWeight: 500,
                          }}
                        >
                          {link.clicks.toLocaleString()}
                        </span>
                        <Badge variant="outline" size="sm" style={{ fontSize: '0.6875rem' }}>
                          {index + 1}
                        </Badge>
                      </Flex>
                    </Flex>
                  </button>
                </MagneticCard>
              ))}
          </Stack>
        )}

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={3} className="w-full max-w-[720px]">
            <Separator style={{ opacity: 0.3 }} />
            {profile.proofs
              
              .slice(0, 8)
              .map((proof) => (
                <Card key={proof.id} variant="outlined" padding="lg" style={{ maxWidth: '720px', borderColor: accent, boxShadow: 'var(--profile-shadow)' }}>
                  <CardContent className="flex items-center gap-4">
                    {proof.icon && (
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          background: accent,
                          color: 'var(--primary-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                        }}
                      >
                        {proof.icon}
                      </span>
                    )}
                    <Flex column gap={0.5} flex={1}>
                      <Text weight="semibold" size="base" style={{ fontFamily: 'var(--font-geist)' }}>
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

EssentialMaxTemplate.displayName = 'EssentialMaxTemplate';