'use client';

import * as React from 'react';
import { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heading, Text,  } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge';
import { Flex, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

const mockTestimonials: Testimonial[] = [
  { id: '1', quote: 'Exceptional vision and execution. This person delivers results that exceed expectations.', author: 'Sarah Chen', role: 'VP Engineering', company: 'TechCorp', rating: 5 },
  { id: '2', quote: 'A rare combination of technical depth and strategic thinking. Highly recommended.', author: 'Marcus Johnson', role: 'Founder', company: 'StartupXYZ', rating: 5 },
  { id: '3', quote: 'The kind of leader who elevates everyone around them. Best hire we made this year.', author: 'Emily Rodriguez', role: 'CTO', company: 'ScaleUp', rating: 5 },
];

export function ProfessionalBoldTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const accent = accentColor || 'var(--primary)';
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);

  React.useEffect(() => {
    if (!isPreview) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % mockTestimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPreview]);

  const nextTestimonial = () => setCurrentTestimonial((prev) => (prev + 1) % mockTestimonials.length);
  const prevTestimonial = () => setCurrentTestimonial((prev) => (prev - 1 + mockTestimonials.length) % mockTestimonials.length);

  return (
    <div
      className="min-w-0 relative"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        '--profile-shadow': '0 8px 32px 0 oklch(0.12 0.02 247.8 / 0.12), 0 4px 16px -4px oklch(0.12 0.02 247.8 / 0.12)',
      } as React.CSSProperties}
    >
      {/* Subtle orbital background */}
      <OrbitalBackground className="absolute inset-0 -z-10 opacity-20" count={6} speed={0.2} colors={[accent]}  />

      <Stack space={8} className="max-w-[900px] mx-auto px-4 py-12 relative z-10" style={{ fontFamily: 'var(--font-geist)' }}>
        {/* Header with accent bar */}
        <div className="relative w-full max-w-[720px] mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1.5 rounded-full" style={{ background: accent }} aria-hidden="true" />
          <Stack space={4} align="center" className="text-center pt-6">
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

            {/* Verified badge */}
            <Badge variant="success" className="gap-2 px-4 py-2" style={{ fontFamily: 'var(--font-geist)' }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Verified Professional
            </Badge>
          </Stack>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card variant="outlined" padding="lg" style={{ borderColor: accent, maxWidth: '720px', margin: '0 auto', boxShadow: 'var(--profile-shadow)' }}>
            <CardContent>
              <Text level={4} color="foreground" className="text-center" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)' }}>
                {profile.bio}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Testimonial Carousel with smooth animation */}
        {mockTestimonials.length > 0 && (
          <Stack space={6} className="max-w-[720px] mx-auto">
            <Text size="sm" weight="medium" color="muted" className="text-center" style={{ fontFamily: 'var(--font-geist)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Trusted By Leaders
            </Text>
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-full"
                >
                  <Card variant="outlined" padding="lg" style={{ borderColor: accent, boxShadow: 'var(--profile-shadow)' }}>
                    <CardContent className="flex flex-col justify-center">
                      <Flex between className="mb-4">
                        <Flex gap={1}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={i < (mockTestimonials[currentTestimonial].rating || 5) ? 'h-4 w-4 fill-yellow-400 text-yellow-400' : 'h-4 w-4 text-muted/30'} />
                          ))}
                        </Flex>
                        <Badge variant="outline" className="gap-1" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.6875rem' }}>
                          {currentTestimonial + 1} / {mockTestimonials.length}
                        </Badge>
                      </Flex>
                      <Text size="base" color="foreground" className="mb-6 italic" style={{ lineHeight: 1.7, fontFamily: 'var(--font-geist)' }}>
                        "{mockTestimonials[currentTestimonial].quote}"
                      </Text>
                      <Flex align="center" gap={3}>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{mockTestimonials[currentTestimonial].author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Flex column gap={0.5}>
                          <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-geist)' }}>
                            {mockTestimonials[currentTestimonial].author}
                          </Text>
                          <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>
                            {mockTestimonials[currentTestimonial].role}{mockTestimonials[currentTestimonial].company && `, ${mockTestimonials[currentTestimonial].company}`}
                          </Text>
                        </Flex>
                      </Flex>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Controls */}
              {!isPreview && (
                <Flex centerX gap={3} className="mt-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={prevTestimonial}
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Flex gap={2}>
                    {mockTestimonials.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentTestimonial(i)}
                        className="h-2 w-2 rounded-full transition-all"
                        style={{
                          background: i === currentTestimonial ? accent : 'var(--muted)',
                          width: i === currentTestimonial ? '1.5rem' : '0.5rem',
                        }}
                        aria-label={`Go to testimonial ${i + 1}`}
                      />
                    ))}
                  </Flex>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={nextTestimonial}
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Flex>
              )}
            </div>
          </Stack>
        )}

        {/* Links */}
        <Separator style={{ opacity: 0.3, maxWidth: '900px', margin: '0 auto' }} />
        <Stack space={3} className="w-full max-w-[900px] mx-auto">
          {profile.links
            .filter(l => l.isVisible)
            .slice(0, 20)
            .map((link, index) => (
              <MagneticCard
                key={link.id}

                radius={60}
                className={cn('w-full', isPreview && 'opacity-80')}
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  boxShadow: 'var(--profile-shadow)',
                }}
              >
                <button
                  onClick={() => onLinkClick?.(link)}
                  className="w-full px-6 py-5 text-left hover:bg-primary/5 transition-all duration-200"
                  style={{
                    borderRadius: '12px',
                    fontFamily: 'var(--font-geist)',
                  }}
                >
                  <Flex align="center" gap={4}>
                    <span
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: accent,
                        color: 'var(--primary-foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        boxShadow: `0 4px 12px -2px ${accent}40`,
                      }}
                    >
                      {link.icon || link.label.charAt(0).toUpperCase()}
                    </span>
                    <Flex column gap={1} flex={1} className="min-w-0">
                      <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-geist)', fontSize: '1.125rem' }}>
                        {link.label}
                      </Text>
                      <Text size="sm" color="muted" className="truncate font-mono">
                        {link.url}
                      </Text>
                    </Flex>
                    <Flex align="center" gap={3}>
                      <Text size="sm" colors={[accent]} style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 500 }}>
                        {link.clicks.toLocaleString()}
                      </Text>
                      <Badge variant="default" size="sm" style={{ fontSize: '0.6875rem', background: accent }}>
                        {index + 1}
                      </Badge>
                    </Flex>
                  </Flex>
                </button>
              </MagneticCard>
            ))}
        </Stack>

        {/* Proofs */}
        {profile.proofs.length > 0 && (
          <Stack space={3} className="w-full max-w-[900px] mx-auto">
            <Separator style={{ opacity: 0.3 }} />
            {profile.proofs

              .slice(0, 8)
              .map((proof) => (
                <Card key={proof.id} variant="outlined" padding="lg" style={{ borderColor: accent, boxShadow: 'var(--profile-shadow)' }}>
                  <CardContent className="flex items-center gap-4">
                    {proof.icon && (
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          background: accent,
                          color: 'var(--primary-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                        }}
                      >
                        {proof.icon}
                      </span>
                    )}
                    <Flex column gap={0.5} flex={1}>
                      <Text weight="semibold" size="base" style={{ fontFamily: 'var(--font-geist)' }}>
                        {proof.title}
                      </Text>
                      {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-geist)' }}>{proof.value}</Text>}
                    </Flex>
                  </CardContent>
                </Card>
              ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
}

ProfessionalBoldTemplate.displayName = 'ProfessionalBoldTemplate';