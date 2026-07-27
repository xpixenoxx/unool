'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text, Heading, Overline } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TiltCard } from '@/components/ui/3d';
import { spring, slideUp } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Heart, Users, Target, TrendingUp, Award, Share2, ExternalLink, Globe, BookOpen, Leaf, Shield, Zap, Star } from 'lucide-react';

export function NGOTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'oklch(0.55 0.22 145)'; // Nature green
  const secondaryAccent = 'oklch(0.65 0.22 35)'; // Warm amber
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 12);
  const visibleProofs = profile.proofs.slice(0, 8);

  // Extract mission/impact data from proofs
  const missionProof = profile.proofs.find(p => p.title.toLowerCase().includes('mission'));
  const impactProofs = profile.proofs.filter(p => p.type === 'metric').slice(0, 4);
  const partnerProofs = profile.proofs.filter(p => p.type === 'badge' || p.title.toLowerCase().includes('partner')).slice(0, 6);

  // Social links (donate, volunteer, etc.)
  const socialLinks = visibleLinks.filter(l =>
    l.label.toLowerCase().includes('donate') ||
    l.label.toLowerCase().includes('volunteer') ||
    l.label.toLowerCase().includes('support') ||
    l.label.toLowerCase().includes('join')
  ).slice(0, 4);

  const regularLinks = visibleLinks.filter(l =>
    !l.label.toLowerCase().includes('donate') &&
    !l.label.toLowerCase().includes('volunteer') &&
    !l.label.toLowerCase().includes('support') &&
    !l.label.toLowerCase().includes('join')
  ).slice(0, 8);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '12px',
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
    >
      {/* Background: Nature-inspired gradient + organic patterns */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${accent}25 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[200px] opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${secondaryAccent}20 0%, transparent 70%)` }}
        />
        {/* Organic leaf pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000' fillOpacity='0.1'%3E%3Cpath d='M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90c-22.1 0-40-17.9-40-40S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40zm0-2c18.7 0 34-15.3 34-34S68.7 12 50 12 16 27.3 16 50s15.3 34 34 34zm0-2c13.3 0 24-10.7 24-24S63.3 14 50 14 26 24.7 26 50s10.7 24 24 24z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Stack
        space={8}
        className="relative max-w-[720px] mx-auto px-4 py-12 sm:py-16"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Hero: Avatar + Name + Mission */}
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
                  className="absolute inset-0 rounded-full -inset-2"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${accent}20, transparent 70%)`,
                    filter: 'blur(20px)',
                    transform: 'scale(1.3)',
                  }}
                />
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-offset-2 relative z-10" ringColor={accent}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="text-4xl sm:text-5xl font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
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
                className="text-3xl sm:text-4xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {profile.name}
              </motion.h1>

              {profile.headline && (
                <motion.p
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.3 }}
                  className="text-base sm:text-lg text-muted-foreground font-medium max-w-2xl mx-auto"
                  style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                >
                  {profile.headline}
                </motion.p>
              )}

              {/* Mission Statement - prominent */}
              {missionProof && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.4 }}
                  className="max-w-2xl"
                >
                  <div className="relative p-4 sm:p-5 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}08 0%, ${secondaryAccent}05 100%)` }} />
                    <Flex gap={2} align="start" className="relative">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`, color: 'var(--primary-foreground)' }}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', color: accent }}>
                          Our Mission
                        </Text>
                        <Text size="sm" color="foreground" style={{ lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
                          {missionProof.description || missionProof.value}
                        </Text>
                      </div>
                    </Flex>
                  </div>
                </motion.div>
              )}
            </Stack>
          </Stack>
        </motion.div>

        {/* Impact Metrics - KPI Strip */}
        {impactProofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.5 }}
          >
            <Grid cols={{ base: 2, sm: 4 }} gap={4}>
              {impactProofs.map((impact, index) => (
                <TiltCard key={impact.id} maxTilt={reducedMotion ? 0 : 4} scale={1.015} className="h-auto">
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring.bouncy, delay: 0.5 + index * 0.08 }}
                    className="p-4 rounded-xl border relative overflow-hidden text-center"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${accent}08 0%, transparent 70%)` }} />
                    <div className="relative z-10">
                      <Flex center gap={1.5} className="mb-2">
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`, color: 'var(--primary-foreground)' }}>
                          {impact.icon || <TrendingUp className="w-4 h-4" />}
                        </span>
                      </Flex>
                      <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', color: accent }}>
                        {impact.title}
                      </Text>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.bouncy, delay: 0.6 + index * 0.08 }}
                        className="text-3xl font-bold"
                        style={{ fontFamily: 'var(--font-sans)', color: accent }}
                      >
                        {impact.value}
                      </motion.span>
                      {impact.description && (
                        <Text size="xs" color="muted" className="mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
                          {impact.description}
                        </Text>
                      )}
                    </div>
                  </motion.div>
                </TiltCard>
              ))}
            </Grid>
          </motion.div>
        )}

        {/* Bio Card */}
        {profile.bio && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.6 }}
            className="w-full"
          >
            <div
              className="relative p-5 sm:p-6 rounded-xl border overflow-hidden"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--card)',
                boxShadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.08)',
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(180deg, ${accent}, ${secondaryAccent})` }} />
              <Text size="base" color="foreground" style={{ lineHeight: 1.75, fontFamily: 'var(--font-sans)', textAlign: 'left', paddingLeft: '0.5rem' }}>
                {profile.bio}
              </Text>
            </div>
          </motion.div>
        )}

        {/* Action Links - Donate, Volunteer, etc. - Prominent buttons */}
        {socialLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.7 }}
            className="w-full"
          >
            <Stack space={3} className="w-full">
              {socialLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={reducedMotion ? {} : { opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...spring.standard, delay: 0.7 + index * 0.06 }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-5 py-4 text-left group no-underline flex items-center gap-4"
                    style={{
                      borderRadius: '12px',
                      fontFamily: 'var(--font-sans)',
                      background: `linear-gradient(135deg, ${accent}15, ${secondaryAccent}10)`,
                      border: `2px solid ${accent}30`,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={() => (isPreview ? onLinkClick?.(link) : undefined)}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid';
                      e.currentTarget.style.outlineOffset = '2px';
                      e.currentTarget.style.outlineColor = accent;
                    }}
                    onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
                  >
                    {/* Hover glow */}
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-0"
                      style={{ boxShadow: `0 0 0 2px ${accent}40, 0 8px 32px -8px ${accent}30` }}
                      whileHover={{ opacity: 1 }}
                      whileFocus={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Icon */}
                    <motion.div
                      initial={reducedMotion ? {} : { scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ ...spring.bouncy, delay: index * 0.05 }}
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                        color: 'var(--primary-foreground)',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        boxShadow: `0 4px 16px -4px ${accent}`,
                      }}
                    >
                      {link.icon || link.label.charAt(0).toUpperCase()}
                    </motion.div>

                    {/* Label + URL */}
                    <Flex column gap={1} flex={1} className="min-w-0">
                      <Text weight="semibold" className="truncate group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem' }}>
                        {link.label}
                      </Text>
                      <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {link.url}
                      </Text>
                    </Flex>

                    {/* Arrow */}
                    <motion.span
                      initial={{ opacity: 0.3, x: -4 }}
                      whileHover={{ opacity: 1, x: 6 }}
                      whileFocus={{ opacity: 1, x: 6 }}
                      transition={{ ...spring.snappy }}
                      style={{ color: accent, fontSize: '1.5rem' }}
                    >
                      →
                    </motion.span>
                  </a>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Regular Links */}
        {regularLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.8 }}
            className="w-full"
          >
            <Stack space={2.5} className="w-full">
              {regularLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.8 + index * 0.05 }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-4 py-3 text-left group no-underline flex items-center gap-3"
                    style={{
                      borderRadius: '10px',
                      fontFamily: 'var(--font-sans)',
                      background: 'var(--muted/50)',
                      border: '1px solid var(--border)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={() => (isPreview ? onLinkClick?.(link) : undefined)}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid';
                      e.currentTarget.style.outlineOffset = '2px';
                      e.currentTarget.style.outlineColor = accent;
                    }}
                    onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
                  >
                    {/* Icon */}
                    <motion.div
                      initial={reducedMotion ? {} : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...spring.bouncy, delay: index * 0.04 }}
                      className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${secondaryAccent})`,
                        color: 'var(--primary-foreground)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: `0 2px 8px -2px ${accent}`,
                      }}
                    >
                      {link.icon || link.label.charAt(0).toUpperCase()}
                    </motion.div>

                    {/* Label + URL */}
                    <Flex column gap={1} flex={1} className="min-w-0">
                      <Text weight="medium" className="truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem' }}>
                        {link.label}
                      </Text>
                      <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {link.url}
                      </Text>
                    </Flex>

                    {/* Click count */}
                    <motion.span
                      style={{ color: accent, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {link.clicks > 0 && `${link.clicks.toLocaleString()} visits`}
                    </motion.span>

                    {/* Arrow */}
                    <motion.span
                      initial={{ opacity: 0.3, x: -4 }}
                      whileHover={{ opacity: 1, x: 4 }}
                      whileFocus={{ opacity: 1, x: 4 }}
                      transition={{ ...spring.snappy }}
                      style={{ color: accent, fontSize: '1.25rem' }}
                    >
                      →
                    </motion.span>
                  </a>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Partners / Supporters */}
        {partnerProofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
            className="w-full"
          >
            <Stack space={3} className="w-full">
              <Text size="xs" weight="medium" color="muted" className="uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', color: accent }}>
                Trusted by & Partners
              </Text>
              <Flex gap={3} className="flex-wrap justify-center" wrap>
                {partnerProofs.map((partner, index) => (
                  <motion.div
                    key={partner.id}
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ ...spring.bouncy, delay: 1.0 + index * 0.06 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn('gap-2 py-2 px-3', isPreview && 'opacity-80')}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.8rem',
                        borderColor: `${accent}40`,
                        background: `linear-gradient(135deg, ${accent}05, ${secondaryAccent}03)`,
                      }}
                    >
                      {partner.icon && <span style={{ fontSize: '1rem' }}>{partner.icon}</span>}
                      {partner.title}
                      {partner.value && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-mono)' }}>{partner.value}</Text>}
                    </Badge>
                  </motion.div>
                ))}
              </Flex>
            </Stack>
          </motion.div>
        )}

        {/* Subdomain indicator */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.1 }}
          className="text-center text-sm text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {profile.subdomain}.unool.co
        </motion.div>
      </Stack>
    </div>
  );
}

NGOTemplate.displayName = 'NGOTemplate';