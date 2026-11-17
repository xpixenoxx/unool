'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, Mail, MapPin, ShieldCheck, Wrench } from 'lucide-react';
import type { TemplateProps } from '../types';
import { getSharedLinkIcon } from '../../utils/socialIcons';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { cleanDisplayUrl } from '@/lib/profile/templateActions';
import { rgbaFromHex, solveAccessibleAccent } from '@/lib/profile/contrast';

function BuilderContent({ profile, isPreview, onLinkClick }: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const isDark = normalized.colorMode === 'dark';

  const bgMain = isDark ? '#111618' : '#E8EEF2';
  const cardBg = isDark ? '#192124' : '#FAFAFA';
  const cardAltBg = isDark ? '#1F292D' : '#F3F6F8';
  const ink = isDark ? '#F3F6F8' : '#141B19';
  const muted = isDark ? '#B7C2C8' : '#4E5B57'; // >= 4.5:1 on both dark and light cards
  const borderCol = isDark ? 'rgba(243,246,248,0.14)' : '#CBD5DC';
  const accent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor || '#1D6B68', cardBg, 4.5),
    [normalized.accentColor, cardBg],
  );

  const initials = useMemo(() => {
    const parts = (normalized.name || 'B').trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (normalized.name || 'B').slice(0, 2).toUpperCase();
  }, [normalized.name]);

  const avatarRadiusClass =
    normalized.avatarStyle === 'circle'
      ? 'rounded-full'
      : normalized.avatarStyle === 'rounded'
      ? 'rounded-xl'
      : 'rounded-none';

  return (
    <div
      className="min-h-screen w-full antialiased selection:bg-teal-900 selection:text-white"
      style={{
        backgroundColor: bgMain,
        color: ink,
        fontFamily: 'var(--profile-font-body)',
      }}
    >
      {/* Top Technical Telemetry Bar */}
      <header
        className="border-b px-4 sm:px-6 lg:px-10 py-3.5"
        style={{ backgroundColor: cardBg, borderColor: borderCol }}
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: accent }}
              aria-hidden="true"
            />
            <span
              className="text-xs uppercase tracking-[0.18em] font-semibold truncate"
              style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', color: muted }}
            >
              {normalized.handle || 'blueprint'} // BUILDER_SPEC
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium" style={{ color: muted }}>
            {normalized.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{normalized.location}</span>
              </span>
            )}
            {normalized.availabilityBadge && (
              <span
                className="px-2.5 py-0.5 border text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  borderColor: rgbaFromHex(accent, 0.35),
                  backgroundColor: rgbaFromHex(accent, 0.1),
                  color: accent,
                }}
              >
                {normalized.availabilityBadge}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 space-y-8">
        {/* Blueprint Hero Sheet */}
        <section
          className="relative border p-6 sm:p-10 shadow-sm"
          style={{
            backgroundColor: cardBg,
            borderColor: borderCol,
            backgroundImage: `radial-gradient(${rgbaFromHex(muted, 0.16)} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 sm:gap-10 items-start">
            {/* Technical Specimen Portrait */}
            <div className="space-y-2.5">
              <div
                className={`w-36 h-40 sm:w-44 sm:h-48 border overflow-hidden relative flex items-center justify-center ${avatarRadiusClass}`}
                style={{ backgroundColor: cardAltBg, borderColor: borderCol }}
              >
                {normalized.avatarUrl ? (
                  <img
                    src={normalized.avatarUrl}
                    alt={`${normalized.name} portrait`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-4xl font-bold tracking-tight"
                    style={{ fontFamily: 'var(--profile-font-heading)', color: accent }}
                  >
                    {initials}
                  </span>
                )}
              </div>
              <div
                className="text-[11px] uppercase tracking-[0.16em]"
                style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', color: muted }}
              >
                FIG. 01 — SPECIMEN
              </div>
            </div>

            {/* Identity Specification */}
            <div className="min-w-0 space-y-5">
              {(normalized.role || normalized.company) && (
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold" style={{ color: accent }}>
                  <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {[normalized.role, normalized.company].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}

              <h1
                className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] break-words"
                style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
              >
                {normalized.name}
              </h1>

              {normalized.headline && normalized.headline !== normalized.role && (
                <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: ink }}>
                  {normalized.headline}
                </p>
              )}

              {normalized.sectionVisibility.bio && normalized.bio && (
                <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: muted }}>
                  {normalized.bio}
                </p>
              )}

              {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
                <div className="pt-1">
                  <OpenToBadges
                    intents={normalized.openTo}
                    accentColor={accent}
                    variant={isDark ? 'dark' : 'light'}
                  />
                </div>
              )}

              {normalized.sectionVisibility.contact && normalized.hasContactChannel && (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={openContact}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      backgroundColor: accent,
                      color: isDark ? '#0D1314' : '#FFFFFF',
                      borderColor: accent,
                    }}
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span>Connect</span>
                  </button>
                  {normalized.showEmail && normalized.email && (
                    <a
                      href={`mailto:${normalized.email}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border transition-colors hover:opacity-80"
                      style={{ borderColor: borderCol, color: ink, backgroundColor: cardAltBg }}
                    >
                      <span>{normalized.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Metrics / Proof Spec Grid */}
        {normalized.sectionVisibility.proof && normalized.proofs.length > 0 && (
          <section aria-labelledby="builder-proof-heading" className="space-y-3">
            <h2
              id="builder-proof-heading"
              className="text-xs uppercase tracking-[0.2em] font-semibold"
              style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', color: muted }}
            >
              01 // VERIFIED_TELEMETRY
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {normalized.proofs.map((proof, idx) => (
                <div
                  key={proof.id || idx}
                  className="border p-5 flex flex-col justify-between gap-2"
                  style={{ backgroundColor: cardBg, borderColor: borderCol }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[11px] uppercase tracking-[0.16em] font-semibold"
                      style={{ color: accent }}
                    >
                      {proof.label}
                    </span>
                    <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
                  </div>
                  <div
                    className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums break-words"
                    style={{ color: ink }}
                  >
                    {proof.value}
                  </div>
                  {proof.description && (
                    <p className="text-xs leading-relaxed" style={{ color: muted }}>
                      {proof.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Links Specification Index */}
        {normalized.sectionVisibility.links && normalized.links.length > 0 && (
          <section aria-labelledby="builder-links-heading" className="space-y-3">
            <h2
              id="builder-links-heading"
              className="text-xs uppercase tracking-[0.2em] font-semibold"
              style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', color: muted }}
            >
              02 // SYSTEM_ENDPOINTS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {normalized.links.map((link, idx) => (
                <a
                  key={link.id || idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                  className="group border p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: cardBg, borderColor: borderCol }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 border flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cardAltBg, borderColor: borderCol, color: accent }}
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

        {/* Recent Activity Telemetry */}
        {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
          <section aria-labelledby="builder-activity-heading" className="space-y-3">
            <h2
              id="builder-activity-heading"
              className="text-xs uppercase tracking-[0.2em] font-semibold"
              style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', color: muted }}
            >
              03 // RECENT_LOGS
            </h2>
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant="editorial"
              accentColor={accent}
              autoScroll={!isPreview}
            />
          </section>
        )}

        {/* Coordinate Footer */}
        <footer
          className="border-t pt-6 flex flex-wrap items-center justify-between gap-4 text-xs"
          style={{ borderColor: borderCol, color: muted }}
        >
          <span style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}>
            {normalized.handle || profile?.subdomain || 'spec'}
          </span>
          {normalized.timezone && (
            <span style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}>
              TZ // {normalized.timezone}
            </span>
          )}
        </footer>
      </main>
    </div>
  );
}

export function BuilderTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#FAFAFA"
      defaultAccent="#1D6B68"
      isPreview={props.isPreview}
    >
      <BuilderContent {...props} />
    </ProfileTemplateShell>
  );
}
