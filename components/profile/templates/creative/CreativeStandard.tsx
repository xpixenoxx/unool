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

// Gradient text animation
const gradientAnimation = `
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

export function CreativeStandardTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Inject gradient animation CSS
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ fontFamily: 'var(--font-geist)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accent}, #a855f7, ${accent})`,
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    animation: 'gradient-shift 3s ease infinite',
  };

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '14px',
        '--profile-shadow': '0 8px 32px 0 oklch(0.12 0.02 247.8 / 0.12), 0 4px 16px -4px oklch(0.12 0.02 247.8 / 0.12)',
      } as React.CSSProperties}
    >
      {/* Parallax Background Layers */}
      <ParallaxLayers
        layers={[
          {
            depth: 0.15,
            className: "absolute inset-0",
            children: <OrbitalBackground count={10} speed={0.25} colors={[accent]} className="opacity-30" />
          },
          {
            depth: 0.4,
            className: "absolute inset-0",
            children: <OrbitalBackground count={5} speed={0.4} colors={["#a855f7"]} className="opacity-20" />
          },
        ]}
        mouseStrength={30}
        scrollStrength={80}
      />

      <Stack space={8} className="max-w-[800px] mx-auto px-4 py-16 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header with Gradient Text Name */}
        <Stack space={4} align="center" className="text-center">
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4" ringColor={accent}>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '2.5rem' }}>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <Stack space={1}>
            <Heading
              as="h1"
              level={1}
             
              style={{
                fontFamily: 'var(--font-syne)',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                ...gradientStyle,
              }}
            >
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text level={3} color="muted" weight="medium" style={{ fontFamily: 'var(--font-geist)' }}>
                {profile.headline}
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="xl" style={{ borderColor: 'var(--border)', maxWidth: '640px', margin: '0 auto' }}>
            <CardContent>
              <Text level={4} color="foreground" style={{ lineHeight: 1.8, fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '1.25rem', textAlign: 'center' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Links with Magnetic Hover + Tilt Cards */}
        {profile.links.length > 0 && (
          <Stack space={5} className="w-full max-w-[800px] mx-auto">
            <Separator style={{ opacity: 0.2 }} />
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={5}>
              {profile.links
                .filter(l => l.isVisible)
                .slice(0, 15)
                .map((link, index) => (
                  <TiltCard
                    key={link.id}
                    maxTilt={8}
                    scale={1.02}
                    
                    className="h-full"
                  >
                    <MagneticCard
                      
                      radius={80}
                      className={cn(
                        'w-full h-full flex',
                        isPreview && 'opacity-80'
                      )}
                      style={{
                        borderRadius: '14px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        boxShadow: 'var(--profile-shadow)',
                      }}
                    >
                      <button
                        onClick={() => onLinkClick?.(link)}
                        className="w-full h-full px-5 py-5 text-left hover:bg-primary/5 transition-all duration-200 flex flex-col"
                        style={{
                          borderRadius: '14px',
                          fontFamily: 'var(--font-geist)',
                        }}
                      >
                        <Flex align="center" gap={3}>
                          <span
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '14px',
                              background: `linear-gradient(135deg, ${accent}, #a855f7)`,
                              color: 'var(--primary-foreground)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '1.25rem',
                              fontFamily: 'var(--font-syne)',
                              boxShadow: `0 4px 16px -2px ${accent}40`,
                            }}
                          >
                            {link.icon || link.label.charAt(0).toUpperCase()}
                          </span>
                          <Flex column gap={1} flex={1} className="min-w-0">
                            <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-syne)', fontWeight: 500 }}>
                              {link.label}
                            </Text>
                            <Text size="xs" color="muted" className="truncate font-mono">
                              {link.url}
                            </Text>
                          </Flex>
                        </Flex>
                        <Flex end className="mt-4">
                          <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 500 }}>
                            {link.clicks.toLocaleString()} clicks
                          </Text>
                        </Flex>
                      </button>
                    </MagneticCard>
                  </TiltCard>
                ))}
            </Grid>
          </Stack>
        )}

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={3} className="w-full max-w-[800px] mx-auto">
            <Separator style={{ opacity: 0.2 }} />
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
              {profile.proofs
                
                .slice(0, 6)
                .map((proof) => (
                  <TiltCard key={proof.id} maxTilt={5} scale={1.02} >
                    <Card variant="outlined" padding="lg" style={{ borderColor: accent, height: '100%' }}>
                      <CardContent className="flex items-center gap-3">
                        {proof.icon && (
                          <span
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '12px',
                              background: `linear-gradient(135deg, ${accent}, #a855f7)`,
                              color: 'var(--primary-foreground)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                            }}
                          >
                            {proof.icon}
                          </span>
                        )}
                        <Flex column gap={0.5} flex={1}>
                          <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-syne)' }}>
                            {proof.title}
                          </Text>
                          {proof.value && (
                            <Text level={4} style={{ fontFamily: 'var(--font-geist-mono)', color: accent }}>
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

CreativeStandardTemplate.displayName = 'CreativeStandardTemplate';