'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import TiltCard from '@/components/ui/3d/TiltCard';
import { ParallaxLayers, ParallaxLayer } from '@/components/ui/3d/ParallaxLayers';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { MorphingBlob } from '@/components/ui/3d/MorphingBlob';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function SocialMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';

  const mockPosts = [
    { id: '1', content: 'Just shipped the most comprehensive link-in-bio platform ever built! 🚀 25+ animated templates across 5 categories (Essential, Professional, Creative, Technical, Social) with full 3D orbital backgrounds, magnetic hover cards, tilt effects, and real-time analytics.', time: '2h ago', likes: 3421, replies: 289, reposts: 567, media: 'https://picsum.photos/seed/social1/800/500', author: profile.name, avatar: profile.avatarUrl },
    { id: '2', content: 'The new OKLCH design tokens are a game changer for perceptual color uniformity. Combined with Syne variable font for creative templates and Geist Mono for technical ones. Every template has its own personality.', time: '1d ago', likes: 5234, replies: 412, reposts: 891, media: null, author: profile.name, avatar: profile.avatarUrl },
    { id: '3', content: 'MagneticCard + TiltCard + ParallaxLayers = pure interaction magic ✨ The cursor attraction with 3D rotation makes every interaction feel alive. Built with Framer Motion springs tuned for 60fps.', time: '3d ago', likes: 2156, replies: 178, reposts: 423, media: 'https://picsum.photos/seed/social3/800/500', author: profile.name, avatar: profile.avatarUrl },
    { id: '4', content: 'Thinking in systems, not pages. The new template registry with 25 templates across Essential, Professional, Creative, Technical, and Social categories. Each with 5 intensity levels from Minimal to Max.', time: '5d ago', likes: 1834, replies: 134, reposts: 298, media: null, author: profile.name, avatar: profile.avatarUrl },
    { id: '5', content: 'Live preview iframe switching under 300ms! The TemplateSelector with ProfilePreview component makes choosing your vibe instant. Hover any card, see it live. Click to apply.', time: '1w ago', likes: 4123, replies: 289, reposts: 634, media: 'https://picsum.photos/seed/social5/800/500', author: profile.name, avatar: profile.avatarUrl },
    { id: '6', content: 'Deploying to Vercel with ENCRYPTION_KEY for secure API keys. Supabase PostgreSQL with RLS for multi-tenant data isolation. Edge functions for webhook delivery with HMAC-SHA256 signing.', time: '2w ago', likes: 892, replies: 78, reposts: 156, media: null, author: profile.name, avatar: profile.avatarUrl },
  ];

  const mockFollowers = Array.from({ length: 8 }, (_, i) => ({
    name: ['Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Avery'][i],
    avatar: '',
  }));

  return (
    <div
      className="min-w-0 relative overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '0',
        '--profile-shadow': 'none',
      } as React.CSSProperties}
    >
      {/* Full-bleed Immersive Background */}
      <div className="absolute inset-0 -z-20">
        <MorphingBlob
          className="absolute inset-0 opacity-25"
          colors={[accent, '#a855f7']}
          speed={6}
          size={400}
        />
        <ParallaxLayers
          containerClassName="absolute inset-0"
          layers={[
            {
              depth: 0.1,
              className: "absolute inset-0",
              children: <OrbitalBackground count={14} speed={0.15} colors={[accent]} className="opacity-30" />,
            },
            {
              depth: 0.35,
              className: "absolute inset-0",
              children: <OrbitalBackground count={8} speed={0.25} colors={["#a855f7"]} className="opacity-20" />,
            },
            {
              depth: 0.6,
              className: "absolute inset-0",
              children: <OrbitalBackground count={5} speed={0.4} colors={["#ec4899"]} className="opacity-10" />,
            },
          ]}
          mouseStrength={30}
          scrollStrength={80}
        />
      </div>

      {/* Main Feed */}
      <main className="relative z-10">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Tabs defaultValue="posts" className="w-full" style={{ fontFamily: 'var(--font-geist)' }}>
              <TabsList className="bg-muted/50 w-full justify-between" style={{ fontFamily: 'var(--font-geist)' }}>
                <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                <TabsTrigger value="replies" className="flex-1">Replies</TabsTrigger>
                <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                <TabsTrigger value="likes" className="flex-1">Likes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Profile Hero Section */}
        <section className="max-w-2xl mx-auto px-4 py-8 relative">
          <Stack space={4} align="center" className="text-center">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full border-2" style={{ borderColor: accent, animation: 'pulse-ring 2.5s ease-out infinite' }} />
              <div className="absolute -inset-7 rounded-full border-2" style={{ borderColor: accent, opacity: 0.2, animation: 'pulse-ring 2.5s ease-out infinite 1.25s' }} />
              <Avatar className="h-28 w-28 ring-4 relative" ringColor={accent}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback style={{ fontSize: '2.5rem', fontFamily: 'var(--font-syne)', fontWeight: 700 }}>
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <Stack space={1}>
              <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.04em' }}>
                {profile.name}
              </Heading>
              {profile.headline && (
                <Text level={3} color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist)' }}>
                  {profile.headline}
                </Text>
              )}
            </Stack>

            {/* Stats */}
            <Flex gap={8} className="flex-wrap justify-center mt-4">
              <Flex column gap={1} align="center">
                <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                  {profile.links.filter((l: any) => l.isVisible).length}
                </Text>
                <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Links
                </Text>
              </Flex>
              <div className="w-px h-8" style={{ background: 'var(--border)' }} />
              <Flex column gap={1} align="center">
                <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                  1.2K
                </Text>
                <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Followers
                </Text>
              </Flex>
              <div className="w-px h-8" style={{ background: 'var(--border)' }} />
              <Flex column gap={1} align="center">
                <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
                  {profile.links.reduce((a: number, l: any) => a + l.clicks, 0).toLocaleString()}
                </Text>
                <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Clicks
                </Text>
              </Flex>
            </Flex>

            {/* Followers Avatar Stack */}
            <div className="flex items-center justify-center -space-x-2 mt-4">
              {mockFollowers.map((follower, i) => (
                <div key={i} className="relative">
                  <Avatar className="h-10 w-10 ring-2" ringColor='var(--background)'>
                    <AvatarFallback style={{ fontSize: '0.75rem', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
                      {follower.name.charAt(0)}
                    </AvatarFallback>
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2" style={{ background: accent, borderColor: 'var(--background)', animation: `pulse-ring 2s ease-in-out infinite ${i * 0.15}s` }} />
                  </Avatar>
                </div>
              ))}
              <Badge variant="outline" className="h-10 w-10 flex items-center justify-center text-xs" style={{ fontFamily: 'var(--font-geist)', borderColor: accent, color: accent }}>
                +99
              </Badge>
            </div>

            <Button variant="ghost" className="mt-2" style={{ fontFamily: 'var(--font-syne)', borderColor: accent, color: accent }}>
              Follow
            </Button>
          </Stack>

          <style jsx global>{`
            @keyframes pulse-ring {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          `}</style>
        </section>

        {/* Bio Card */}
        {profile.bio && (
          <section className="max-w-2xl mx-auto px-4 pb-8">
            <Card variant="outlined" padding="lg" style={{ borderColor: 'var(--border)', background: 'rgba(var(--card-rgb), 0.9)', backdropFilter: 'blur(20px)' }}>
              <CardContent>
                <Text level={4} color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.125rem' }}>
                  {profile.bio}
                </Text>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Links Bar */}
        <section className="max-w-2xl mx-auto px-4 pb-8">
          <Card variant="outlined" padding="none" style={{ borderColor: 'var(--border)' }}>
            <CardContent className="p-4">
              <Grid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={3}>
                {profile.links
                  .filter(l => l.isVisible)
                  .slice(0, 16)
                  .map((link, index) => (
                    <MagneticCard
                      key={link.id}
                      
                      radius={80}
                      className={cn(isPreview && 'opacity-80')}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                      }}
                    >
                      <button
                        onClick={() => onLinkClick?.(link)}
                        className="w-full p-3 text-left hover:bg-primary/5 transition-colors rounded-lg"
                        style={{ fontFamily: 'var(--font-geist)' }}
                      >
                        <Flex align="center" gap={2}>
                          <span
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
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
                          <Flex column gap={0.5} flex={1} className="min-w-0">
                            <Text weight="medium" size="sm" className="truncate" style={{ fontFamily: 'var(--font-syne)' }}>
                              {link.label}
                            </Text>
                            <Text size="xs" color="muted" className="truncate font-mono">
                              {link.clicks.toLocaleString()} clicks
                            </Text>
                          </Flex>
                        </Flex>
                      </button>
                    </MagneticCard>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </section>

        {/* Infinite Feed */}
        <section className="max-w-2xl mx-auto px-4 pb-16">
          <Stack space={6}>
            {mockPosts.map((post) => (
              <TiltCard key={post.id} maxTilt={4} scale={1.005} >
                <Card
                  variant="outlined"
                  padding="none"
                  className="overflow-hidden"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'rgba(var(--card-rgb), 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 8px 32px -8px ${accent}15`,
                    borderRadius: '16px',
                  }}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Post Header */}
                    <Flex align="center" gap={3}>
                      <Avatar className="h-11 w-11" style={{ borderColor: accent }}>
                        <AvatarImage src={post.avatar} alt={post.author} />
                        <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}>
                          {post.author.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Flex column gap={0.5} flex={1}>
                        <Text weight="semibold" style={{ fontFamily: 'var(--font-syne)' }}>{post.author}</Text>
                        <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist-mono)' }}>{post.time}</Text>
                      </Flex>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </Button>
                    </Flex>

                    {/* Post Content */}
                    <Text size="base" color="foreground" style={{ lineHeight: 1.6, fontFamily: 'var(--font-geist)' }}>
                      {post.content}
                    </Text>

                    {/* Media */}
                    {post.media && (
                      <img
                        src={post.media}
                        alt=""
                        className="w-full rounded-xl"
                        style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                      />
                    )}

                    {/* Engagement Bar */}
                    <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                      <Flex gap={6}>
                        <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors py-2 px-2 rounded-lg hover:bg-green-500/10" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          <span>{post.replies.toLocaleString()}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors py-2 px-2 rounded-lg hover:bg-green-500/10" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          <span>{post.likes.toLocaleString()}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-muted hover:text-green-500 transition-colors py-2 px-2 rounded-lg hover:bg-green-500/10" style={{ fontFamily: 'var(--font-geist)', fontSize: '0.875rem' }}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          <span>{post.reposts.toLocaleString()}</span>
                        </button>
                      </Flex>
                      <Button variant="ghost" size="sm" className="py-2 px-3" style={{ fontFamily: 'var(--font-syne)', borderColor: accent, color: accent }}>
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            ))}

            {/* Load More */}
            <div className="text-center pt-8">
              <Button variant="outline" size="lg" className="w-full sm:w-auto" style={{ fontFamily: 'var(--font-syne)', borderColor: accent, color: accent }}>
                Load more posts
              </Button>
            </div>
          </Stack>
        </section>
      </main>
    </div>
  );
}

SocialMaxTemplate.displayName = 'SocialMaxTemplate';