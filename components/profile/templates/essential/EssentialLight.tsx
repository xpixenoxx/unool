'use client';

import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text } from '@/components/ui/typography';
import { Flex, Box, Stack } from '@/components/ui/layout';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import { Separator } from '@/components/ui/separator';

export function EssentialLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '6px',
        '--profile-shadow': '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08)',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[640px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist)' }}>
        <Stack space={4} align="center" className="text-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
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
        </Stack>

        {profile.bio && (
          <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)', maxWidth: '640px' }}>
            <CardContent>
              <Text size="base" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {profile.links.length > 0 && (
          <Stack space={3} className="w-full max-w-[640px]">
            <Separator style={{ opacity: 0.3 }} />
            {profile.links
              .filter(l => l.isVisible)
              .slice(0, 12)
              .map((link, index) => (
                <MagneticCard
                  key={link.id}
                  
                  radius={80}
                  className={cn(
                    'w-full',
                    isPreview && 'opacity-80'
                  )}
                  style={{
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                  }}
                >
                  <button
                    onClick={() => onLinkClick?.(link)}
                    className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                    style={{
                      borderRadius: '6px',
                      fontFamily: 'var(--font-geist)',
                    }}
                  >
                    <Flex align="center" gap={3}>
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '6px',
                          background: accent,
                          color: 'var(--primary-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '1rem',
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
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: accent,
                          fontFamily: 'var(--font-geist-mono)',
                        }}
                      >
                        {link.clicks.toLocaleString()}
                      </span>
                    </Flex>
                  </button>
                </MagneticCard>
              ))}
          </Stack>
        )}

        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full max-w-[640px]">
            <Separator style={{ opacity: 0.3 }} />
            {profile.proofs
              
              .slice(0, 4)
              .map((proof) => (
                <Card key={proof.id} variant="filled" padding="md" style={{ maxWidth: '640px' }}>
                  <CardContent className="flex items-center gap-3">
                    {proof.icon && (
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '6px',
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

EssentialLightTemplate.displayName = 'EssentialLightTemplate';