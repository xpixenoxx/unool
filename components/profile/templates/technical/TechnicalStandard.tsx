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
import { Separator } from '@/components/ui/separator';

export function TechnicalStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || '#22c55e';

  return (
    <div
      className="min-w-0"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        '--profile-shadow': '0 4px 16px 0 oklch(0.2 0.1 145 / 0.1), 0 2px 8px -2px oklch(0.2 0.1 145 / 0.1)',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[800px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist-mono)' }}>
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

        {/* GitHub Stats Cards with Tilt */}
        {profile.proofs.length > 0 && (
          <Stack space={4} className="max-w-[800px] mx-auto">
            <Text size="sm" weight="medium" color="muted" className="text-center" style={{ fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GitHub Stats
            </Text>
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
              {profile.proofs
                .filter(p => p.value)
                .slice(0, 6)
                .map((proof) => (
                  <TiltCard key={proof.id} maxTilt={6} scale={1.02} >
                    <Card variant="outlined" padding="lg" style={{ borderColor: accent, height: '100%' }}>
                      <CardContent className="flex flex-col items-center text-center">
                        {proof.icon && <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{proof.icon}</span>}
                        <Text level={1} style={{ fontFamily: 'var(--font-geist-mono)', color: accent, lineHeight: 1 }}>
                          {proof.value}
                        </Text>
                        <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                          {proof.title}
                        </Text>
                      </CardContent>
                    </Card>
                  </TiltCard>
                ))}
            </Grid>
          </Stack>
        )}

        {/* Links */}
        <Separator style={{ opacity: 0.3, borderColor: accent }} />
        <Stack space={3} className="w-full max-w-[800px] mx-auto">
          {profile.links
            .filter(l => l.isVisible)
            .slice(0, 15)
            .map((link, index) => (
              <MagneticCard
                key={link.id}
                
                radius={80}
                className={cn('w-full', isPreview && 'opacity-80')}
                style={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  boxShadow: 'var(--profile-shadow)',
                }}
              >
                <button
                  onClick={() => onLinkClick?.(link)}
                  className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                  style={{
                    borderRadius: '8px',
                    fontFamily: 'var(--font-geist-mono)',
                  }}
                >
                  <Flex align="center" gap={3}>
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '8px',
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
            ))}
        </Stack>

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full max-w-[800px] mx-auto">
            <Separator style={{ opacity: 0.3, borderColor: accent }} />
            {profile.proofs
              
              .slice(0, 6)
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

TechnicalStandardTemplate.displayName = 'TechnicalStandardTemplate';