'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, Crown, Mail, MapPin, ShieldCheck } from 'lucide-react';
import type { TemplateProps } from '../types';
import { getSharedLinkIcon } from '../../utils/socialIcons';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { cleanDisplayUrl } from '@/lib/profile/templateActions';
import { pickReadableText, rgbaFromHex, solveAccessibleAccent } from '@/lib/profile/contrast';

function RebellionContent({ profile, isPreview, onLinkClick }: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const isDark = normalized.colorMode !== 'light';

  const bgMain = isDark ? '#0B0609' : '#FAF5F0';
  const cardBg = isDark ? '#160D11' : '#FFFFFF';
  const cardElevated = isDark ? '#1F1218' : '#FDF9F4';
  const ink = isDark ? '#FAF5ED' : '#181014';
  const muted = isDark ? '#CFC5BC' : '#54464C'; // >= 4.5:1 on both surfaces
  const borderCol = isDark ? 'rgba(212,175,114,0.28)' : 'rgba(139,30,52,0.22)';

  const goldSurface = isDark ? '#160D11' : '#FFFFFF';
  const accent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor || '#D4AF72', goldSurface, 5.1),
    [normalized.accentColor, goldSurface],
  );
  const crimsonAccent = isDark ? '#F0566F' : '#9B1330';
  const crimsonText = pickReadableText(crimsonAccent);

  const initials = useMemo(() => {
    const parts = (normalized.name || 'R').trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (normalized.name || 'R').slice(0, 2).toUpperCase();
  }, [normalized.name]);

  const avatarRadiusClass =
    normalized.avatarStyle === 'square'
      ? 'rounded-2xl'
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
      {/* Subtle Crimson + Gold Halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background: `radial-gradient(circle at 18% 12%, ${rgbaFromHex(crimsonAccent, isDark ? 0.16 : 0.08)}, transparent 55%), radial-gradient(circle at 84% 18%, ${rgbaFromHex(accent, isDark ? 0.14 : 0.1)}, transparent 55%)`,
        }}
      />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-14">
        <div
          className="rounded-3xl border p-6 sm:p-10 space-y-10 shadow-xl"
          style={{
            backgroundColor: cardBg,
            borderColor: borderCol,
          }}
        >
          {/* Editorial Emblem Header */}
          <header
            className="flex flex-wrap items-center justify-between gap-3 border-b pb-5"
            style={{ borderColor: borderCol }}
          >
            <div className="inline-flex items-center gap-2.5">
              <Crown className="w-5 h-5" style={{ color: accent }} aria-hidden="true" />
              <span
                className="text-base sm:text-lg font-bold tracking-[0.12em] uppercase"
                style={{ fontFamily: 'var(--profile-font-heading)', color: accent }}
              >
                {normalized.handle || 'guild'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium" style={{ color: muted }}>
              {normalized.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{normalized.location}</span>
                </span>
              )}
              {normalized.availabilityBadge && (
                <span
                  className="px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    borderColor: rgbaFromHex(accent, 0.4),
                    backgroundColor: rgbaFromHex(accent, 0.1),
                    color: accent,
                  }}
                >
                  {normalized.availabilityBadge}
                </span>
              )}
            </div>
          </header>

          {/* Hero Split Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.9fr] gap-8 lg:gap-12 items-center">
            <div className="space-y-5 min-w-0 order-2 lg:order-1">
              {(normalized.role || normalized.company) && (
                <div className="inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: crimsonAccent }}>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: crimsonAccent }}
                    aria-hidden="true"
                  />
                  <span>
                    {[normalized.role, normalized.company].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}

              <h1
                className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] break-words"
                style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
              >
                {normalized.name}
              </h1>

              {normalized.headline && normalized.headline !== normalized.role && (
                <p className="text-lg sm:text-xl font-medium leading-snug" style={{ color: accent }}>
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
                />
              )}

              {normalized.sectionVisibility.contact && normalized.hasContactChannel && (
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openContact}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      backgroundColor: crimsonAccent,
                      color: crimsonText,
                    }}
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span>Connect</span>
                  </button>
                  {normalized.showEmail && normalized.email && (
                    <a
                      href={`mailto:${normalized.email}`}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-opacity hover:opacity-80"
                      style={{ borderColor: borderCol, color: accent }}
                    >
                      <span>{normalized.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Portrait Crest Card */}
            <div className="order-1 lg:order-2 flex justify-center">
              <div
                className="w-full max-w-[300px] rounded-2xl border p-6 flex flex-col items-center text-center gap-4 shadow-lg"
                style={{
                  backgroundColor: cardElevated,
                  borderColor: borderCol,
                }}
              >
                <div
                  className={`w-28 h-28 overflow-hidden border-2 p-1 ${avatarRadiusClass}`}
                  style={{ borderColor: accent }}
                >
                  {normalized.avatarUrl ? (
                    <img
                      src={normalized.avatarUrl}
                      alt={`${normalized.name} portrait`}
                      className={`w-full h-full object-cover ${avatarRadiusClass}`}
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center text-3xl font-bold ${avatarRadiusClass}`}
                      style={{
                        backgroundColor: rgbaFromHex(crimsonAccent, 0.16),
                        color: ink,
                        fontFamily: 'var(--profile-font-heading)',
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    className="text-lg font-bold"
                    style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
                  >
                    {normalized.name}
                  </div>
                  {(normalized.role || normalized.handle) && (
                    <div className="text-xs uppercase tracking-[0.16em] mt-1" style={{ color: accent }}>
                      {normalized.role || normalized.handle}
                    </div>
                  )}
                </div>

                {normalized.sectionVisibility.proof && normalized.proofs.length > 0 && (
                  <div
                    className="w-full pt-4 border-t grid grid-cols-2 gap-3 text-center"
                    style={{ borderColor: borderCol }}
                  >
                    {normalized.proofs.slice(0, 2).map((proof, idx) => (
                      <div key={proof.id || idx}>
                        <div className="text-lg font-bold tabular-nums" style={{ color: accent }}>
                          {proof.value}
                        </div>
                        <div className="text-[11px] uppercase tracking-wider truncate" style={{ color: muted }}>
                          {proof.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Marquee Proof & Credibility Ticker (Reduced-motion Safe) */}
          {normalized.sectionVisibility.proof && normalized.proofs.length > 0 && (
            <section
              aria-labelledby="rebellion-proof-heading"
              className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: cardElevated, borderColor: borderCol }}
            >
              <div className="flex items-center justify-between gap-2">
                <h2
                  id="rebellion-proof-heading"
                  className="text-xs uppercase tracking-[0.22em] font-semibold"
                  style={{ color: accent }}
                >
                  Verified Credentials
                </h2>
                <ShieldCheck className="w-4 h-4" style={{ color: accent }} aria-hidden="true" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {normalized.proofs.map((proof, idx) => (
                  <div
                    key={proof.id || idx}
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: cardBg, borderColor: borderCol }}
                  >
                    <div className="text-xl font-bold tabular-nums" style={{ color: accent }}>
                      {proof.value}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: ink }}>
                      {proof.label}
                    </div>
                    {proof.description && (
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: muted }}>
                        {proof.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Guild Channels / Links */}
          {normalized.sectionVisibility.links && normalized.links.length > 0 && (
            <section aria-labelledby="rebellion-links-heading" className="space-y-4">
              <h2
                id="rebellion-links-heading"
                className="text-xs uppercase tracking-[0.22em] font-semibold"
                style={{ color: accent }}
              >
                Channels & Links
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
                    style={{ backgroundColor: cardElevated, borderColor: borderCol }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: borderCol,
                          backgroundColor: rgbaFromHex(accent, 0.1),
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
                      style={{ color: accent }}
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Recent Activity */}
          {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
            <section aria-labelledby="rebellion-activity-heading" className="space-y-4">
              <h2
                id="rebellion-activity-heading"
                className="text-xs uppercase tracking-[0.22em] font-semibold"
                style={{ color: accent }}
              >
                Recent Work
              </h2>
              <RecentActivitySection
                activity={normalized.recentActivity}
                variant={isDark ? 'obsidian' : 'editorial'}
                accentColor={accent}
                autoScroll={!isPreview}
              />
            </section>
          )}

          {/* Footer */}
          <footer
            className="border-t pt-5 flex flex-wrap items-center justify-between gap-3 text-xs"
            style={{ borderColor: borderCol, color: muted }}
          >
            <span>{normalized.handle || profile?.subdomain || 'profile'}</span>
            {normalized.timezone && <span>{normalized.timezone}</span>}
          </footer>
        </div>
      </main>
    </div>
  );
}

export function RebellionTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#160D11"
      isDark
      defaultAccent="#D4AF72"
      isPreview={props.isPreview}
    >
      <RebellionContent {...props} />
    </ProfileTemplateShell>
  );
}
