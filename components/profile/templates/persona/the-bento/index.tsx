'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, Clock, Mail, MapPin, Sparkles } from 'lucide-react';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon } from '@/components/profile/templates/utils/socialIcons';
import { pickReadableText, rgbaFromHex, solveAccessibleAccent } from '@/lib/profile/contrast';
import type { ProfileLink, TemplateProps } from '@/components/profile/templates/types';

function BentoContent({ onLinkClick }: { onLinkClick?: (link: ProfileLink) => void }) {
  const { normalized, openContact } = useProfileShell()!;

  const isDark = normalized.colorMode === 'dark';
  const canvasBg = isDark ? '#09090B' : '#F4F4F5';
  const tileBg = isDark ? '#18181B' : '#FFFFFF';
  const tileAltBg = isDark ? '#27272A' : '#FAFAFA';
  const borderCol = isDark ? 'rgba(255,255,255,0.14)' : '#E4E4E7';
  const textMain = isDark ? '#FAFAFA' : '#09090B';
  const textMuted = isDark ? '#CBD5E1' : '#52525B';

  const accessibleAccent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor, tileBg, 4.5, '#2563EB'),
    [normalized.accentColor, tileBg]
  );
  const accentFg = useMemo(() => pickReadableText(accessibleAccent), [accessibleAccent]);

  const avatarRadiusClass =
    normalized.avatarStyle === 'square'
      ? 'rounded-xl'
      : normalized.avatarStyle === 'rounded'
        ? 'rounded-2xl'
        : 'rounded-full';

  const primaryLinks = normalized.links.filter((l) => l.isPrimary || l.category === 'primary');
  const gridLinks = normalized.links.filter((l) => !l.isPrimary && l.category !== 'primary');

  const showConnectTile =
    !normalized.isMinimalState &&
    (primaryLinks.length > 0 || (normalized.sectionVisibility.contactCta && normalized.hasContactChannel));

  return (
    <div
      className="min-h-screen w-full px-4 py-8 sm:px-6 sm:py-12 overflow-x-clip"
      style={{ backgroundColor: canvasBg, color: textMain }}
    >
      <main className="mx-auto w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Identity Hero Bento Tile */}
        <section
          className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 ${
            showConnectTile ? 'md:col-span-7' : 'md:col-span-12'
          }`}
          style={{
            backgroundColor: tileBg,
            border: `1px solid ${borderCol}`,
          }}
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="shrink-0">
              {normalized.avatarUrl ? (
                <img
                  src={normalized.avatarUrl}
                  alt={normalized.name}
                  className={`w-20 h-20 sm:w-24 sm:h-24 object-cover border-2 ${avatarRadiusClass}`}
                  style={{ borderColor: accessibleAccent }}
                />
              ) : (
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-2xl sm:text-3xl font-bold ${avatarRadiusClass}`}
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

            <div className="min-w-0 flex-1 space-y-1.5">
              {!normalized.isMinimalState && normalized.availabilityBadge && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: rgbaFromHex(accessibleAccent, 0.16),
                    color: accessibleAccent,
                  }}
                >
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span>{normalized.availabilityBadge}</span>
                </span>
              )}

              <h1
                className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight break-words"
                style={{ fontFamily: 'var(--profile-font-heading)' }}
              >
                {normalized.name}
              </h1>

              {normalized.headline && (
                <p className="text-sm sm:text-base font-medium break-words" style={{ color: textMuted }}>
                  {normalized.headline}
                </p>
              )}

              {!normalized.isMinimalState && (normalized.role || normalized.company) && (
                <p className="text-xs font-medium break-words" style={{ color: textMuted }}>
                  {[normalized.role, normalized.company].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {normalized.bio && (
            <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-line break-words" style={{ color: textMain }}>
              {normalized.bio}
            </p>
          )}

          {(normalized.location || normalized.timezone) && (
            <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t" style={{ borderColor: borderCol, color: textMuted }}>
              {normalized.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{normalized.location}</span>
                </span>
              )}
              {normalized.timezone && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{normalized.timezone}</span>
                </span>
              )}
            </div>
          )}
        </section>

        {/* Connect & Primary Action Bento Tile */}
        {showConnectTile && (
          <section
            aria-label="Connect & Featured"
            className="md:col-span-5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-4"
            style={{
              backgroundColor: tileBg,
              border: `1px solid ${borderCol}`,
            }}
          >
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold" style={{ color: accessibleAccent }}>
                Connect
              </span>

              {primaryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                  className="flex items-center justify-between gap-3 rounded-2xl p-4 no-underline transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    backgroundColor: accessibleAccent,
                    color: accentFg,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-black/15 flex items-center justify-center shrink-0" aria-hidden="true">
                      {getLinkIcon(link.label, link.url, link.icon ?? undefined, 'w-4 h-4')}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-semibold text-sm truncate">{link.label}</span>
                      {link.badge && (
                        <span className="block text-[11px] opacity-90 truncate">{link.badge}</span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>

            {normalized.sectionVisibility.contactCta && normalized.hasContactChannel && (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={openContact}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    backgroundColor: primaryLinks.length === 0 ? accessibleAccent : tileAltBg,
                    color: primaryLinks.length === 0 ? accentFg : textMain,
                    border: `1px solid ${borderCol}`,
                  }}
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Send Message</span>
                </button>

                {normalized.bookingUrl && (
                  <a
                    href={normalized.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold no-underline transition-colors"
                    style={{
                      backgroundColor: tileAltBg,
                      color: textMain,
                      border: `1px solid ${borderCol}`,
                    }}
                  >
                    <span>Book a Call</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {/* Proof Points Row */}
        {normalized.sectionVisibility.proofs && normalized.proofs.length > 0 && (
          <section aria-label="Metrics & Proof Points" className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {normalized.proofs.slice(0, 8).map((proof) => {
              const card = (
                <div
                  className="rounded-2xl p-4 sm:p-5 h-full flex flex-col justify-between gap-1.5"
                  style={{
                    backgroundColor: tileBg,
                    border: `1px solid ${borderCol}`,
                  }}
                >
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: accessibleAccent }}>
                    {proof.label}
                  </span>
                  <span className="text-lg sm:text-xl font-bold leading-snug break-words" style={{ color: textMain }}>
                    {proof.value}
                  </span>
                </div>
              );

              return proof.url ? (
                <a key={proof.id} href={proof.url} target="_blank" rel="noopener noreferrer" className="no-underline block hover:opacity-90">
                  {card}
                </a>
              ) : (
                <div key={proof.id}>{card}</div>
              );
            })}
          </section>
        )}

        {/* Open To Bento Tile */}
        {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
          <section
            aria-label="Open To"
            className="md:col-span-12 rounded-3xl p-5 sm:p-6"
            style={{ backgroundColor: tileBg, border: `1px solid ${borderCol}` }}
          >
            <OpenToBadges
              intents={normalized.openTo}
              accentColor={accessibleAccent}
              darkMode={isDark}
            />
          </section>
        )}

        {/* Recent Activity Tile */}
        {normalized.sectionVisibility.activity && normalized.recentActivity && (
          <section className="md:col-span-12">
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant="the-bento"
              isDark={isDark}
              accentColor={accessibleAccent}
              autoScroll={normalized.raw.autoScroll}
            />
          </section>
        )}

        {/* Modular Bento Links Grid */}
        {gridLinks.length > 0 && (
          <section aria-label="Links Grid" className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {gridLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onLinkClick?.(link)}
                className="group rounded-2xl p-5 flex items-center justify-between gap-3 no-underline transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: tileBg,
                  color: textMain,
                  border: `1px solid ${borderCol}`,
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: rgbaFromHex(accessibleAccent, 0.14),
                      color: accessibleAccent,
                    }}
                    aria-hidden="true"
                  >
                    {getLinkIcon(link.label, link.url, link.icon ?? undefined, 'w-5 h-5')}
                  </span>
                  <div className="min-w-0">
                    <span className="block font-semibold text-sm truncate">{link.label}</span>
                    {(link.badge || (link.category && link.category !== 'other')) && (
                      <span className="block text-xs capitalize truncate" style={{ color: textMuted }}>
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

        {/* Clean Footer Tile */}
        {!normalized.isMinimalState && normalized.sectionVisibility.footerBadge && !normalized.whiteLabel && (
          <footer
            className="md:col-span-12 rounded-2xl px-5 py-3 flex items-center justify-between text-xs"
            style={{
              backgroundColor: tileBg,
              border: `1px solid ${borderCol}`,
              color: textMuted,
            }}
          >
            <span>{normalized.handle || 'The Bento'}</span>
            {normalized.showEmail && normalized.email && (
              <a href={`mailto:${normalized.email}`} className="underline" style={{ color: textMain }}>
                {normalized.email}
              </a>
            )}
          </footer>
        )}
      </main>
    </div>
  );
}

export function BentoTemplate(props: TemplateProps) {
  const themeColorMode = (props.profile?.theme as { colorMode?: string } | undefined)?.colorMode;
  const isDark = themeColorMode === 'dark';
  const surfaceHex = isDark ? '#18181B' : '#FFFFFF';

  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex={surfaceHex}
      isDark={isDark}
      accentColor={props.accentColor}
      defaultAccent="#2563EB"
      isPreview={props.isPreview}
    >
      <BentoContent onLinkClick={props.onLinkClick} />
    </ProfileTemplateShell>
  );
}

export default BentoTemplate;
