'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';

const gradientAnimation = `
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
`;

export function CreativeMaxTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = gradientAnimation;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [mounted]);

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accent}, #a855f7, #ec4899, #f97316, ${accent})`,
    backgroundSize: '400% 400%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    animation: 'gradient-shift 5s ease infinite',
  };

  const shimmerStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite',
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ fontFamily: 'var(--font-geist)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Video background support - check for video in profile theme
  const videoUrl = profile.theme?.customCss?.includes('video') ? profile.theme.customCss : null;

  return (
    <div
      className="min-w-0 relative overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '0',
        '--profile-shadow': 'none',
      } as React.CSSProperties}
    >
      {/* Full-bleed Video Background Support */}
      {videoUrl && (
        <video
          className="absolute inset-0 -z-20 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          style={{ opacity: 0.15 }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Immersive Multi-layer Background */}
      <div className="absolute inset-0 -z-10">
        {/* Base Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 20% 20%, ${accent}15 0%, transparent 50%),
                         radial-gradient(ellipse at 80% 80%, #a855f715 0%, transparent 50%),
                         radial-gradient(ellipse at 50% 50%, #ec489910 0%, transparent 40%),
                         var(--background)`,
          }}
        />

        {/* Morphing Blob Layer */}
        <MorphingBlob
          className="absolute inset-0 opacity-40"
          colors={[accent, '#a855f7']}
          speed={10}
          size={500}
        />

        {/* Deep Parallax Orbital Layers */}
        <ParallaxLayers
          layers={[
            {
              depth: 0.15,
              className: "absolute inset-0",
              children: <OrbitalBackground count={16} speed={0.15} colors={[accent]} className="opacity-35" />
            },
            {
              depth: 0.35,
              className: "absolute inset-0",
              children: <OrbitalBackground count={10} speed={0.25} colors={["#a855f7"]} className="opacity-25" />
            },
            {
              depth: 0.6,
              className: "absolute inset-0",
              children: <OrbitalBackground count={6} speed={0.4} colors={["#ec4899"]} className="opacity-15" />
            },
          ]}
          mouseStrength={50}
          scrollStrength={150}
        />

        {/* Floating geometric shapes */}
        <div className="absolute inset-0" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${20 + i * 30}px`,
                height: `${20 + i * 30}px`,
                top: `${10 + i * 15}%`,
                left: `${5 + i * 18}%`,
                border: `1px solid ${accent}20`,
                animation: `float ${6 + i * 1}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen">
        <Stack space={0} className="px-4 py-16 md:py-24 lg:px-8">

          {/* Hero Section */}
          <section className="relative max-w-[1000px] mx-auto mb-16">
            <Stack space={6} align="center" className="text-center">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-pink-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                <Avatar className="h-36 w-36 md:h-40 md:w-40 ring-4 relative" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '3.5rem' }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Animated ring pulse */}
                <div className="absolute -inset-2 rounded-full border-2" style={{ borderColor: `${accent}60`, animation: 'pulse 2s ease-in-out infinite' }} />
              </div>

              <Stack space={3}>
                <Heading
                  as="h1"
                  level={1}
                  style={{
                    fontFamily: 'var(--font-syne)',
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                    ...gradientStyle,
                    textShadow: `0 0 80px ${accent}30, 0 4px 20px rgba(0,0,0,0.1)`,
                  }}
                >
                  {profile.name}
                </Heading>

                {profile.headline && (
                  <Text level={2} md="3xl" color="muted" weight="medium" className="max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-geist)', lineHeight: 1.3 }}>
                    {profile.headline}
                  </Text>
                )}

                {/* Status badges */}
                <Flex gap={3} className="flex-wrap justify-center mt-4">
                  <Badge variant="default" className="gap-2 px-5 py-2.5" style={{ fontFamily: 'var(--font-syne)', fontSize: '0.9375rem', background: `linear-gradient(135deg, ${accent}, #a855f7)` }}>
                    <span style={{ fontSize: '1.125rem' }}>✦</span>
                    Creative Visionary
                  </Badge>
                  <Badge variant="outline" className="gap-2 px-5 py-2.5" style={{ fontFamily: 'var(--font-geist)', borderColor: accent }}>
                    {profile.links.filter((l: any) => l.isVisible).length} Curated Links
                  </Badge>
                  <Badge variant="outline" className="gap-2 px-5 py-2.5" style={{ fontFamily: 'var(--font-geist)', borderColor: '#a855f7' }}>
                    {profile.proofs.length} Verified Proofs
                  </Badge>
                </Flex>
              </Stack>
            </Stack>

            {/* Scroll indicator */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mt-16 animate-bounce" aria-hidden="true">
              <svg className="h-8 w-8 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </div>
          </section>

          {/* Bio Section - Full Width Immersive */}
          {profile.bio && (
            <section className="relative max-w-[1000px] mx-auto mb-16">
              <Card
                variant="outlined"
                padding="none"
                className="overflow-hidden"
                style={{
                  borderColor: 'var(--border)',
                  background: 'rgba(var(--card-rgb), 0.8)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: `0 24px 64px -12px ${accent}10, 0 16px 32px -12px rgba(0,0,0,0.08)`,
                  borderRadius: '24px',
                }}
              >
                <CardContent className="p-8 md:p-12 lg:p-16">
                  <div className="max-w-3xl mx-auto text-center">
                    <Text
                      level={3}
                      md="2xl"
                      color="foreground"
                      style={{
                        lineHeight: 1.7,
                        fontFamily: 'var(--font-syne)',
                        fontWeight: 400,
                        fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                      }}
                    >
                      {profile.bio}
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Featured Links Carousel / Grid */}
          {profile.links.length > 0 && (
            <section className="relative max-w-[1200px] mx-auto mb-16">
              <Flex between className="mb-8">
                <Stack space={1}>
                  <Heading level={2} style={{ fontFamily: 'var(--font-syne)' }}>
                    Featured Work
                  </Heading>
                  <Text color="muted">Explore my latest projects and platforms</Text>
                </Stack>
                <Badge variant="outline" className="gap-1.5" style={{ fontFamily: 'var(--font-geist-mono)', borderColor: accent }}>
                  {profile.links.filter((l: any) => l.isVisible).length} Active
                </Badge>
              </Flex>

              <Grid cols={{ base: 1, md: 2, lg: 3, xl: 4 }} gap={6}>
                {profile.links
                  .filter((l: any) => l.isVisible)
                  .slice(0, 20)
                  .map((link, index) => (
                    <TiltCard
                      key={link.id}
                      maxTilt={12}
                      scale={1.025}
                      
                      
                      
                      className="group"
                    >
                      <MagneticCard
                        
                        radius={40}
                        className={cn(
                          'h-full flex flex-col',
                          isPreview && 'opacity-80'
                        )}
                        style={{
                          borderRadius: '20px',
                          border: '1px solid var(--border)',
                          background: 'var(--card)',
                          boxShadow: `0 16px 48px -12px ${accent}15, 0 8px 24px -8px rgba(0,0,0,0.06)`,
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => onLinkClick?.(link)}
                          className="w-full h-full flex flex-col p-6 hover:bg-primary/5 transition-all duration-300"
                          style={{
                            borderRadius: '20px',
                            fontFamily: 'var(--font-geist)',
                          }}
                        >
                          {/* Shimmer overlay on hover */}
                          <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={shimmerStyle} />

                          <Flex align="center" gap={4} className="mb-4">
                            <span
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${accent}, #a855f7, #ec4899)`,
                                color: 'var(--primary-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.5rem',
                                fontFamily: 'var(--font-syne)',
                                boxShadow: `0 8px 24px -4px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {link.icon || link.label.charAt(0).toUpperCase()}
                            </span>
                            <Flex column gap={1} flex={1} className="min-w-0">
                              <Text weight="medium" className="truncate group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '1.125rem' }}>
                                {link.label}
                              </Text>
                              <Text size="xs" color="muted" className="truncate font-mono max-w-[200px]">
                                {link.url}
                              </Text>
                            </Flex>
                          </Flex>

                          <Flex between centerY className="mt-auto pt-4 border-t flex-1" style={{ borderColor: 'var(--border)' }}>
                            <Flex align="center" gap={2}>
                              <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>
                                {link.clicks.toLocaleString()}
                              </Text>
                              <Text size="xs" color="muted">clicks</Text>
                            </Flex>
                            <Badge
                              variant="default"
                              size="sm"
                              className="group-hover:scale-105 transition-transform"
                              style={{ fontFamily: 'var(--font-syne)', fontSize: '0.75rem', background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
                            >
                              #{index + 1}
                            </Badge>
                          </Flex>
                        </button>
                      </MagneticCard>
                    </TiltCard>
                  ))}
              </Grid>
            </section>
          )}

          {/* Proof Points as Interactive Dashboard */}
          {profile.proofs.length > 0 && (
            <section className="relative max-w-[1200px] mx-auto mb-16">
              <Flex between className="mb-8">
                <Stack space={1}>
                  <Heading level={2} style={{ fontFamily: 'var(--font-syne)' }}>
                    Verified Achievements
                  </Heading>
                  <Text color="muted">Trust signals and social proof</Text>
                </Stack>
              </Flex>

              <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={6}>
                {profile.proofs
                  .slice(0, 10)
                  .map((proof, idx) => (
                    <TiltCard key={proof.id} maxTilt={10} scale={1.02} >
                      <Card
                        variant="outlined"
                        padding="xl"
                        style={{
                          borderColor: idx % 2 === 0 ? accent : '#a855f7',
                          height: '100%',
                          background: 'linear-gradient(135deg, var(--card) 0%, var(--muted)/30 100%)',
                          boxShadow: `0 16px 48px -12px ${idx % 2 === 0 ? accent : '#a855f7'}15`,
                          borderRadius: '20px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={shimmerStyle} />
                        <CardContent className="flex flex-col items-center text-center gap-4 relative z-10 h-full">
                          {proof.icon && (
                            <span
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: '20px',
                                background: idx % 2 === 0
                                  ? `linear-gradient(135deg, ${accent}, #a855f7)`
                                  : `linear-gradient(135deg, #a855f7, #ec4899)`,
                                color: 'var(--primary-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.25rem',
                                boxShadow: `0 12px 32px -6px ${idx % 2 === 0 ? accent : '#a855f7'}50`,
                              }}
                            >
                              {proof.icon}
                            </span>
                          )}
                          <Flex column gap={2} align="center" flex={1}>
                            <Text weight="semibold" level={4} style={{ fontFamily: 'var(--font-syne)' }}>
                              {proof.title}
                            </Text>
                            {proof.value && (
                              <Text level={1} style={{ fontFamily: 'var(--font-geist-mono)', color: idx % 2 === 0 ? accent : '#a855f7', ...gradientStyle }}>
                                {proof.value}
                              </Text>
                            )}
                          </Flex>
                          {proof.value && (
                            <Progress
                              value={Math.min(100, Number(proof.value.replace(/[^0-9.]/g, '')) * (idx % 3 + 1) * 5)}
                              className="w-full max-w-xs h-2"
                              style={{
                                '--progress-color': idx % 2 === 0 ? accent : '#a855f7',
                                '--progress-bg': 'var(--muted)',
                                borderRadius: '9999px',
                              } as React.CSSProperties}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </TiltCard>
                  ))}
              </Grid>
            </section>
          )}

          {/* Footer */}
          <footer className="relative max-w-[1000px] mx-auto pt-16 border-t" style={{ borderColor: 'var(--border)' }}>
            <Stack space={4} align="center" className="text-center">
              <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                Built with {' '}
                <span style={{ color: accent, fontWeight: 600 }}>unool</span>
                {' '}— Your link in bio, reimagined.
              </Text>
              <Flex gap={4} className="flex-wrap justify-center">
                {profile.socialHandles?.twitter && (
                  <a href={`https://twitter.com/${profile.socialHandles.twitter}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="Twitter">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                  </a>
                )}
                {profile.socialHandles?.github && (
                  <a href={`https://github.com/${profile.socialHandles.github}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="GitHub">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                )}
                {profile.socialHandles?.linkedin && (
                  <a href={`https://linkedin.com/in/${profile.socialHandles.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="LinkedIn">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                )}
              </Flex>
            </Stack>
          </footer>
        </Stack>
      </main>
    </div>
  );
}

CreativeMaxTemplate.displayName = 'CreativeMaxTemplate';