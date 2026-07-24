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
import { MorphingBlob } from '@/components/ui/3d/MorphingBlob';
import { Separator } from '@/components/ui/separator';

const gradientAnimation = `
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

export function CreativeBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
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
    background: `linear-gradient(135deg, ${accent}, #a855f7, #ec4899, ${accent})`,
    backgroundSize: '300% 300%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    animation: 'gradient-shift 4s ease infinite',
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ fontFamily: 'var(--font-geist)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="min-w-0 relative overflow-hidden"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '16px',
        '--profile-shadow': '0 12px 48px 0 oklch(0.12 0.02 247.8 / 0.15), 0 8px 24px -6px oklch(0.12 0.02 247.8 / 0.15)',
      } as React.CSSProperties}
    >
      {/* Immersive Background */}
      <div className="absolute inset-0 -z-10">
        {/* Morphing Blob Background */}
        <MorphingBlob
          className="absolute inset-0 opacity-30"
          colors={[accent, '#a855f7', '#ec4899']}
          speed={8}
          size={400}
        />

        {/* Parallax Orbital Layers */}
        <ParallaxLayers
          layers={[
            {
              depth: 0.2,
              className: "absolute inset-0",
              children: <OrbitalBackground count={12} speed={0.2} colors={[accent]}  className="opacity-40" />
            },
            {
              depth: 0.5,
              className: "absolute inset-0",
              children: <OrbitalBackground count={6} speed={0.35} colors={['#ec4899']}  className="opacity-25" />
            },
          ]}
          mouseStrength={40}
          scrollStrength={100}
        />
      </div>

      <Stack space={10} className="max-w-[900px] mx-auto px-4 py-20 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header */}
        <Stack space={5} align="center" className="text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
            <Avatar className="h-32 w-32 ring-4 relative" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '3rem' }}>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <Stack space={2}>
            <Heading
              as="h1"
              level={1}
             
              style={{
                fontFamily: 'var(--font-syne)',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                ...gradientStyle,
                textShadow: `0 0 60px ${accent}40`,
              }}
            >
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text level={2} color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist)', maxWidth: '600px' }}>
                {profile.headline}
              </Text>
            )}
          </Stack>

          {/* Badge row */}
          <Flex gap={3} className="flex-wrap justify-center mt-4">
            <Badge variant="default" className="gap-2 px-4 py-2" style={{ fontFamily: 'var(--font-syne)', fontSize: '0.875rem', background: `linear-gradient(135deg, ${accent}, #a855f7)` }}>
              <span style={{ fontSize: '1rem' }}>✦</span>
              Creative Professional
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-2" style={{ fontFamily: 'var(--font-geist)', borderColor: accent }}>
              {profile.links.filter((l: any) => l.isVisible).length} Links
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-2" style={{ fontFamily: 'var(--font-geist)', borderColor: '#a855f7' }}>
              {profile.proofs.filter((p: any) => p.isVisible).length} Proofs
            </Badge>
          </Flex>
        </Stack>

        {/* Bio */}
        {profile.bio && (
          <Card
            variant="outlined"
            padding="xl"
            style={{
              borderColor: 'var(--border)',
              maxWidth: '720px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, var(--card) 0%, var(--card) 100%)',
              boxShadow: 'var(--profile-shadow)',
            }}
          >
            <CardContent>
              <Text
                level={3}
                color="foreground"
                className="text-center"
                style={{
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 400,
                  fontSize: '1.375rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Links as Dramatic 3D Tilt Cards */}
        {profile.links.length > 0 && (
          <Stack space={6} className="w-full max-w-[900px] mx-auto">
            <Separator style={{ opacity: 0.2 }} />
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={6}>
              {profile.links
                .filter((l: any) => l.isVisible)
                .slice(0, 18)
                .map((link, index) => (
                  <TiltCard
                    key={link.id}
                    maxTilt={15}
                    scale={1.03}
                    
                    
                    
                    className="h-full group"
                  >
                    <MagneticCard
                      
                      radius={50}
                      className={cn(
                        'w-full h-full flex',
                        isPreview && 'opacity-80'
                      )}
                      style={{
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        boxShadow: 'var(--profile-shadow)',
                      }}
                    >
                      <button
                        onClick={() => onLinkClick?.(link)}
                        className="w-full h-full px-6 py-6 text-left hover:bg-primary/5 transition-all duration-300 flex flex-col"
                        style={{
                          borderRadius: '16px',
                          fontFamily: 'var(--font-geist)',
                        }}
                      >
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
                            <Text size="xs" color="muted" className="truncate font-mono">
                              {link.url}
                            </Text>
                          </Flex>
                        </Flex>
                        <Flex between centerY className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                          <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>
                            {link.clicks.toLocaleString()} clicks
                          </Text>
                          <Badge variant="default" size="sm" style={{ fontFamily: 'var(--font-syne)', fontSize: '0.75rem', background: `linear-gradient(135deg, ${accent}, #a855f7)` }}>
                            #{index + 1}
                          </Badge>
                        </Flex>
                      </button>
                    </MagneticCard>
                  </TiltCard>
                ))}
            </Grid>
          </Stack>
        )}

        {/* Proofs as Showcase Cards */}
        {profile.proofs.length > 0 && (
          <Stack space={4} className="w-full max-w-[900px] mx-auto">
            <Separator style={{ opacity: 0.2 }} />
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
              {profile.proofs
                .filter((p: any) => p.isVisible)
                .slice(0, 6)
                .map((proof) => (
                  <TiltCard key={proof.id} maxTilt={10} scale={1.02} >
                    <Card
                      variant="outlined"
                      padding="xl"
                      style={{
                        borderColor: accent,
                        height: '100%',
                        background: 'linear-gradient(135deg, var(--card) 0%, var(--muted)/50 100%)',
                        boxShadow: 'var(--profile-shadow)',
                      }}
                    >
                      <CardContent className="flex flex-col items-center text-center gap-4">
                        {proof.icon && (
                          <span
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: '16px',
                              background: `linear-gradient(135deg, ${accent}, #a855f7)`,
                              color: 'var(--primary-foreground)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2rem',
                              boxShadow: `0 8px 24px -4px ${accent}50`,
                            }}
                          >
                            {proof.icon}
                          </span>
                        )}
                        <Flex column gap={1} align="center">
                          <Text weight="semibold" level={4} style={{ fontFamily: 'var(--font-syne)' }}>
                            {proof.title}
                          </Text>
                          {proof.value && (
                            <Text level={2} style={{ fontFamily: 'var(--font-geist-mono)', color: accent, ...gradientStyle }}>
                              {proof.value}
                            </Text>
                          )}
                        </Flex>
                      </CardContent>
                    </Card>
                  </TiltCard>
                ))}
            </Grid>
          </Stack>
        )}
      </Stack>
    </div>
  );
}

CreativeBoldTemplate.displayName = 'CreativeBoldTemplate';