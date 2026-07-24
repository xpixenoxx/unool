'use client';

import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';

export function SocialMinimalTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  return (
    <div
      className="min-w-0"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '9999px',
        '--profile-shadow': 'none',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[400px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Centered Avatar + Name */}
        <Stack space={3} align="center" className="text-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Stack space={1}>
            <Heading as="h1" level={2} style={{ fontFamily: 'var(--font-geist)' }}>
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
          <Text size="base" color="muted" style={{ lineHeight: 1.6, fontFamily: 'var(--font-geist)', textAlign: 'center', maxWidth: '320px' }}>
            {profile.bio}
          </Text>
        )}

        {/* Links as Pills */}
        {profile.links.length > 0 && (
          <Stack space={2} className="w-full" style={{ maxWidth: '320px' }}>
            {profile.links
              .filter(l => l.isVisible)
              .slice(0, 20)
              .map((link) => (
                <button
                  key={link.id}
                  onClick={() => onLinkClick?.(link)}
                  className="w-full px-5 py-3 text-left hover:bg-accent/50 transition-colors"
                  style={{
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    fontFamily: 'var(--font-geist)',
                  }}
                >
                  <Flex align="center" gap={3}>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '9999px',
                        background: accent,
                        color: 'var(--primary-foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem',
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
                    <Text size="xs" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)' }}>
                      {link.clicks.toLocaleString()}
                    </Text>
                  </Flex>
                </button>
              ))}
          </Stack>
        )}

        {/* Proofs minimal */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full">
            <Separator style={{ opacity: 0.2 }} />
            <Flex gap={2} className="flex-wrap justify-center">
              {profile.proofs
                
                .slice(0, 2)
                .map((proof) => (
                  <Badge key={proof.id} variant="outline" className="gap-1.5" style={{ fontFamily: 'var(--font-geist)' }}>
                    {proof.icon && <span>{proof.icon}</span>}
                    {proof.title}
                  </Badge>
                ))}
            </Flex>
          </Stack>
        )}
      </Stack>
    </div>
  );
}

SocialMinimalTemplate.displayName = 'SocialMinimalTemplate';