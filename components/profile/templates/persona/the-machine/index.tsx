'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, Cpu, Mail, MapPin } from 'lucide-react';
import type { TemplateProps } from '../types';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { cleanDisplayUrl } from '@/lib/profile/templateActions';
import { rgbaFromHex, solveAccessibleAccent } from '@/lib/profile/contrast';
import { getSharedLinkIcon } from '../../utils/socialIcons';

function MachineContent({ profile, isPreview, onLinkClick }: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const isDark = normalized.colorMode === 'dark';

  const ink = isDark ? '#F5F7FA' : '#111827';
  const muted = isDark ? '#C3CBD6' : '#4B5563'; // >= 4.5:1 against glass card
  const glassBg = isDark ? 'rgba(17, 24, 39, 0.78)' : 'rgba(255, 255, 255, 0.84)';
  const borderCol = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.92)';
  const meshBg = isDark
    ? 'linear-gradient(-45deg, #0D1117, #1A1F2E, #11222A, #1B1626)'
    : 'linear-gradient(-45deg, #FFF5F5, #F0F9FF, #F4FBF7, #FFF9EB)';

  const accentSurface = isDark ? '#111827' : '#FFFFFF';
  const accent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor || '#0D9488', accentSurface, 4.5),
    [normalized.accentColor, accentSurface],
  );

  const initials = useMemo(() => {
    const parts = (normalized.name || 'M').trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (normalized.name || 'M').slice(0, 2).toUpperCase();
  }, [normalized.name]);

  const avatarRadiusClass =
    normalized.avatarStyle === 'square'
      ? 'rounded-2xl'
      : normalized.avatarStyle === 'circle'
      ? 'rounded-full'
      : 'rounded-[32px]';

  return (
    <div
      className="min-h-screen w-full relative overflow-x-clip antialiased profile-animate-gradient"
      style={{
        backgroundImage: meshBg,
        color: ink,
        fontFamily: 'var(--profile-font-body)',
      }}
    >
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-12">
        {/* Top Kinetic Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
          <div className="space-y-5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 text-xs uppercase tracking-[0.18em] font-semibold" style={{ color: accent }}>
              <Cpu className="w-4 h-4" aria-hidden="true" />
              <span>{normalized.handle || profile?.subdomain || 'machine'}</span>
              {normalized.location && (
                <span className="inline-flex items-center gap-1 text-xs font-medium normal-case tracking-normal" style={{ color: muted }}>
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {normalized.location}
                </span>
              )}
            </div>

            <h1
              className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[0.98] uppercase break-words"
              style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
            >
              {normalized.name}
            </h1>

            {(normalized.headline || normalized.role) && (
              <p className="text-lg sm:text-xl font-medium leading-relaxed" style={{ color: accent }}>
                {normalized.headline || [normalized.role, normalized.company].filter(Boolean).join(' @ ')}
              </p>
            )}

            {normalized.sectionVisibility.bio && normalized.bio && (
              <div
                className="rounded-3xl border p-6 shadow-sm backdrop-blur-md"
                style={{ backgroundColor: glassBg, borderColor: borderCol }}
              >
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: muted }}>
                  {normalized.bio}
                </p>
              </div>
            )}

            {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
              <OpenToBadges
                intents={normalized.openTo}
                accentColor={accent}
                variant={isDark ? 'dark' : 'light'}
              />
            )}

            {normalized.sectionVisibility.contact && normalized.hasContactChannel && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={openContact}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: accent, color: isDark ? '#0D1117' : '#FFFFFF' }}
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Connect</span>
                </button>
                {normalized.showEmail && normalized.email && (
                  <a
                    href={`mailto:${normalized.email}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium backdrop-blur-md"
                    style={{ backgroundColor: glassBg, borderColor: borderCol, color: ink }}
                  >
                    <span>{normalized.email}</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Specimen Card */}
          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="relative">
              {normalized.avatarUrl ? (
                <img
                  src={normalized.avatarUrl}
                  alt={`${normalized.name} portrait`}
                  className={`w-56 h-56 sm:w-68 sm:h-68 object-cover shadow-xl border-4 border-white/80 ${avatarRadiusClass}`}
                />
              ) : (
                <div
                  className={`w-56 h-56 sm:w-68 sm:h-68 flex items-center justify-center text-5xl font-extrabold shadow-xl border-4 border-white/80 ${avatarRadiusClass}`}
                  style={{
                    backgroundColor: glassBg,
                    color: accent,
                    fontFamily: 'var(--profile-font-heading)',
                  }}
                >
                  {initials}
                </div>
              )}

              {normalized.availabilityBadge && (
                <div
                  className="mt-3 sm:mt-0 sm:absolute sm:-bottom-3 sm:left-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md text-center"
                  style={{ backgroundColor: accent, color: isDark ? '#0D1117' : '#FFFFFF' }}
                >
                  {normalized.availabilityBadge}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Proof Metrics */}
        {normalized.sectionVisibility.proof && normalized.proofs.length > 0 && (
          <section aria-labelledby="machine-proof-heading" className="space-y-4">
            <h2
              id="machine-proof-heading"
              className="text-xs uppercase tracking-[0.22em] font-bold"
              style={{ color: muted }}
            >
              Output & Signals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {normalized.proofs.map((proof, idx) => (
                <div
                  key={proof.id || idx}
                  className="rounded-2xl border p-5 backdrop-blur-md shadow-sm"
                  style={{ backgroundColor: glassBg, borderColor: borderCol }}
                >
                  <div className="text-2xl sm:text-3xl font-extrabold tabular-nums" style={{ color: ink }}>
                    {proof.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider font-bold mt-1" style={{ color: accent }}>
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

        {/* Kinetic Glass Links */}
        {normalized.sectionVisibility.links && normalized.links.length > 0 && (
          <section aria-labelledby="machine-links-heading" className="space-y-4">
            <h2
              id="machine-links-heading"
              className="text-xs uppercase tracking-[0.22em] font-bold pl-3 border-l-4"
              style={{ borderColor: accent, color: ink }}
            >
              Digital Endpoints
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {normalized.links.map((link, idx) => (
                <a
                  key={link.id || idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                  className="group rounded-2xl border p-4 sm:p-5 flex items-center justify-between gap-4 backdrop-blur-md shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: glassBg, borderColor: borderCol }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: rgbaFromHex(accent, 0.14), color: accent }}
                    >
                      {getSharedLinkIcon(link.label, link.url, link.icon, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm sm:text-base truncate" style={{ color: ink }}>
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
          <section aria-labelledby="machine-activity-heading" className="space-y-4">
            <h2
              id="machine-activity-heading"
              className="text-xs uppercase tracking-[0.22em] font-bold pl-3 border-l-4"
              style={{ borderColor: accent, color: ink }}
            >
              Activity Stream
            </h2>
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant={isDark ? 'dark' : 'light'}
              accentColor={accent}
              autoScroll={!isPreview}
            />
          </section>
        )}

        {/* Footer */}
        <footer
          className="border-t pt-6 flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{ borderColor: borderCol, color: muted }}
        >
          <span>{normalized.handle || profile?.subdomain || 'machine'}</span>
          {normalized.timezone && <span>{normalized.timezone}</span>}
        </footer>
      </main>
    </div>
  );
}

export function MachineTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#FFFFFF"
      defaultAccent="#0D9488"
      isPreview={props.isPreview}
    >
      <MachineContent {...props} />
    </ProfileTemplateShell>
  );
}
