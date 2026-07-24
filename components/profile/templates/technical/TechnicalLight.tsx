'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';

const accentColor = '#22c55e';

export function TechnicalLightTemplate({ profile, accentColor: propAccent, isPreview, onLinkClick }: TemplateProps) {
  const accent = propAccent || accentColor;

  // Simulate syntax-highlighted bio
  const highlightCode = (code: string) => {
    const keywords = ['function', 'const', 'let', 'return', 'if', 'else', 'async', 'await', 'import', 'export', 'class', 'interface', 'type'];
    const strings = code.match(/".*?"/g) || [];
    const comments = code.match(/\/\/.*/g) || [];

    let highlighted = code
      .replace(/\b(function|const|let|return|if|else|async|await|import|export|class|interface|type)\b/g, '<span class="keyword">$1</span>')
      .replace(/(".*?")/g, '<span class="string">$1</span>')
      .replace(/(\/\/.*?$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

    return highlighted;
  };

  return (
    <div
      className="min-w-0 font-mono"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '6px',
        '--profile-shadow': '0 2px 8px 0 oklch(0.12 0.02 247.8 / 0.08)',
        fontFamily: 'var(--font-geist-mono)',
      } as React.CSSProperties}
    >
      <Stack space={8} className="max-w-[800px] mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {/* Terminal Header */}
        <div className="w-full max-w-[720px] mx-auto mb-4">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-t-[6px]">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="bg-zinc-950 border border-zinc-800 border-t-0 rounded-b-[6px] px-4 py-5 font-mono text-sm text-zinc-300 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 30 30 60 0 30Z\' fill=\'none\' stroke=\'%2322c55e\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }} />
            <Stack space={2} className="relative">
              <Flex gap={2} className="flex-wrap">
                <span style={{ color: accent }}>npm</span>
                <span style={{ color: '#a855f7' }}>start</span>
                <span style={{ color: '#f97316' }}>{profile.name.toLowerCase().replace(/\s+/g, '-')}</span>
                <span style={{ color: '#3b82f6' }}>--profile</span>
              </Flex>
              <Flex gap={2} className="flex-wrap">
                <span style={{ color: '#64748b' }}>✓</span>
                <span style={{ color: accent }}>Profile compiled</span>
                <span style={{ color: '#64748b' }}>→</span>
                <span style={{ color: '#a855f7' }}>{profile.links.length} links</span>
                <span style={{ color: '#64748b' }}>,</span>
                <span style={{ color: '#ec4899' }}>{profile.proofs.length} proofs</span>
              </Flex>
            </Stack>
          </div>
        </div>

        {/* Profile Header */}
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

        {/* Syntax-highlighted Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="lg" style={{ borderColor: accent, maxWidth: '720px' }}>
            <CardContent>
              <div className="relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded" style={{ fontFamily: 'var(--font-geist-mono)' }}>bio.txt</span>
                  <span className="px-2 py-0.5 text-xs bg-zinc-800 text-green-400 rounded" style={{ fontFamily: 'var(--font-geist-mono)' }}>utf-8</span>
                </div>
                <pre style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.9375rem', lineHeight: 1.7, marginTop: '1.5rem', whiteSpace: 'pre-wrap' }}>
                  <code style={{ color: 'var(--foreground)' }}>
                    {profile.bio}
                  </code>
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links as REPL output */}
        {profile.links.length > 0 && (
          <Stack space={3} className="w-full max-w-[720px]">
            <Separator style={{ opacity: 0.3, borderColor: accent }} />
            <div className="bg-zinc-950 border border-zinc-800 rounded-[6px] p-4 font-mono text-sm">
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    
                    radius={100}
                    className={cn('w-full my-1', isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '4px',
                      border: '1px solid transparent',
                      background: 'transparent',
                    }}
                  >
                    <button
                      onClick={() => onLinkClick?.(link)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/50 rounded-[4px] transition-colors"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      <span style={{ color: accent }}>
                        {index + 1}.{' '}
                      </span>
                      <span style={{ color: accent, fontWeight: 600 }}>{link.label}</span>
                      <span className="flex-1 text-zinc-500 truncate">{link.url}</span>
                      <span style={{ color: '#64748b' }}>{link.clicks.toLocaleString()}</span>
                      <Badge variant="outline" size="sm" style={{ fontFamily: 'var(--font-geist-mono)', borderColor: accent, color: accent }}>
                        OPEN
                      </Badge>
                    </button>
                  </MagneticCard>
                ))}
            </div>
          </Stack>
        )}

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={2} className="w-full max-w-[720px]">
            <Separator style={{ opacity: 0.3, borderColor: accent }} />
            <div className="bg-zinc-950 border border-zinc-800 rounded-[6px] p-4 font-mono text-sm">
              {profile.proofs
                
                .slice(0, 6)
                .map((proof) => (
                  <div key={proof.id} className="flex items-center gap-3 py-2">
                    <span style={{ color: '#64748b' }}>▸</span>
                    <span style={{ color: accent, fontWeight: 600 }}>{proof.title}</span>
                    {proof.value && <span className="ml-auto text-zinc-400">{proof.value}</span>}
                  </div>
                ))}
            </div>
          </Stack>
        )}
      </Stack>
    </div>
  );
}

TechnicalLightTemplate.displayName = 'TechnicalLightTemplate';