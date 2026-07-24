'use client';

import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';

export function ProfessionalMinimalTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        '--profile-shadow': '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08)',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[900px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Two-column layout: Info | Links */}
        <Grid cols={{ base: 1, lg: 2 }} gap={8} className="items-start">
          {/* Left: Profile Info */}
          <Stack space={6} className="lg:pr-8 border-r lg:border-r-0 lg:border-l-0 border-border/50">
            <Stack space={4} align="center" className="lg:items-start text-center lg:text-left">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <Stack space={1} align="center" className="lg:items-start">
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
              <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)' }}>
                <CardContent>
                  <Text size="base" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)' }}>
                    {profile.bio}
                  </Text>
                </CardContent>
              </Card>
            )}

            {/* Company badges row */}
            {profile.proofs.length > 0 && (
              <Stack space={3}>
                <Text size="sm" weight="medium" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Organizations
                </Text>
                <Flex gap={2} className="flex-wrap">
                  {profile.proofs
                    
                    .slice(0, 6)
                    .map((proof) => (
                      <Badge key={proof.id} variant="outline" className="gap-1.5" style={{ fontFamily: 'var(--font-geist)' }}>
                        {proof.icon && <span style={{ fontSize: '1rem' }}>{proof.icon}</span>}
                        {proof.title}
                      </Badge>
                    ))}
                </Flex>
              </Stack>
            )}
          </Stack>

          {/* Right: Links */}
          <Stack space={4} className="w-full">
            {profile.links.length > 0 && (
              <Stack space={3}>
                {profile.links
                  .filter(l => l.isVisible)
                  .slice(0, 12)
                  .map((link, index) => (
                    <Card
                      key={link.id}
                      variant="outlined"
                      padding="none"
                      className={cn(
                        'overflow-hidden transition-colors',
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
                        className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-colors"
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
                        </Flex>
                      </button>
                    </Card>
                  ))}
              </Stack>
            )}
          </Stack>
        </Grid>
      </Stack>
    </div>
  );
}

ProfessionalMinimalTemplate.displayName = 'ProfessionalMinimalTemplate';