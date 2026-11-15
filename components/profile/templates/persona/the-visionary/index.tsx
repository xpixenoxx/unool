'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, Mail, MapPin, Sparkles } from 'lucide-react';
import type { TemplateProps } from '../types';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { cleanDisplayUrl } from '@/lib/profile/templateActions';
import { rgbaFromHex, solveAccessibleAccent } from '@/lib/profile/contrast';
import { getSharedLinkIcon } from '../../utils/socialIcons';

function VisionaryContent({ profile, isPreview, onLinkClick }: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const isDark = normalized.colorMode !== 'light';

  const bgMain = isDark ? '#0B0B10' : '#FAF8F5';
  const cardBg = isDark ? 'rgba(255,255,255,0.035)' : '#FFFFFF';
  const ink = isDark ? '#F6F4EF' : '#141418';
  const muted = isDark ? '#B8B8C7' : '#52525E'; // >= 4.5:1 on both dark and white cards
  const borderCol = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,24,0.12)';

  const accentSurface = isDark ? '#0B0B10' : '#FFFFFF';
  const accent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor || '#B89B5E', accentSurface, 4.5),
    [normalized.accentColor, accentSurface],
  );

  const initials = useMemo(() => {
    const parts = (normalized.name || 'V').trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (normalized.name || 'V').slice(0, 2).toUpperCase();
  }, [normalized.name]);

  const avatarRadiusClass =
    normalized.avatarStyle === 'square'
      ? 'rounded-xl'
      : normalized.avatarStyle === 'rounded'
      ? 'rounded-3xl'
      : 'rounded-full';

  return (
    <div
      className="min-h-screen w-full relative overflow-x-clip antialiased"
      style={{
        backgroundColor: bgMain,
        color: ink,
        fontFamily: 'var(--profile-font-body)',
      }}
    >
      {/* Subtle Radial Aurora Wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 0%, ${rgbaFromHex(accent, isDark ? 0.16 : 0.1)}, transparent 75%)`,
        }}
      />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-12">
        {/* Top Masthead */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-5" style={{ borderColor: borderCol }}>
          <span
            className="text-xs uppercase tracking-[0.26em] font-semibold"
            style={{ color: accent }}
          >
            {normalized.handle || 'visionary'}
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: muted }}>
            {normalized.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{normalized.location}</span>
              </span>
            )}
            {normalized.availabilityBadge && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold"
                style={{
                  borderColor: rgbaFromHex(accent, 0.35),
                  backgroundColor: rgbaFromHex(accent, 0.1),
                  color: accent,
                }}
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                {normalized.availabilityBadge}
              </span>
            )}
          </div>
        </header>

        {/* Centered Manifesto Hero */}
        <section className="flex flex-col items-center text-center space-y-6">
          <div
            className={`w-28 h-28 sm:w-32 sm:h-32 overflow-hidden border p-1 ${avatarRadiusClass}`}
            style={{
              borderColor: rgbaFromHex(accent, 0.45),
              backgroundColor: cardBg,
            }}
          >
            {normalized.avatarUrl ? (
              <img
                src={normalized.avatarUrl}
                alt={`${normalized.name} portrait`}
                className={`w-full h-full object-cover ${avatarRadiusClass}`}
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-semibold ${avatarRadiusClass}`}
                style={{
                  backgroundColor: rgbaFromHex(accent, 0.14),
                  color: accent,
                  fontFamily: 'var(--profile-font-heading)',
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {(normalized.role || normalized.company) && (
            <p className="text-xs sm:text-sm uppercase tracking-[0.22em] font-medium" style={{ color: accent }}>
              {[normalized.role, normalized.company].filter(Boolean).join(' · ')}
            </p>
          )}

          <h1
            className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.04] max-w-3xl break-words"
            style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
          >
            {normalized.name}
          </h1>

          {normalized.headline && normalized.headline !== normalized.role && (
            <p className="text-lg sm:text-2xl font-light leading-relaxed max-w-2xl" style={{ color: ink }}>
              {normalized.headline}
            </p>
          )}

          {normalized.sectionVisibility.bio && normalized.bio && (
            <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: muted }}>
              {normalized.bio}
            </p>
          )}

          {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
            <OpenToBadges
              intents={normalized.openTo}
              accentColor={accent}
              variant={isDark ? 'obsidian' : 'light'}
              className="justify-center"
            />
          )}

          {normalized.sectionVisibility.contact && normalized.hasContactChannel && (
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={openContact}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: accent,
                  color: isDark ? '#0B0B10' : '#FFFFFF',
                }}
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>Connect directly</span>
              </button>
              {normalized.showEmail && normalized.email && (
                <a
                  href={`mailto:${normalized.email}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ borderColor: borderCol, color: ink, backgroundColor: cardBg }}
                >
                  <span>{normalized.email}</span>
                </a>
              )}
            </div>
          )}
        </section>

        {/* Proof Metrics Ribbon (Shown ONLY if real proof points exist) */}
        {normalized.sectionVisibility.proof && normalized.proofs.length > 0 && (
          <section aria-labelledby="visionary-proof-heading" className="space-y-4">
            <h2
              id="visionary-proof-heading"
              className="text-xs uppercase tracking-[0.22em] font-semibold text-center"
              style={{ color: muted }}
            >
              Milestones & Proof
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {normalized.proofs.map((proof, idx) => (
                <div
                  key={proof.id || idx}
                  className="rounded-2xl border p-6 text-center space-y-1.5"
                  style={{ backgroundColor: cardBg, borderColor: borderCol }}
                >
                  <div
                    className="text-2xl sm:text-3xl font-semibold tabular-nums"
                    style={{ fontFamily: 'var(--profile-font-heading)', color: accent }}
                  >
                    {proof.value}
                  </div>
                  <div className="text-xs uppercase tracking-[0.16em] font-semibold" style={{ color: ink }}>
                    {proof.label}
                  </div>
                  {proof.description && (
                    <p className="text-xs leading-relaxed pt-1" style={{ color: muted }}>
                      {proof.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Links */}
        {normalized.sectionVisibility.links && normalized.links.length > 0 && (
          <section aria-labelledby="visionary-links-heading" className="space-y-4">
            <h2
              id="visionary-links-heading"
              className="text-xs uppercase tracking-[0.22em] font-semibold text-center"
              style={{ color: muted }}
            >
              Channels & Work
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {normalized.links.map((link, idx) => (
                <a
                  key={link.id || idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                  className="group rounded-2xl border p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: cardBg, borderColor: borderCol }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                      style={{
                        borderColor: rgbaFromHex(accent, 0.3),
                        backgroundColor: rgbaFromHex(accent, 0.08),
                        color: accent,
                      }}
                    >
                      {getSharedLinkIcon(link.label, link.url, link.icon, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base truncate" style={{ color: ink }}>
                        {link.label}
                      </div>
                      <div className="text-xs truncate" style={{ color: muted }}>
                        {cleanDisplayUrl(link.url)}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: muted }}
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
          <section aria-labelledby="visionary-activity-heading" className="space-y-4">
            <h2
              id="visionary-activity-heading"
              className="text-xs uppercase tracking-[0.22em] font-semibold text-center"
              style={{ color: muted }}
            >
              Recent Dispatches
            </h2>
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant={isDark ? 'obsidian' : 'editorial'}
              accentColor={accent}
              autoScroll={!isPreview}
            />
          </section>
        )}

        {/* Clean Minimal Footer (Respects whiteLabel; no duplicate UNOOL pill) */}
        <footer
          className="border-t pt-6 flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{ borderColor: borderCol, color: muted }}
        >
          <span>{normalized.handle || profile?.subdomain || 'profile'}</span>
          {normalized.timezone && <span>{normalized.timezone}</span>}
        </footer>
      </main>
    </div>
  );
}

export function VisionaryTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#0B0B10"
      isDark
      defaultAccent="#D4B876"
      isPreview={props.isPreview}
    >
      <VisionaryContent {...props} />
    </ProfileTemplateShell>
  );
}
