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
import { ParallaxLayers, ParallaxLayer } from '@/components/ui/3d/ParallaxLayers';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { Separator } from '@/components/ui/separator';

export function SocialStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  // Mock social posts
  const mockPosts = [
    { id: '1', content: 'Just shipped the new profile template system! 🚀 25+ templates across 5 categories. The 3D orbital backgrounds are my favorite.', time: '2h ago', likes: 234, replies: 18, reposts: 42, media: null },
    { id: '2', content: 'Working on something exciting for creators. Magnetic hover effects + tilt cards = 🤯', time: '1d ago', likes: 512, replies: 34, reposts: 89, media: 'https://picsum.photos/600/400' },
    { id: '3', content: 'The new design tokens in OKLCH are a game changer. Perceptual uniformity for the win! 🎨', time: '3d ago', likes: 189, replies: 12, reposts: 28, media: null },
  ];

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        '--profile-shadow': '0 8px 32px 0 oklch(0.12 0.02 247.8 / 0.1), 0 4px 16px -4px oklch(0.12 0.02 247.8 / 0.1)',
      } as React.CSSProperties}
    >
      <ParallaxLayers
        containerClassName="absolute inset-0 -z-10"
        layers={[
          {
            depth: 0.1,
            className: "absolute inset-0",
            children: <OrbitalBackground count={8} speed={0.2} colors={[accent]} className="opacity-25" />,
          },
        ]}
        mouseStrength={15}
        scrollStrength={30}
      />

      <Stack space={8} className="max-w-[600px] mx-auto px-4 py-12 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header */}
        <Stack space={3} align="center" className="text-center">
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
          <Flex gap={4} className="justify-center mt-2">
            <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              {profile.links.filter((l: any) => l.isVisible).length} Links
            </Text>
            <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              1.2K Followers
            </Text>
            <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              342 Following
            </Text>
          </Flex>
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

        {/* Feed Posts */}
        <Stack space={4} className="w-full">
          <Separator style={{ opacity: 0.2 }} />
          {mockPosts.map((post) => (
            <Card key={post.id} variant="outlined" padding="lg" style={{ borderColor: 'var(--border)' }}>
              <CardContent className="space-y-4">
                {/* Post Header */}
                <Flex align="center" gap={3}>
                  <Avatar className="h-10 w-10" style={{ borderColor: accent }}>
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                    <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Flex column gap={0.5} flex={1}>
                    <Text weight="medium" style={{ fontFamily: 'var(--font-geist)' }}>{profile.name}</Text>
                    <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>{post.time}</Text>
                  </Flex>
                </Flex>

                {/* Post Content */}
                <Text size="base" color="foreground" style={{ lineHeight: 1.6, fontFamily: 'var(--font-geist)' }}>
                  {post.content}
                </Text>

                {/* Media */}
                {post.media && (
                  <img src={post.media} alt="" className="w-full rounded-lg" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
                )}

                {/* Engagement */}
                <Flex between className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Flex gap={4}>
                    <button className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {post.replies}
                    </button>
                    <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      {post.reposts}
                    </button>
                  </Flex>
                  <Badge variant="outline" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
                    Share
                  </Badge>
                </Flex>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Links Section */}
        <Separator style={{ opacity: 0.2 }} />
        <Stack space={3} className="w-full">
          {profile.links
            .filter(l => l.isVisible)
            .slice(0, 25)
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
      </Stack>
    </div>
  );
}

SocialStandardTemplate.displayName = 'SocialStandardTemplate';