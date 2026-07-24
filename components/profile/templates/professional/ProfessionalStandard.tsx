'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import TiltCard from '@/components/ui/3d/TiltCard';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';

export function ProfessionalStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '10px',
        '--profile-shadow': '0 4px 12px 0 oklch(0.12 0.02 247.8 / 0.1), 0 2px 8px -2px oklch(0.12 0.02 247.8 / 0.08)',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[900px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header */}
        <Stack space={4} align="center" className="text-center">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <Stack space={1}>
            <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-geist)' }}>
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text level={4} color="muted" weight="medium">
                {profile.headline}
              </Text>
            )}
          </Stack>

          {/* Company badges */}
          {profile.proofs.length > 0 && (
            <Flex gap={2} className="flex-wrap justify-center" style={{ marginTop: '0.5rem' }}>
              {profile.proofs
                
                .slice(0, 4)
                .map((proof) => (
                  <Badge key={proof.id} variant="default" className="gap-1.5 px-3 py-1.5" style={{ fontFamily: 'var(--font-geist)', background: accent }}>
                    {proof.icon && <span style={{ fontSize: '1rem' }}>{proof.icon}</span>}
                    {proof.title}
                  </Badge>
                ))}
            </Flex>
          )}
        </Stack>

        {/* Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)', maxWidth: '720px', margin: '0 auto' }}>
            <CardContent>
              <Text size="base" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)', textAlign: 'center' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Metrics Strip with Tilt Cards */}
        {profile.proofs.length > 0 && (
          <Stack space={4} className="max-w-[900px] mx-auto">
            <Text size="sm" weight="medium" color="muted" className="text-center" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Key Metrics
            </Text>
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
              {profile.proofs
                .filter(p => p.value)
                .slice(0, 6)
                .map((proof) => (
                  <TiltCard
                    key={proof.id}
                    maxTilt={5}
                    scale={1.02}
                    
                    className="h-full"
                    style={{
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                    }}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[120px] text-center">
                      {proof.icon && <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{proof.icon}</span>}
                      <Text level={1} style={{ fontFamily: 'var(--font-geist-mono)', color: accent, lineHeight: 1 }}>
                        {proof.value}
                      </Text>
                      <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                        {proof.title}
                      </Text>
                    </CardContent>
                  </TiltCard>
                ))}
            </Grid>
          </Stack>
        )}

        {/* Links */}
        <Separator style={{ opacity: 0.3, maxWidth: '900px', margin: '0 auto' }} />
        <Stack space={3} className="w-full max-w-[900px] mx-auto">
          {profile.links
            .filter(l => l.isVisible)
            .slice(0, 15)
            .map((link, index) => (
              <MagneticCard
                key={link.id}
                
                radius={80}
                className={cn(
                  'w-full',
                  isPreview && 'opacity-80'
                )}
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
                    fontFamily: 'var(--font-geist)',
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
                      }}
                    >
                      {link.icon || link.label.charAt(0).toUpperCase()}
                    </span>
                    <Flex column gap={1} flex={1} className="min-w-0">
                      <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-geist)' }}>
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
                      <Badge variant="outline" size="sm" style={{ fontSize: '0.625rem' }}>
                        {index + 1}
                      </Badge>
                    </Flex>
                  </Flex>
                </button>
              </MagneticCard>
            ))}
        </Stack>

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={3} className="w-full max-w-[900px] mx-auto">
            <Separator style={{ opacity: 0.3 }} />
            {profile.proofs
              
              .slice(0, 6)
              .map((proof) => (
                <Card key={proof.id} variant="outlined" padding="md" style={{ maxWidth: '900px', borderColor: accent }}>
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
                      <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
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

ProfessionalStandardTemplate.displayName = 'ProfessionalStandardTemplate';