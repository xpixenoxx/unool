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
import { ParallaxLayers, ParallaxLayer } from '@/components/ui/3d/ParallaxLayers';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { Separator } from '@/components/ui/separator';

export function SocialBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  const mockPosts = [
    { id: '1', content: 'Just launched the most comprehensive link-in-bio platform with 25+ animated templates! 🎉 Full 3D orbital backgrounds, magnetic hover cards, and real-time analytics.', time: '2h ago', likes: 1234, replies: 89, reposts: 234, media: null },
    { id: '2', content: 'The new OKLCH design tokens are a game changer. Perceptual uniformity across all 5 profile themes. No more guessing games with color contrast.', time: '1d ago', likes: 2156, replies: 134, reposts: 412, media: 'https://picsum.photos/seed/social1/800/500' },
    { id: '3', content: 'MagneticCard + TiltCard = pure magic ✨ The cursor attraction with 3D rotation makes every interaction feel alive.', time: '3d ago', likes: 892, replies: 56, reposts: 178, media: null },
    { id: '4', content: 'Thinking in systems, not pages. The new template registry with 25 templates across Essential, Professional, Creative, Technical, and Social categories.', time: '5d ago', likes: 645, replies: 41, reposts: 123, media: 'https://picsum.photos/seed/social2/800/500' },
  ];

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '16px',
        '--profile-shadow': '0 12px 48px 0 oklch(0.12 0.02 247.8 / 0.15), 0 8px 24px -6px oklch(0.12 0.02 247.8 / 0.15)',
      } as React.CSSProperties}
    >
      <ParallaxLayers
        containerClassName="absolute inset-0 -z-10"
        layers={[
          {
            depth: 0.15,
            className: "absolute inset-0",
            children: <OrbitalBackground count={10} speed={0.2} colors={[accent]} className="opacity-30" />,
          },
          {
            depth: 0.4,
            className: "absolute inset-0",
            children: <OrbitalBackground count={5} speed={0.35} colors={["#a855f7"]} className="opacity-15" />,
          },
        ]}
        mouseStrength={25}
        scrollStrength={50}
      />

      <Stack space={8} className="max-w-[700px] mx-auto px-4 py-12 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header with Engagement Rings */}
        <Stack space={4} align="center" className="text-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full border-2" style={{ borderColor: accent, animation: 'pulse-ring 2s ease-out infinite' }} />
            <div className="absolute -inset-8 rounded-full border-2" style={{ borderColor: accent, opacity: 0.3, animation: 'pulse-ring 2s ease-out infinite 1s' }} />
            <Avatar className="h-28 w-28 ring-4 relative" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback style={{ fontSize: '2.5rem' }}>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <Stack space={1}>
            <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em' }}>
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text level={3} color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist)' }}>
                {profile.headline}
              </Text>
            )}
          </Stack>
          <Flex gap={6} className="justify-center mt-4">
            <Flex column gap={1} align="center">
              <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>{profile.links.filter((l: any) => l.isVisible).length}</Text>
              <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase' }}>Links</Text>
            </Flex>
            <Flex column gap={1} align="center">
              <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>1.2K</Text>
              <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase' }}>Followers</Text>
            </Flex>
            <Flex column gap={1} align="center">
              <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>5.4M</Text>
              <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase' }}>Total Clicks</Text>
            </Flex>
          </Flex>
        </Stack>

        <style jsx global>{`
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>

        {/* Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="xl" style={{ borderColor: accent, boxShadow: 'var(--profile-shadow)' }}>
            <CardContent>
              <Text level={4} color="foreground" className="text-center" style={{ lineHeight: 1.7, fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.25rem' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Featured Posts with Tilt Cards */}
        <Stack space={6} className="w-full">
          <Separator style={{ opacity: 0.2 }} />
          <Grid cols={1} gap={6}>
            {mockPosts.map((post) => (
              <TiltCard key={post.id} maxTilt={8} scale={1.015} >
                <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)', boxShadow: 'var(--profile-shadow)' }}>
                  <CardContent className="space-y-4">
                    <Flex align="center" gap={3}>
                      <Avatar className="h-12 w-12" style={{ borderColor: accent }}>
                        <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                        <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Flex column gap={0.5} flex={1}>
                        <Text weight="semibold" style={{ fontFamily: 'var(--font-syne)' }}>{profile.name}</Text>
                        <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>{post.time}</Text>
                      </Flex>
                    </Flex>
                    <Text size="base" color="foreground" style={{ lineHeight: 1.6, fontFamily: 'var(--font-geist)' }}>
                      {post.content}
                    </Text>
                    {post.media && (
                      <img src={post.media} alt="" className="w-full rounded-xl" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
                    )}
                    <Flex between className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <Flex gap={6}>
                        <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {post.replies}
                        </button>
                        <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes.toLocaleString()}
                        </button>
                        <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          {post.reposts.toLocaleString()}
                        </button>
                      </Flex>
                      <Badge variant="default" size="sm" style={{ fontFamily: 'var(--font-syne)', background: accent }}>
                        Share
                      </Badge>
                    </Flex>
                  </CardContent>
                </Card>
              </TiltCard>
            ))}
          </Grid>
        </Stack>

        {/* Links as Magnetic Tilt Cards */}
        <Separator style={{ opacity: 0.2 }} />
        <Stack space={4} className="w-full">
          <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
            {profile.links
              .filter(l => l.isVisible)
              .slice(0, 18)
              .map((link, index) => (
                <TiltCard key={link.id} maxTilt={10} scale={1.02} >
                  <MagneticCard
                    
                    radius={60}
                    className={cn('w-full h-full flex', isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      boxShadow: 'var(--profile-shadow)',
                    }}
                  >
                    <button
                      onClick={() => onLinkClick?.(link)}
                      className="w-full h-full px-6 py-5 text-left hover:bg-primary/5 transition-all duration-300 flex flex-col"
                      style={{ borderRadius: '16px', fontFamily: 'var(--font-geist)' }}
                    >
                      <Flex align="center" gap={4} className="mb-4">
                        <span
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${accent}, #a855f7)`,
                            color: 'var(--primary-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '1.25rem',
                            boxShadow: `0 8px 24px -4px ${accent}40`,
                          }}
                        >
                          {link.icon || link.label.charAt(0).toUpperCase()}
                        </span>
                        <Flex column gap={1} flex={1} className="min-w-0">
                          <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
                            {link.label}
                          </Text>
                          <Text size="xs" color="muted" className="truncate font-mono">
                            {link.url}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex between centerY className="pt-4 border-t flex-1" style={{ borderColor: 'var(--border)' }}>
                        <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>
                          {link.clicks.toLocaleString()} clicks
                        </Text>
                        <Badge variant="default" size="sm" style={{ fontFamily: 'var(--font-syne)', background: `linear-gradient(135deg, ${accent}, #a855f7)` }}>
                          #{index + 1}
                        </Badge>
                      </Flex>
                    </button>
                  </MagneticCard>
                </TiltCard>
              ))}
          </Grid>
        </Stack>
      </Stack>
    </div>
  );
}

SocialBoldTemplate.displayName = 'SocialBoldTemplate';