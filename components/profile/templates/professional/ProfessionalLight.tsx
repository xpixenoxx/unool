'use client';

import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';

export function ProfessionalLightTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        '--profile-shadow': '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 4px 6px -2px oklch(0.12 0.02 247.8 / 0.05)',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[900px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header: Avatar + Name + Company badges row */}
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

          {/* Company/Org badge row */}
          {profile.proofs.length > 0 && (
            <Flex gap={2} className="flex-wrap justify-center" style={{ marginTop: '0.5rem' }}>
              {profile.proofs
                
                .slice(0, 6)
                .map((proof) => (
                  <Badge key={proof.id} variant="outline" className="gap-1.5 px-3 py-1.5" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.8125rem' }}>
                    {proof.icon && <span style={{ fontSize: '1rem' }}>{proof.icon}</span>}
                    {proof.title}
                  </Badge>
                ))}
            </Flex>
          )}
        </Stack>

        {/* Two column: Bio | Links */}
        <Grid cols={{ base: 1, lg: 2 }} gap={8} className="items-start">
          {/* Bio */}
          <Stack space={6}>
            {profile.bio && (
              <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)' }}>
                <CardContent>
                  <Text size="base" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)' }}>
                    {profile.bio}
                  </Text>
                </CardContent>
              </Card>
            )}

            {/* Metrics strip - 3 KPIs */}
            {profile.proofs.length > 0 && (
              <Card variant="filled" padding="lg" style={{ borderColor: 'var(--border)' }}>
                <CardContent>
                  <Flex between className="flex-wrap gap-4">
                    {profile.proofs
                      .filter(p => p.value)
                      .slice(0, 3)
                      .map((proof) => (
                        <Flex key={proof.id} column gap={1} align="center" className="flex-1 min-w-[100px]">
                          {proof.icon && <span style={{ fontSize: '1.5rem' }}>{proof.icon}</span>}
                          <div>
                            <Text level={3} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                              {proof.value}
                            </Text>
                            <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {proof.title}
                            </Text>
                          </div>
                        </Flex>
                      ))}
                  </Flex>
                </CardContent>
              </Card>
            )}
          </Stack>

          {/* Links column */}
          <Stack space={3} className="w-full">
            {profile.links.length > 0 && (
              <>
                <Text size="sm" weight="medium" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Links
                </Text>
                <Stack space={3}>
                  {profile.links
                    .filter(l => l.isVisible)
                    .slice(0, 15)
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
                            <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                              {link.clicks.toLocaleString()}
                            </Text>
                          </Flex>
                        </button>
                      </Card>
                    ))}
                </Stack>
              </>
            )}
          </Stack>
        </Grid>
      </Stack>
    </div>
  );
}

ProfessionalLightTemplate.displayName = 'ProfessionalLightTemplate';