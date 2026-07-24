'use client';

import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';

export function TechnicalMinimalTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || '#22c55e'; // Green terminal accent

  return (
    <div
      className="min-w-0 font-mono"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '4px',
        '--profile-shadow': 'none',
        fontFamily: 'var(--font-geist-mono)',
      } as React.CSSProperties}
    >
      <Stack space={6} className="max-w-[720px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {/* Terminal Header */}
        <div className="w-full max-w-[720px] mx-auto mb-8">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-t-[4px]">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 border-t-0 rounded-b-[4px] px-3 py-4 font-mono text-sm text-zinc-300">
            <span className="text-green-400">$</span><span className="text-zinc-500 ml-1"> whoami</span>
            <br />
            <span className="text-zinc-200">{profile.name}</span>
            <br />
            <span className="text-green-400">$</span><span className="text-zinc-500 ml-1"> cat headline.txt</span>
            <br />
            <span className="text-zinc-400">{profile.headline || 'No headline set'}</span>
          </div>
        </div>

        {/* Avatar + Name in terminal style */}
        <Stack space={3} align="center" className="text-center">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2" style={{ borderColor: accent }}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>
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
          <Card variant="outlined" padding="lg" style={{ borderColor: accent, maxWidth: '720px' }}>
            <CardContent>
              <Text size="base" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist-mono)', fontSize: '0.9375rem' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Links as terminal lines */}
        {profile.links.length > 0 && (
          <Stack space={2} className="w-full max-w-[720px]">
            <Separator style={{ opacity: 0.3, borderColor: accent }} />
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[4px] p-4 font-mono text-sm">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => (
                  <button
                    key={link.id}
                    onClick={() => onLinkClick?.(link)}
                    className="w-full flex items-center gap-3 px-2 py-2 hover:bg-zinc-800/50 rounded-[2px] transition-colors"
                    style={{
                      fontFamily: 'var(--font-geist-mono)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <span style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>
                      {'▸'}
                    </span>
                    <span style={{ color: accent }}>{link.label}</span>
                    <span className="flex-1 text-zinc-500 truncate" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                      {link.url}
                    </span>
                    <span style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>
                      {link.clicks.toLocaleString()}
                    </span>
                    <span className="px-1.5 py-0.5 text-[0.625rem] border" style={{ borderColor: accent, color: accent, fontFamily: 'var(--font-geist-mono)' }}>
                      {index + 1}
                    </span>
                  </button>
                ))}
            </div>
          </Stack>
        )}

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full max-w-[720px]">
            <Separator style={{ opacity: 0.3, borderColor: accent }} />
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[4px] p-4 font-mono text-sm">
              {profile.proofs
                
                .slice(0, 5)
                .map((proof) => (
                  <div key={proof.id} className="flex items-center gap-3 py-2">
                    <span style={{ color: accent }}>#[proof.id]</span>
                    <span style={{ color: accent, fontWeight: 600 }}>{proof.title}</span>
                    {proof.value && <span className="text-zinc-400 ml-auto">{proof.value}</span>}
                  </div>
                ))}
            </div>
          </Stack>
        )}
      </Stack>
    </div>
  );
}

TechnicalMinimalTemplate.displayName = 'TechnicalMinimalTemplate';