'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Clock, ExternalLink, Mail, MapPin, Sparkles } from 'lucide-react';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon } from '@/components/profile/templates/utils/socialIcons';
import { pickReadableText, rgbaFromHex, solveAccessibleAccent } from '@/lib/profile/contrast';
import type { ProfileLink, TemplateProps } from '@/components/profile/templates/types';
import type { VariantKey } from '@/components/profile/templates/activityVariants';

export type EditorialArchetypeId =
  | 'lover'
  | 'lone'
  | 'energy'
  | 'vision'
  | 'the-hustler'
  | 'the-aesthete'
  | 'the-creator'
  | 'the-voice';

interface ArchetypePalette {
  bg: string;
  card: string;
  mutedCard: string;
  text: string;
  textMuted: string;
  border: string;
  secondaryAccent?: string;
}

interface EditorialArchetypeConfig {
  id: EditorialArchetypeId;
  defaultAccent: string;
  defaultMode: 'dark' | 'light';
  light: ArchetypePalette;
  dark: ArchetypePalette;
  headingFont: 'serif' | 'grotesk' | 'syne' | 'editorial';
  backdrop: 'blobs' | 'grid' | 'energy-grid' | 'dual-aura' | 'emerald-grid' | 'violet-wash' | 'spotlight' | 'waveform';
  cardRadius: string;
  badgeLabel: string;
  activityVariant: VariantKey;
  cornerBrackets?: boolean;
}

const ARCHETYPES: Record<EditorialArchetypeId, EditorialArchetypeConfig> = {
  lover: {
    id: 'lover',
    defaultAccent: '#E85D75',
    defaultMode: 'light',
    light: {
      bg: '#FFF8F6',
      card: '#FFFFFF',
      mutedCard: '#FFF0EC',
      text: '#2D1B1B',
      textMuted: '#5C3D3D',
      border: '#F0D5CE',
    },
    dark: {
      bg: '#1A1013',
      card: '#24171B',
      mutedCard: '#2E1E23',
      text: '#FDF2F4',
      textMuted: '#D6B8C0',
      border: '#442C34',
    },
    headingFont: 'serif',
    backdrop: 'blobs',
    cardRadius: '28px',
    badgeLabel: 'Journal & Studio',
    activityVariant: 'lover',
  },
  lone: {
    id: 'lone',
    defaultAccent: '#3B82F6',
    defaultMode: 'dark',
    light: {
      bg: '#F4F7FC',
      card: '#FFFFFF',
      mutedCard: '#EDF2FA',
      text: '#0F172A',
      textMuted: '#475569',
      border: '#CBD5E1',
    },
    dark: {
      bg: '#0A0F1A',
      card: '#0F1729',
      mutedCard: '#152036',
      text: '#F1F5F9',
      textMuted: '#B8C4D9',
      border: '#23334F',
    },
    headingFont: 'grotesk',
    backdrop: 'grid',
    cardRadius: '24px',
    badgeLabel: 'Independent Focus',
    activityVariant: 'lone',
    cornerBrackets: true,
  },
  energy: {
    id: 'energy',
    defaultAccent: '#F59E0B',
    defaultMode: 'dark',
    light: {
      bg: '#FAFAF9',
      card: '#FFFFFF',
      mutedCard: '#F4F4F5',
      text: '#111827',
      textMuted: '#4B5563',
      border: '#E4E4E7',
    },
    dark: {
      bg: '#0C0C0E',
      card: '#141418',
      mutedCard: '#1B1B22',
      text: '#FAFAFA',
      textMuted: '#C7C7D1',
      border: '#2B2B35',
    },
    headingFont: 'syne',
    backdrop: 'energy-grid',
    cardRadius: '20px',
    badgeLabel: 'Momentum',
    activityVariant: 'energy',
  },
  vision: {
    id: 'vision',
    defaultAccent: '#C026D3',
    defaultMode: 'light',
    light: {
      bg: '#FAFAFC',
      card: 'rgba(255, 255, 255, 0.92)',
      mutedCard: '#F3EFFA',
      text: '#18182F',
      textMuted: '#4A476A',
      border: '#DFD8EE',
      secondaryAccent: '#7928CA',
    },
    dark: {
      bg: '#090914',
      card: '#121225',
      mutedCard: '#191932',
      text: '#F5F3FF',
      textMuted: '#C4BEE2',
      border: '#2B284E',
      secondaryAccent: '#7928CA',
    },
    headingFont: 'grotesk',
    backdrop: 'dual-aura',
    cardRadius: '28px',
    badgeLabel: 'Future Systems',
    activityVariant: 'vision',
  },
  'the-hustler': {
    id: 'the-hustler',
    defaultAccent: '#10B981',
    defaultMode: 'dark',
    light: {
      bg: '#F3FAF7',
      card: '#FFFFFF',
      mutedCard: '#E7F5EE',
      text: '#0C2119',
      textMuted: '#355748',
      border: '#CBE3D7',
    },
    dark: {
      bg: '#080F0C',
      card: '#0F1A15',
      mutedCard: '#16241D',
      text: '#ECFDF5',
      textMuted: '#A8DEC9',
      border: '#21382D',
    },
    headingFont: 'grotesk',
    backdrop: 'emerald-grid',
    cardRadius: '22px',
    badgeLabel: 'Growth & Execution',
    activityVariant: 'hustler',
  },
  'the-aesthete': {
    id: 'the-aesthete',
    defaultAccent: '#7C3AED',
    defaultMode: 'light',
    light: {
      bg: '#FAF8FF',
      card: '#FFFFFF',
      mutedCard: '#F4F0FC',
      text: '#261835',
      textMuted: '#56416E',
      border: '#E5DCF0',
    },
    dark: {
      bg: '#130E1A',
      card: '#1C1526',
      mutedCard: '#251C32',
      text: '#F5F3FF',
      textMuted: '#CFC2E3',
      border: '#382B4C',
    },
    headingFont: 'editorial',
    backdrop: 'violet-wash',
    cardRadius: '28px',
    badgeLabel: 'Curated Gallery',
    activityVariant: 'aesthete',
  },
  'the-creator': {
    id: 'the-creator',
    defaultAccent: '#EA580C',
    defaultMode: 'dark',
    light: {
      bg: '#FFFBF7',
      card: '#FFFFFF',
      mutedCard: '#FFF3EB',
      text: '#1C130D',
      textMuted: '#5B4639',
      border: '#F0DED2',
    },
    dark: {
      bg: '#0E0D0D',
      card: '#161414',
      mutedCard: '#1F1B1A',
      text: '#FAFAF9',
      textMuted: '#D6CFC9',
      border: '#2E2826',
    },
    headingFont: 'syne',
    backdrop: 'spotlight',
    cardRadius: '24px',
    badgeLabel: 'Creator Spotlight',
    activityVariant: 'creator',
  },
  'the-voice': {
    id: 'the-voice',
    defaultAccent: '#8B5CF6',
    defaultMode: 'dark',
    light: {
      bg: '#FAF8F4',
      card: '#FFFFFF',
      mutedCard: '#F2EFE8',
      text: '#1B1826',
      textMuted: '#4D4761',
      border: '#DFDBD0',
      secondaryAccent: '#B45309',
    },
    dark: {
      bg: '#0A0A0F',
      card: '#13111C',
      mutedCard: '#1B1827',
      text: '#F5F0FF',
      textMuted: '#C7BCDD',
      border: '#2E2740',
      secondaryAccent: '#D4A843',
    },
    headingFont: 'serif',
    backdrop: 'waveform',
    cardRadius: '26px',
    badgeLabel: 'Editorial Voice',
    activityVariant: 'voice',
  },
};

function EditorialCardContent({
  config,
  isPreview,
  onLinkClick,
}: {
  config: EditorialArchetypeConfig;
  isPreview?: boolean;
  onLinkClick?: (link: ProfileLink) => void;
}) {
  const shell = useProfileShell()!;
  const { normalized, openContact } = shell;
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const effectiveIsDark =
    normalized.colorMode === 'dark'
      ? true
      : normalized.colorMode === 'light'
        ? false
        : config.defaultMode === 'dark';

  const palette = effectiveIsDark ? config.dark : config.light;
  const solidSurfaceHex = palette.mutedCard.startsWith('#')
    ? palette.mutedCard
    : palette.card.startsWith('#')
      ? palette.card
      : palette.bg;

  const accessibleAccent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor, solidSurfaceHex, 4.6, config.defaultAccent),
    [normalized.accentColor, solidSurfaceHex, config.defaultAccent]
  );

  const primaryCtaFg = useMemo(() => pickReadableText(accessibleAccent), [accessibleAccent]);

  const avatarRadiusClass =
    normalized.avatarStyle === 'square'
      ? 'rounded-xl'
      : normalized.avatarStyle === 'rounded'
        ? 'rounded-2xl'
        : 'rounded-full';

  const defaultHeadingStyle: React.CSSProperties =
    config.headingFont === 'serif' || config.headingFont === 'editorial'
      ? { fontFamily: 'var(--font-cormorant), Georgia, serif' }
      : config.headingFont === 'syne'
        ? { fontFamily: 'var(--font-syne), var(--font-geist), sans-serif' }
        : { fontFamily: 'var(--profile-font-heading)' };

  const primaryLinks = normalized.links.filter((l) => l.isPrimary || l.category === 'primary');
  const secondaryLinks = normalized.links.filter((l) => !l.isPrimary && l.category !== 'primary');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setTilt({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14 overflow-x-clip"
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {/* Decorative Ambient Backdrop (pointer-events-none + aria-hidden) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {(config.backdrop === 'grid' || config.backdrop === 'energy-grid' || config.backdrop === 'emerald-grid') && (
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `linear-gradient(${rgbaFromHex(accessibleAccent, effectiveIsDark ? 0.09 : 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${rgbaFromHex(accessibleAccent, effectiveIsDark ? 0.09 : 0.08)} 1px, transparent 1px)`,
              backgroundSize: config.backdrop === 'energy-grid' ? '72px 72px' : '56px 56px',
            }}
          />
        )}

        {(config.backdrop === 'blobs' || config.backdrop === 'violet-wash' || config.backdrop === 'dual-aura' || config.backdrop === 'spotlight') && (
          <>
            <div
              className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-30 motion-safe:transition-transform motion-safe:duration-500"
              style={{
                background: `radial-gradient(circle, ${accessibleAccent} 0%, transparent 70%)`,
                transform: `translate(${tilt.x * 24}px, ${tilt.y * 24}px)`,
              }}
            />
            <div
              className="absolute -bottom-32 -left-32 w-[360px] h-[360px] rounded-full blur-3xl opacity-25 motion-safe:transition-transform motion-safe:duration-500"
              style={{
                background: `radial-gradient(circle, ${palette.secondaryAccent || accessibleAccent} 0%, transparent 70%)`,
                transform: `translate(${tilt.x * -18}px, ${tilt.y * -18}px)`,
              }}
            />
          </>
        )}

        {config.backdrop === 'waveform' && (
          <svg
            viewBox="0 0 1200 180"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-40 opacity-20"
            fill="none"
          >
            <path
              d="M0,90 C180,30 340,150 520,90 C700,30 880,150 1060,90 C1120,70 1160,80 1200,90 L1200,180 L0,180 Z"
              fill={accessibleAccent}
            />
          </svg>
        )}
      </div>

      {/* Main Card Surface */}
      <main
        className="relative z-10 w-full max-w-4xl motion-safe:transition-transform motion-safe:duration-300"
        style={{
          backgroundColor: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: config.cardRadius,
          boxShadow: effectiveIsDark
            ? `0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px ${rgbaFromHex(accessibleAccent, 0.12)}`
            : `0 20px 50px rgba(15, 23, 42, 0.08)`,
        }}
      >
        {config.cornerBrackets && (
          <div className="pointer-events-none" aria-hidden="true">
            <span className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 rounded-tl" style={{ borderColor: accessibleAccent }} />
            <span className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 rounded-tr" style={{ borderColor: accessibleAccent }} />
            <span className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 rounded-bl" style={{ borderColor: accessibleAccent }} />
            <span className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 rounded-br" style={{ borderColor: accessibleAccent }} />
          </div>
        )}

        <div className="p-6 sm:p-10 md:p-12 space-y-8">
          {/* Header / Identity */}
          <header className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="shrink-0 relative">
              {normalized.avatarUrl ? (
                <img
                  src={normalized.avatarUrl}
                  alt={normalized.name}
                  className={`w-24 h-24 sm:w-28 sm:h-28 object-cover border-2 ${avatarRadiusClass}`}
                  style={{ borderColor: accessibleAccent }}
                />
              ) : (
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-3xl font-bold ${avatarRadiusClass}`}
                  style={{
                    backgroundColor: rgbaFromHex(accessibleAccent, 0.16),
                    color: accessibleAccent,
                    border: `2px solid ${accessibleAccent}`,
                  }}
                >
                  {normalized.initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              {!normalized.isMinimalState && (normalized.availabilityBadge || normalized.role || normalized.company) && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  {normalized.availabilityBadge && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold"
                      style={{
                        backgroundColor: rgbaFromHex(accessibleAccent, 0.15),
                        color: accessibleAccent,
                      }}
                    >
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      <span>{normalized.availabilityBadge}</span>
                    </span>
                  )}
                  {(normalized.role || normalized.company) && (
                    <span style={{ color: palette.textMuted }}>
                      {[normalized.role, normalized.company].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              )}

              <h1
                className="text-3xl sm:text-4xl md:text-[2.65rem] font-bold tracking-tight leading-tight break-words"
                style={defaultHeadingStyle}
              >
                {normalized.name}
              </h1>

              {normalized.headline && (
                <p className="text-base sm:text-lg font-medium leading-snug break-words" style={{ color: palette.textMuted }}>
                  {normalized.headline}
                </p>
              )}

              {(normalized.location || normalized.timezone) && (
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs" style={{ color: palette.textMuted }}>
                  {normalized.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{normalized.location}</span>
                    </span>
                  )}
                  {normalized.timezone && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{normalized.timezone}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Bio */}
          {normalized.bio && (
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words max-w-2xl" style={{ color: palette.text }}>
              {normalized.bio}
            </p>
          )}

          {/* Action Bar: Contact Modal + Booking / Conversation */}
          {normalized.sectionVisibility.contactCta && normalized.hasContactChannel && !normalized.isMinimalState && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openContact}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm motion-safe:transition-transform hover:opacity-95 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: accessibleAccent,
                  color: primaryCtaFg,
                }}
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>Get in Touch</span>
              </button>

              {normalized.bookingUrl && (
                <a
                  href={normalized.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
                  style={{
                    backgroundColor: palette.mutedCard,
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <span>Book a Call</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}

              {normalized.conversationUrl && (
                <a
                  href={normalized.conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
                  style={{
                    backgroundColor: palette.mutedCard,
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <span>Start a Conversation</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          {/* Open To Intents */}
          {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
            <OpenToBadges
              intents={normalized.openTo}
              accentColor={accessibleAccent}
              darkMode={effectiveIsDark}
            />
          )}

          {/* Proof Points Grid */}
          {normalized.sectionVisibility.proofs && normalized.proofs.length > 0 && (
            <section aria-label="Highlights & Proof Points" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {normalized.proofs.slice(0, 6).map((proof) => {
                const inner = (
                  <div
                    className="rounded-2xl p-4 h-full flex flex-col justify-between gap-1"
                    style={{
                      backgroundColor: palette.mutedCard,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accessibleAccent }}>
                      {proof.label}
                    </span>
                    <span className="text-base sm:text-lg font-bold break-words" style={{ color: palette.text }}>
                      {proof.value}
                    </span>
                  </div>
                );

                return proof.url ? (
                  <a
                    key={proof.id}
                    href={proof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline block hover:opacity-90 transition-opacity"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={proof.id}>{inner}</div>
                );
              })}
            </section>
          )}

          {/* Recent Studio Broadcast */}
          {normalized.sectionVisibility.activity && normalized.recentActivity && (
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant={config.activityVariant}
              isDark={effectiveIsDark}
              accentColor={accessibleAccent}
              autoScroll={normalized.raw.autoScroll}
            />
          )}

          {/* Primary Featured Links (ProfileLink v2) */}
          {primaryLinks.length > 0 && (
            <section aria-label="Featured Links" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {primaryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                  className="group flex items-center justify-between gap-3 rounded-2xl p-4 no-underline transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    backgroundColor: accessibleAccent,
                    color: primaryCtaFg,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-black/15" aria-hidden="true">
                      {getLinkIcon(link.label, link.url, link.icon ?? undefined, 'w-4 h-4')}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-semibold text-sm truncate">{link.label}</span>
                      {link.badge && (
                        <span className="text-[11px] font-medium opacity-90 block truncate">{link.badge}</span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </section>
          )}

          {/* Standard & Categorized Links */}
          {secondaryLinks.length > 0 && (
            <section aria-label="Links" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {secondaryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                  className="group flex items-center justify-between gap-3 rounded-2xl p-4 no-underline transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    backgroundColor: palette.mutedCard,
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl"
                      style={{
                        backgroundColor: rgbaFromHex(accessibleAccent, 0.14),
                        color: accessibleAccent,
                      }}
                      aria-hidden="true"
                    >
                      {getLinkIcon(link.label, link.url, link.icon ?? undefined, 'w-4 h-4')}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-semibold text-sm truncate">{link.label}</span>
                      {(link.badge || (link.category && link.category !== 'other')) && (
                        <span className="block text-[11px] capitalize truncate" style={{ color: palette.textMuted }}>
                          {link.badge || link.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 shrink-0" style={{ color: accessibleAccent }} aria-hidden="true" />
                </a>
              ))}
            </section>
          )}

          {/* Subtle footer line (only when non-minimal & not white-label) */}
          {!normalized.isMinimalState && normalized.sectionVisibility.footerBadge && !normalized.whiteLabel && (
            <footer
              className="pt-4 border-t flex items-center justify-between text-xs"
              style={{ borderColor: palette.border, color: palette.textMuted }}
            >
              <span>{normalized.handle || config.badgeLabel}</span>
              {normalized.showEmail && normalized.email && (
                <a href={`mailto:${normalized.email}`} className="underline" style={{ color: palette.text }}>
                  {normalized.email}
                </a>
              )}
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}

export function EditorialCardEngine({
  archetype,
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps & { archetype: EditorialArchetypeId }) {
  const config = ARCHETYPES[archetype] ?? ARCHETYPES.lone;
  const themeColorMode = (profile?.theme as { colorMode?: string } | undefined)?.colorMode;
  const effectiveIsDark =
    themeColorMode === 'dark'
      ? true
      : themeColorMode === 'light'
        ? false
        : config.defaultMode === 'dark';

  const palette = effectiveIsDark ? config.dark : config.light;
  const surfaceHex = palette.card.startsWith('#') ? palette.card : palette.bg;

  return (
    <ProfileTemplateShell
      profile={profile}
      surfaceHex={surfaceHex}
      isDark={effectiveIsDark}
      accentColor={accentColor}
      defaultAccent={config.defaultAccent}
      isPreview={isPreview}
    >
      <EditorialCardContent config={config} isPreview={isPreview} onLinkClick={onLinkClick} />
    </ProfileTemplateShell>
  );
}
