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
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { Separator } from '@/components/ui/separator';

export function SocialLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  // Mock followers for avatar stack
  const followers = [
    { name: 'Alex Chen', avatar: '' },
    { name: 'Sam Taylor', avatar: '' },
    { name: 'Jordan Kim', avatar: '' },
    { name: 'Casey Park', avatar: '' },
    { name: 'Morgan Lee', avatar: '' },
  ];

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        '--profile-shadow': '0 4px 16px 0 oklch(0.12 0.02 247.8 / 0.08)',
      } as React.CSSProperties}
    >
      <OrbitalBackground className="absolute inset-0 -z-10 opacity-20" count={6} speed={0.25} colors={[accent]}  />

      <Stack space={8} className="max-w-[500px] mx-auto px-4 py-12 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header with Avatar Stack */}
        <Stack space={4} align="center" className="text-center">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          {/* Follower avatar stack with ring pulse */}
          <div className="flex items-center justify-center -space-x-2">
            {followers.map((follower, i) => (
              <div key={i} className="relative">
                <Avatar className="h-10 w-10 ring-2" ringColor='var(--background)'>
                  <AvatarFallback style={{ fontSize: '0.75rem' }}>{follower.name.charAt(0)}</AvatarFallback>
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2" style={{ background: accent, borderColor: 'var(--background)', animation: `pulse 2s ease-in-out infinite ${i * 0.2}s` }} />
                </Avatar>
              </div>
            ))}
            <Badge variant="outline" className="h-10 w-10 flex items-center justify-center text-xs" style={{ fontFamily: 'var(--font-geist)' }}>
              +128
            </Badge>
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
        </Stack>

        {/* Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)' }}>
            <CardContent>
              <Text size="base" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)', textAlign: 'center' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Links as Magnetic Cards */}
        {profile.links.length > 0 && (
          <Stack space={3} className="w-full">
            <Separator style={{ opacity: 0.2 }} />
            {profile.links
              .filter(l => l.isVisible)
              .slice(0, 20)
              .map((link, index) => (
                <MagneticCard
                  key={link.id}
                  
                  radius={80}
                  className={cn('w-full', isPreview && 'opacity-80')}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                  }}
                >
                  <button
                    onClick={() => onLinkClick?.(link)}
                    className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                    style={{ borderRadius: '12px', fontFamily: 'var(--font-geist)' }}
                  >
                    <Flex align="center" gap={3}>
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
                      <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                        {link.clicks.toLocaleString()}
                      </Text>
                    </Flex>
                  </button>
                </MagneticCard>
              ))}
          </Stack>
        )}

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full">
            <Separator style={{ opacity: 0.2 }} />
            <Flex gap={2} className="flex-wrap justify-center">
              {profile.proofs
                
                .slice(0, 3)
                .map((proof) => (
                  <Badge key={proof.id} variant="outline" className="gap-1.5 px-3 py-1.5" style={{ fontFamily: 'var(--font-geist)', borderColor: accent }}>
                    {proof.icon && <span style={{ fontSize: '1rem' }}>{proof.icon}</span>}
                    {proof.title}
                    {proof.value && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>{proof.value}</Text>}
                  </Badge>
                ))}
            </Flex>
          </Stack>
        )}
      </Stack>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

SocialLightTemplate.displayName = 'SocialLightTemplate';