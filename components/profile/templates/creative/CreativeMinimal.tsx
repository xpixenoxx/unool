'use client';

import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';

export function CreativeMinimalTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        '--profile-shadow': 'none',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[720px] mx-auto px-4 py-16" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Asymmetric Grid Layout */}
        <Grid cols={{ base: 1, lg: 4 }} gap={6} className="items-start">
          {/* Left Column: Avatar + Name - spans 1 col */}
          <div className="lg:col-span-1">
            <Stack space={4} align="start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2rem' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Stack space={1} align="start">
                <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  {profile.name}
                </Heading>
                {profile.headline && (
                  <Text level={4} color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist)' }}>
                    {profile.headline}
                  </Text>
                )}
              </Stack>
            </Stack>
          </div>

          {/* Right Column: Bio + Links - spans 3 cols */}
          <div className="lg:col-span-3 space-y-8">
            {/* Bio */}
            {profile.bio && (
              <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)' }}>
                <CardContent>
                  <Text size="base" color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.125rem' }}>
                    {profile.bio}
                  </Text>
                </CardContent>
              </Card>
            )}

            {/* Links as asymmetric cards */}
            {profile.links.length > 0 && (
              <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
                {profile.links
                  .filter(l => l.isVisible)
                  .slice(0, 10)
                  .map((link, index) => (
                    <Card
                      key={link.id}
                      variant="outlined"
                      padding="md"
                      className={cn(
                        'transition-all hover:border-primary/50',
                        isPreview && 'opacity-80'
                      )}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                      }}
                    >
                      <button
                        onClick={() => onLinkClick?.(link)}
                        className="w-full text-left hover:bg-primary/5 transition-colors rounded-lg p-2"
                        style={{
                          fontFamily: 'var(--font-geist)',
                        }}
                      >
                        <Flex align="center" gap={3}>
                          <span
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '8px',
                              background: accent,
                              color: 'var(--primary-foreground)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '1rem',
                              fontFamily: 'var(--font-syne)',
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
                    </Card>
                  ))}
              </Grid>
            )}
          </div>
        </Grid>

        {/* Proofs at bottom */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <Text size="sm" weight="medium" color="muted" style={{ fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Proof Points
            </Text>
            <Flex gap={3} className="flex-wrap">
              {profile.proofs
                
                .slice(0, 3)
                .map((proof) => (
                  <Badge key={proof.id} variant="outline" className="gap-1.5 px-3 py-1.5" style={{ fontFamily: 'var(--font-syne)', fontWeight: 500 }}>
                    {proof.icon && <span style={{ fontSize: '1.125rem' }}>{proof.icon}</span>}
                    {proof.title}
                    {proof.value && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>{proof.value}</Text>}
                  </Badge>
                ))}
            </Flex>
          </Stack>
        )}
      </Stack>
    </div>
  );
}

CreativeMinimalTemplate.displayName = 'CreativeMinimalTemplate';