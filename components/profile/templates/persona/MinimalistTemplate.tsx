'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { Flex, Stack, Box } from '@/components/ui/layout';
import { Heading, Text, Overline } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { spring, slideUp } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ExternalLink, ChevronRight } from 'lucide-react';

export function MinimalistTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'var(--color-primary)';
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 20);
  const visibleProofs = profile.proofs.slice(0, 5);

  const showAvatar = profile.avatarUrl || (profile.name && profile.name.length > 0);
  const showBio = profile.bio && profile.bio.length > 0;

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center px-4 py-12"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '9999px',
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
    >
      <Stack
        space={6}
        className="relative w-full max-w-[400px]"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Avatar - only if provided */}
        {showAvatar && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring.standard, delay: 0.1 }}
            className="text-center"
          >
            <div className="relative inline-block">
              <Avatar className="h-20 w-20 ring-2 relative z-10" ringColor={accent}>
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback className="text-2xl font-medium">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </motion.div>
        )}

        {/* Name - only if provided */}
        {profile.name && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: showAvatar ? 0.2 : 0.1 }}
            className="text-center"
          >
            <Stack space={2} align="center">
              <motion.h1
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.standard, delay: 0.1 }}
                className="text-xl sm:text-2xl font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {profile.name}
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.2 }}
                  className="text-sm text-muted-foreground font-medium max-w-xs mx-auto"
                  style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                >
                  {profile.headline}
                </motion.p>
              )}
            </Stack>
          </motion.div>
        )}

        {/* Bio - only if provided */}
        {showBio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: (showAvatar ? 0.3 : 0.2) }}
            className="text-center"
          >
            <Text size="sm" color="foreground" style={{ lineHeight: 1.6, fontFamily: 'var(--font-sans)', textAlign: 'center', maxWidth: '100%' }}>
              {profile.bio}
            </Text>
          </motion.div>
        )}

        {/* Links - Pure Pills */}
        {visibleLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: (showAvatar || showBio) ? 0.4 : 0.1 }}
          >
            <Stack space={2.5} className="w-full">
              {visibleLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={reducedMotion ? {} : { opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...spring.standard, delay: ((showAvatar || showBio) ? 0.4 : 0.1) + index * 0.05 }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-5 py-3.5 group no-underline flex items-center justify-center gap-3"
                    style={{
                      borderRadius: '9999px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      background: 'var(--muted)',
                      color: 'var(--foreground)',
                      border: '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={() => isPreview && onLinkClick?.(link)}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid';
                      e.currentTarget.style.outlineOffset = '2px';
                      e.currentTarget.style.outlineColor = accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    {/* Hover effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ background: accent, opacity: 0 }}
                      whileHover={{ opacity: 0.08 }}
                      transition={{ duration: 0.15 }}
                    />

                    {/* Icon */}
                    <motion.div
                      initial={reducedMotion ? {} : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...spring.bouncy, delay: index * 0.04 }}
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                        color: 'var(--primary-foreground)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: `0 2px 8px -2px ${accent}`,
                      }}
                    >
                      {link.icon || link.label.charAt(0).toUpperCase()}
                    </motion.div>

                    {/* Label */}
                    <motion.span
                      initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring.gentle, delay: index * 0.03 }}
                      className="truncate group-hover:text-primary transition-colors"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {link.label}
                    </motion.span>

                    {/* External link indicator */}
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring.snappy }}
                      style={{ color: accent, opacity: 0, fontSize: '1rem' }}
                    >
                      →
                    </motion.span>
                  </a>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points - Minimal inline */}
        {visibleProofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
            className="w-full"
          >
            <Flex gap={2} className="flex-wrap justify-center" wrap>
              {visibleProofs.map((proof, index) => (
                <motion.div
                  key={proof.id}
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.6 + index * 0.05 }}
                >
                  <Badge
                    variant="outline"
                    className={cn('gap-1.5 py-1.5 px-3', isPreview && 'opacity-80')}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.75rem',
                      borderColor: `${accent}40`,
                      background: `linear-gradient(135deg, ${accent}05, ${accent}02)`,
                    }}
                  >
                    {proof.icon && <span style={{ fontSize: '0.875rem' }}>{proof.icon}</span>}
                    {proof.title}
                    {proof.value && (
                      <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-mono)' }}>
                        {proof.value}
                      </Text>
                    )}
                  </Badge>
                </motion.div>
              ))}
            </Flex>
          </motion.div>
        )}

        {/* Subdomain indicator */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.8 }}
          className="text-center text-xs text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {profile.subdomain}.unool.co
        </motion.div>
      </Stack>
    </div>
  );
}

MinimalistTemplate.displayName = 'MinimalistTemplate';