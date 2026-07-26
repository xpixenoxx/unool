'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Heading, Text, Overline } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { spring, slideUp } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ExternalLink, ChevronRight, Award, Github, Star, Users, Code, BookOpen } from 'lucide-react';

export function StudentTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'oklch(0.54 0.22 260)'; // Blue for students
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 10);
  const visibleProofs = profile.proofs.slice(0, 5);

  const internship = profile.company || profile.links.find(l => l.label.toLowerCase().includes('intern'))?.label;

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '6px',
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
    >
      <Stack
        space={8}
        className="relative max-w-[640px] mx-auto px-4 py-12 sm:py-16"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Hero: Avatar + Name + Headline */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.1 }}
          className="text-center"
        >
          <Stack space={3} align="center">
            {profile.avatarUrl && (
              <div className="relative inline-block mb-4">
                <div
                  className="absolute inset-0 rounded-full -inset-1"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${accent}15, transparent 70%)`,
                    filter: 'blur(16px)',
                    transform: 'scale(1.2)',
                  }}
                />
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-offset-2 relative z-10" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="text-3xl sm:text-4xl font-medium">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            <Stack space={1.5} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {profile.name}
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.3 }}
                  className="text-base sm:text-lg text-muted-foreground font-medium max-w-xl mx-auto"
                  style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                >
                  {profile.headline}
                </motion.p>
              )}

              {internship && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.35 }}
                  className="text-sm text-muted-foreground/80"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {internship}
                </motion.p>
              )}
            </Stack>
          </Stack>
        </motion.div>

        {/* Bio Card */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.4 }}
            className="w-full"
          >
            <div
              className="relative p-5 sm:p-6 rounded-xl border"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--card)',
                boxShadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.08)',
              }}
            >
              <Text size="base" color="foreground" style={{ lineHeight: 1.75, fontFamily: 'var(--font-sans)', textAlign: 'left' }}>
                {profile.bio}
              </Text>
            </div>
          </motion.div>
        )}

        {/* Links - Clean underline style */}
        {visibleLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.5 }}
            className="w-full"
          >
            <Stack space={3} className="w-full">
              {visibleLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={reducedMotion ? {} : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.5 + index * 0.06 }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-4 py-3.5 text-left group no-underline flex items-center gap-3"
                    style={{
                      borderRadius: '8px',
                      fontFamily: 'var(--font-sans)',
                      background: 'transparent',
                      border: '1px solid transparent',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={() => (isPreview ? onLinkClick?.(link) : undefined)}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid';
                      e.currentTarget.style.outlineOffset = '2px';
                      e.currentTarget.style.outlineColor = accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    {/* Hover background */}
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'var(--accent)', opacity: 0 }}
                      whileHover={{ opacity: 0.06 }}
                      transition={{ duration: 0.2 }}
                    />

                    {/* Icon */}
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
                        boxShadow: `0 2px 8px -2px ${accent}`,
                      }}
                    >
                      {link.icon || link.label.charAt(0).toUpperCase()}
                    </motion.div>

                    {/* Label + URL */}
                    <Flex column gap={1} flex={1} className="min-w-0">
                      <Text weight="medium" className="truncate group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem' }}>
                        {link.label}
                      </Text>
                      <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {link.url}
                      </Text>
                    </Flex>

                    {/* Subtle arrow */}
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      whileHover={{ opacity: 1, x: 4 }}
                      transition={{ ...spring.snappy }}
                      style={{ color: accent, fontSize: '1.25rem', opacity: 0 }}
                    >
                      →
                    </motion.span>
                  </a>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points - Simple list */}
        {visibleProofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
            className="w-full"
          >
            <Stack space={2.5} className="w-full">
              {visibleProofs.map((proof, index) => (
                <motion.div
                  key={proof.id}
                  initial={reducedMotion ? {} : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring.standard, delay: 0.6 + index * 0.05 }}
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--muted/50)', border: '1px solid var(--border)' }}>
                    {proof.icon && (
                      <motion.div
                        initial={reducedMotion ? {} : { scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...spring.bouncy, delay: 0.7 + index * 0.05 }}
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
                      {proof.value && <Text size="sm" color="muted" style={ { fontFamily: 'var(--font-sans)' } }>{proof.value}</Text>}
                    </Flex>
                  </div>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Subdomain indicator */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.8 }}
          className="text-center text-sm text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {profile.subdomain}.unool.co
        </motion.div>
      </Stack>
    </div>
  );
}

StudentTemplate.displayName = 'StudentTemplate';