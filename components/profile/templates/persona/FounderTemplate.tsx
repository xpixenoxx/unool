'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Heading, Text } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TiltCard, MagneticCard, PerspectiveFlip } from '@/components/ui/3d';
import { spring, slideUp, staggerContainer, staggerItem } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export function FounderTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 15);
  const visibleProofs = profile.proofs.slice(0, 8);

  // KPI data from proofs (metrics type)
  const kpiProofs = profile.proofs.filter((p) => p.type === 'metric').slice(0, 3);

  // Testimonials from proofs
  const testimonials: Testimonial[] = profile.proofs
    .filter((p) => p.type === 'testimonial')
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      quote: p.description || p.value,
      author: p.title,
      role: p.icon || '',
      company: p.value,
    }));

  // Company badges from proofs
  const companyBadges = profile.proofs.filter((p) => p.type === 'badge').slice(0, 6);

  // Testimonial carousel state
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);
  const testimonialX = useMotionValue(0);
  const testimonialSpring = useSpring(testimonialX, { stiffness: 300, damping: 30 });

  const goToTestimonial = (index: number) => {
    setCurrentTestimonial(index);
    testimonialX.set(index);
  };

  const nextTestimonial = () => {
    const next = (currentTestimonial + 1) % testimonials.length;
    goToTestimonial(next);
  };

  const prevTestimonial = () => {
    const prev = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    goToTestimonial(prev);
  };

  // Simple Button component for testimonial navigation
  function Button({ variant = 'ghost', size = 'icon', className, children, onClick, 'aria-label': ariaLabel }: { variant?: 'ghost' | 'default' | 'outline'; size?: 'icon' | 'sm' | 'md' | 'lg'; className?: string; children: React.ReactNode; onClick?: () => void; 'aria-label'?: string }) {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
    const variants: Record<string, string> = {
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    };
    const sizes: Record<string, string> = {
      icon: 'h-8 w-8',
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-6 text-base',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full bg-background"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '8px',
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
    >
      {/* Subtle background gradient + patterns */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-30"
          style={{ background: `radial-gradient(ellipse at center, ${accent}20 0%, transparent 60%)` }}
        />
        {/* Subtle geometric pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000' fillOpacity='0.1'%3E%3Cpath d='M0 0h80v80H0V0zm1 1h78v78H1V1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-16 lg:py-20">
        {/* Desktop: Two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-[280px_1fr] lg:gap-10 lg:items-start">
          {/* Sidebar */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring.standard, delay: 0.1 }}
            className="sticky top-24 space-y-6"
          >
            {/* Avatar + Name */}
            <Stack space={4} align="center" className="text-center">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full -inset-1"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${accent}15, transparent 70%)`,
                    filter: 'blur(16px)',
                    transform: 'scale(1.2)',
                  }}
                />
                <Avatar className="h-24 w-24 ring-4 relative z-10" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="text-3xl font-medium">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* Active indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.4 }}
                  className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-3 flex items-center justify-center"
                  style={{
                    background: accent,
                    borderColor: 'var(--background)',
                    boxShadow: `0 0 0 4px var(--background), 0 4px 16px -4px ${accent}`,
                  }}
                  aria-label="Active"
                >
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--primary-foreground)' }}
                    animate={{ scale: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              </div>

              <Stack space={2} align="center">
                <motion.h1
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {profile.name}
                </motion.h1>

                {profile.headline && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.3 }}
                    className="text-lg text-muted-foreground font-medium max-w-xs"
                    style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                  >
                    {profile.headline}
                  </motion.p>
                )}

                {profile.company && (
                  <motion.p
                    initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.standard, delay: 0.35 }}
                    className="text-base text-primary font-semibold"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {profile.company}
                  </motion.p>
                )}
              </Stack>

              {/* Company Badges - ALWAYS VISIBLE */}
              {companyBadges.length > 0 && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.5 }}
                >
                  <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>
                    Companies
                  </Text>
                  <Flex gap={2} className="flex-wrap justify-center" wrap>
                    {companyBadges.map((badge, i) => (
                      <motion.div
                        key={badge.id}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 0.6 + i * 0.06 }}
                      >
                        <Badge
                          variant="outline"
                          className="gap-1.5 px-2.5 py-1.5"
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            borderColor: `${accent}40`,
                            background: `linear-gradient(135deg, ${accent}05, ${accent}02)`,
                          }}
                        >
                          {badge.icon && <span style={{ fontSize: '0.875rem' }}>{badge.icon}</span>}
                          {badge.title}
                        </Badge>
                      </motion.div>
                    ))}
                  </Flex>
                </motion.div>
              )}

              {/* Subdomain */}
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.8 }}
                className="text-center pt-4 border-t"
                style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-mono)' }}
              >
                <Text size="sm" color="muted" weight="medium">
                  {profile.subdomain}.unool.co
                </Text>
              </motion.div>
            </Stack>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring.standard, delay: 0.2 }}
            className="space-y-8"
          >
            {/* KPI Strip - ALWAYS VISIBLE, tilt only on hover if not reduced motion */}
            {kpiProofs.length > 0 && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.3 }}
              >
                <Grid cols={{ base: 1, sm: 3 }} gap={4}>
                  {kpiProofs.map((kpi, index) => (
                    <TiltCard key={kpi.id} maxTilt={reducedMotion ? 0 : 6} scale={1.02} className="h-full">
                      <div className="h-full p-5 rounded-xl border relative overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(ellipse at center, ${accent}08 0%, transparent 70%)`,
                          }}
                        />
                        <div className="relative z-10">
                          <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>
                            {kpi.title}
                          </Text>
                          <div className="flex items-baseline gap-1">
                            <motion.span
                              initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ ...spring.bouncy, delay: 0.4 + index * 0.08 }}
                              className="text-3xl font-bold"
                              style={{ fontFamily: 'var(--font-sans)', color: accent }}
                            >
                              {kpi.value}
                            </motion.span>
                            {kpi.description && (
                              <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>
                                {kpi.description}
                              </Text>
                            )}
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  ))}
                </Grid>
              </motion.div>
            )}

            {/* Bio Card - ALWAYS VISIBLE */}
            {profile.bio && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.4 }}
              >
                <div className="p-6 rounded-2xl border relative overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}05 0%, transparent 100%)` }} />
                  <div className="relative">
                    <Text size="base" color="foreground" style={{ lineHeight: 1.75, fontFamily: 'var(--font-sans)' }}>
                      {profile.bio}
                    </Text>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Links - Card style with magnetic hover - ALWAYS VISIBLE */}
            {visibleLinks.length > 0 && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.5 }}
              >
                <Stack space={3} className="w-full">
                  {visibleLinks.map((link, index) => (
                    <MagneticCard
                      key={link.id}
                      radius={100}
                      strength={reducedMotion ? 0 : 0.15}
                      className={cn('w-full', isPreview && 'opacity-80')}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                      }}
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-full px-5 py-4 text-left overflow-hidden no-underline flex items-center gap-4"
                        style={{
                          borderRadius: '12px',
                          fontFamily: 'var(--font-sans)',
                          display: 'flex',
                        }}
                        onMouseEnter={() => isPreview && onLinkClick?.(link)}
                      >
                        {/* Hover glow - visible on hover/focus */}
                        <motion.div
                          className="absolute inset-0 opacity-0 rounded-xl"
                          style={{
                            boxShadow: `0 0 0 2px ${accent}30, 0 8px 32px -8px ${accent}20`,
                          }}
                          whileHover={{ opacity: 1 }}
                          whileFocus={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />

                        <Flex align="center" gap={4} className="relative z-10 flex-1">
                          <motion.div
                            initial={reducedMotion ? {} : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ ...spring.bouncy, delay: index * 0.04 }}
                            className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '10px',
                              background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                              color: 'var(--primary-foreground)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '1.125rem',
                              boxShadow: `0 4px 16px -4px ${accent}`,
                            }}
                          >
                            {link.icon || link.label.charAt(0).toUpperCase()}
                          </motion.div>

                          <Flex column gap={1.5} flex={1} className="min-w-0">
                            <Text weight="medium" className="truncate group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem' }}>
                              {link.label}
                            </Text>
                            <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                              {link.url}
                            </Text>
                          </Flex>

                          <Flex align="center" gap={2}>
                            <motion.span
                              initial={reducedMotion ? {} : { opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...spring.gentle, delay: 0.6 + index * 0.03 }}
                              style={{
                                fontSize: '0.75rem',
                                color: accent,
                                fontFamily: 'var(--font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {link.clicks.toLocaleString()}
                            </motion.span>
                            <Badge variant="ghost" size="sm" className="group-hover:bg-primary/10 transition-colors" style={{ fontSize: '0.65rem', fontFamily: 'var(--font-sans)' }}>
                              #{index + 1}
                            </Badge>
                          </Flex>
                        </Flex>
                      </a>
                    </MagneticCard>
                  ))}
                </Stack>
              </motion.div>
            )}

            {/* Testimonial Carousel - ALWAYS VISIBLE, flip only on interaction */}
            {testimonials.length > 0 && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.6 }}
              >
                <div className="relative">
                  <Stack space={4}>
                    <Flex between align="center">
                      <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>
                        Testimonials
                      </Text>
                      <Flex gap={2}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevTestimonial} aria-label="Previous testimonial">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextTestimonial} aria-label="Next testimonial">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Flex>
                    </Flex>

                    <AnimatePresence mode="wait">
                      <PerspectiveFlip
                        key={currentTestimonial}
                        axis="y"
                        trigger="auto"
                        duration={reducedMotion ? 0 : 0.6}
                        className="w-full"
                      >
                        {testimonials[currentTestimonial] && (
                          <div className="p-6 rounded-2xl border relative" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="absolute top-4 right-4 text-muted-foreground/30" style={{ fontSize: '3rem', lineHeight: 1 }}>
                              "
                            </div>
                            <div className="relative z-10">
                              <Text color="foreground" size="lg" style={{ lineHeight: 1.7, fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
                                {testimonials[currentTestimonial].quote}
                              </Text>
                              <div className="mt-4 flex items-center gap-3">
                                {testimonials[currentTestimonial].avatar && (
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].author} />
                                    <AvatarFallback className="text-sm">{testimonials[currentTestimonial].author.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div>
                                  <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-sans)' }}>
                                    {testimonials[currentTestimonial].author}
                                  </Text>
                                  {testimonials[currentTestimonial].role && (
                                    <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>
                                      {testimonials[currentTestimonial].role}
                                    </Text>
                                  )}
                                  {testimonials[currentTestimonial].company && (
                                    <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>
                                      {testimonials[currentTestimonial].company}
                                    </Text>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </PerspectiveFlip>
                    </AnimatePresence>

                    {/* Dots */}
                    <Flex center gap={2}>
                      {testimonials.map((_, i) => (
                        <motion.button
                          key={i}
                          onClick={() => goToTestimonial(i)}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{
                            background: i === currentTestimonial ? accent : 'var(--muted-foreground/30)',
                            width: i === currentTestimonial ? 20 : 8,
                          }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={`Go to testimonial ${i + 1}`}
                        />
                      ))}
                    </Flex>
                  </Stack>
                </div>
              </motion.div>
            )}

            {/* Proof Points - Badge style - ALWAYS VISIBLE */}
            {visibleProofs.length > 0 && kpiProofs.length === 0 && testimonials.length === 0 && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.7 }}
                className="w-full"
              >
                <Stack space={2.5}>
                  {visibleProofs.map((proof, index) => (
                    <motion.div
                      key={proof.id}
                      initial={reducedMotion ? {} : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring.standard, delay: 0.7 + index * 0.05 }}
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--muted/50)', border: '1px solid var(--border)' }}>
                        {proof.icon && (
                          <motion.div
                            initial={reducedMotion ? {} : { scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ ...spring.bouncy, delay: 0.8 + index * 0.05 }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                              color: 'var(--primary-foreground)',
                              fontSize: '1rem',
                            }}
                          >
                            {proof.icon}
                          </motion.div>
                        )}
                        <Flex column gap={0.5} flex={1} className="min-w-0">
                          <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-sans)' }}>
                            {proof.title}
                          </Text>
                          {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{proof.value}</Text>}
                          {proof.description && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{proof.description}</Text>}
                        </Flex>
                      </div>
                    </motion.div>
                  ))}
                </Stack>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Mobile: Single column stacked */}
        <div className="lg:hidden space-y-8">
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.1 }}
            className="text-center space-y-4"
          >
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-full -inset-1"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${accent}15, transparent 70%)`,
                  filter: 'blur(16px)',
                  transform: 'scale(1.2)',
                }}
              />
              <Avatar className="h-24 w-24 ring-4" ringColor={accent}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback className="text-3xl font-medium">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <Stack space={2} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.2 }}
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {profile.name}
              </motion.h1>
              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.3 }}
                  className="text-lg text-muted-foreground font-medium max-w-xs"
                  style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                >
                  {profile.headline}
                </motion.p>
              )}
              {profile.company && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.35 }}
                  className="text-base text-primary font-semibold"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {profile.company}
                </motion.p>
              )}
            </Stack>
          </motion.div>

          {/* Mobile KPIs - ALWAYS VISIBLE */}
          {kpiProofs.length > 0 && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.3 }}
            >
              <Grid cols={1} gap={3}>
                {kpiProofs.map((kpi, index) => (
                  <TiltCard key={kpi.id} maxTilt={reducedMotion ? 0 : 4} scale={1.015} className="h-auto">
                    <div className="p-4 rounded-xl border relative overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>
                        {kpi.title}
                      </Text>
                      <div className="flex items-baseline gap-1">
                        <motion.span
                          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ ...spring.bouncy, delay: 0.4 + index * 0.08 }}
                          className="text-2xl font-bold"
                          style={{ fontFamily: 'var(--font-sans)', color: accent }}
                        >
                          {kpi.value}
                        </motion.span>
                        {kpi.description && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{kpi.description}</Text>}
                      </div>
                    </div>
                  </TiltCard>
                ))}
              </Grid>
            </motion.div>
          )}

          {/* Mobile Bio - ALWAYS VISIBLE */}
          {profile.bio && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.4 }}
            >
              <div className="p-5 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <Text size="base" color="foreground" style={{ lineHeight: 1.75, fontFamily: 'var(--font-sans)' }}>
                  {profile.bio}
                </Text>
              </div>
            </motion.div>
          )}

          {/* Mobile Links - ALWAYS VISIBLE */}
          {visibleLinks.length > 0 && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.5 }}
            >
              <Stack space={3}>
                {visibleLinks.map((link, index) => (
                  <MagneticCard
                    key={link.id}
                    radius={100}
                    strength={reducedMotion ? 0 : 0.1}
                    className={cn('w-full', isPreview && 'opacity-80')}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                    }}
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full px-4 py-3.5 text-left group no-underline flex items-center gap-3"
                      style={{
                        borderRadius: '12px',
                        fontFamily: 'var(--font-sans)',
                        display: 'flex',
                      }}
                      onMouseEnter={() => isPreview && onLinkClick?.(link)}
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 rounded-xl"
                        style={{ boxShadow: `0 0 0 2px ${accent}30, 0 8px 32px -8px ${accent}20` }}
                        whileHover={{ opacity: 1 }}
                        whileFocus={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <Flex align="center" gap={3} className="relative z-10 flex-1">
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ ...spring.bouncy, delay: index * 0.04 }}
                          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                            color: 'var(--primary-foreground)',
                            fontWeight: 600,
                            fontSize: '1.125rem',
                            boxShadow: `0 4px 16px -4px ${accent}`,
                          }}
                        >
                          {link.icon || link.label.charAt(0).toUpperCase()}
                        </motion.div>
                        <Flex column gap={1} flex={1} className="min-w-0">
                          <Text weight="medium" className="truncate group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem' }}>
                            {link.label}
                          </Text>
                          <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                            {link.url}
                          </Text>
                        </Flex>
                      </Flex>
                    </a>
                  </MagneticCard>
                ))}
              </Stack>
            </motion.div>
          )}

          {/* Mobile Testimonials - ALWAYS VISIBLE */}
          {testimonials.length > 0 && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.6 }}
            >
              <div className="relative">
                <Stack space={4}>
                  <Flex between align="center">
                    <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>
                      Testimonials
                    </Text>
                    <Flex gap={2}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevTestimonial} aria-label="Previous testimonial">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextTestimonial} aria-label="Next testimonial">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Flex>
                  </Flex>

                  <AnimatePresence mode="wait">
                    <PerspectiveFlip key={currentTestimonial} axis="y" trigger="auto" duration={reducedMotion ? 0 : 0.6} className="w-full">
                      {testimonials[currentTestimonial] && (
                        <div className="p-5 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                          <div className="absolute top-3 right-3 text-muted-foreground/30" style={{ fontSize: '2.5rem', lineHeight: 1 }}>"</div>
                          <div className="relative z-10">
                            <Text color="foreground" size="base" style={{ lineHeight: 1.7, fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
                              {testimonials[currentTestimonial].quote}
                            </Text>
                            <div className="mt-3 flex items-center gap-2">
                              {testimonials[currentTestimonial].avatar && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].author} />
                                  <AvatarFallback className="text-xs">{testimonials[currentTestimonial].author.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <Text weight="semibold" size="xs" style={{ fontFamily: 'var(--font-sans)' }}>
                                  {testimonials[currentTestimonial].author}
                                </Text>
                                {testimonials[currentTestimonial].role && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{testimonials[currentTestimonial].role}</Text>}
                                {testimonials[currentTestimonial].company && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{testimonials[currentTestimonial].company}</Text>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </PerspectiveFlip>
                  </AnimatePresence>

                  <Flex center gap={2}>
                    {testimonials.map((_, i) => (
                      <motion.button
                        key={i}
                        onClick={() => goToTestimonial(i)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{
                          background: i === currentTestimonial ? accent : 'var(--muted-foreground/30)',
                          width: i === currentTestimonial ? 20 : 8,
                        }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Go to testimonial ${i + 1}`}
                      />
                    ))}
                  </Flex>
                </Stack>
              </div>
            </motion.div>
          )}

          {/* Mobile Proofs - ALWAYS VISIBLE */}
          {visibleProofs.length > 0 && kpiProofs.length === 0 && testimonials.length === 0 && (
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.7 }}
            >
              <Stack space={2.5}>
                {visibleProofs.map((proof, index) => (
                  <motion.div
                    key={proof.id}
                    initial={reducedMotion ? {} : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring.standard, delay: 0.7 + index * 0.05 }}
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--muted/50)', border: '1px solid var(--border)' }}>
                      {proof.icon && (
                        <motion.div
                          initial={reducedMotion ? {} : { scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ ...spring.bouncy, delay: 0.8 + index * 0.05 }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, color: 'var(--primary-foreground)', fontSize: '1rem' }}
                        >
                          {proof.icon}
                        </motion.div>
                      )}
                      <Flex column gap={0.5} flex={1} className="min-w-0">
                        <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-sans)' }}>{proof.title}</Text>
                        {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{proof.value}</Text>}
                        {proof.description && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{proof.description}</Text>}
                      </Flex>
                    </div>
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          )}

          {/* Subdomain */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.8 }}
            className="text-center text-sm text-muted-foreground pt-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {profile.subdomain}.unool.co
          </motion.div>
        </div>
      </div>
    </div>
  );
}

FounderTemplate.displayName = 'FounderTemplate';