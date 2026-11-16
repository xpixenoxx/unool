'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Mail, MapPin, Menu, Sparkles, X } from 'lucide-react';
import type { TemplateProps } from '../types';
import { getSharedLinkIcon } from '../../utils/socialIcons';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { cleanDisplayUrl, downloadProfileVCard } from '@/lib/profile/templateActions';
import { rgbaFromHex, solveAccessibleAccent } from '@/lib/profile/contrast';

function HumanContent({ profile, isPreview, onLinkClick }: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2600);
  };

  const isDark = normalized.colorMode !== 'light';
  const canvasBg = isDark ? '#0A161E' : '#F4EDDC';
  const cardBg = isDark ? '#123040' : '#FFFFFF';
  const paperBg = '#F4EDDC';
  const paperInk = '#181A18';
  const ink = isDark ? '#F4EDDC' : '#181A18';
  const mutedOnCanvas = isDark ? '#CFC8B4' : '#4B4B44'; // >= 4.5:1 on both canvases

  const accent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor || '#E2B746', cardBg, 4.5),
    [normalized.accentColor, cardBg],
  );

  const initials = useMemo(() => {
    const parts = (normalized.name || 'H').trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (normalized.name || 'H').slice(0, 2).toUpperCase();
  }, [normalized.name]);

  const avatarClipRadius =
    normalized.avatarStyle === 'square'
      ? '24px'
      : normalized.avatarStyle === 'circle'
      ? '50%'
      : '44% 56% 52% 48% / 48% 42% 58% 52%';

  const handleSaveContact = () => {
    const ok = downloadProfileVCard({
      name: normalized.name,
      role: normalized.role,
      company: normalized.company,
      email: normalized.showEmail ? normalized.email : undefined,
      location: normalized.location,
      bio: normalized.bio,
      subdomain: profile?.subdomain,
    });
    if (ok) showToast('Contact vCard downloaded');
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center p-3 sm:p-8 lg:p-12 overflow-x-clip"
      style={{ backgroundColor: canvasBg, color: ink, fontFamily: 'var(--profile-font-body)' }}
    >
      <div
        className="w-full max-w-[1280px] relative flex-1 flex flex-col overflow-hidden shadow-2xl rounded-3xl sm:rounded-[40px]"
        style={{
          backgroundColor: cardBg,
          backgroundImage: `radial-gradient(circle at 82% 18%, ${rgbaFromHex(accent, 0.12)}, transparent 45%)`,
        }}
      >
        {/* Top Organic Header */}
        <nav className="relative z-20 w-full px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span
              className="text-xl sm:text-2xl font-bold uppercase tracking-[0.14em] block truncate"
              style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
            >
              {normalized.company || normalized.handle || normalized.name}
            </span>
            <span className="text-[11px] uppercase tracking-[0.22em] font-semibold block mt-1" style={{ color: mutedOnCanvas }}>
              {normalized.location || normalized.timezone || 'Human First'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {normalized.sectionVisibility.contact && normalized.hasContactChannel && (
              <button
                type="button"
                onClick={openContact}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent, color: isDark ? '#123040' : '#FFFFFF' }}
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Say hello</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center border transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: rgbaFromHex(ink, 0.25), color: ink }}
              aria-label="Open profile menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 w-full flex-1 pb-14 space-y-12 sm:space-y-16">
          <section className="max-w-6xl mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
            <div className="space-y-4 text-center lg:text-left order-2 lg:order-1 min-w-0">
              {normalized.handle && (
                <span
                  className="text-lg sm:text-xl italic block"
                  style={{ fontFamily: 'var(--profile-font-heading)', color: accent }}
                >
                  @{normalized.handle}
                </span>
              )}

              <h1
                className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight break-words"
                style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
              >
                {normalized.name}
              </h1>

              {(normalized.headline || normalized.role) && (
                <p className="text-lg sm:text-2xl font-light leading-snug" style={{ color: mutedOnCanvas }}>
                  {normalized.headline || normalized.role}
                </p>
              )}

              {normalized.availabilityBadge && (
                <div className="flex justify-center lg:justify-start">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: rgbaFromHex(accent, 0.16), color: accent }}
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    {normalized.availabilityBadge}
                  </span>
                </div>
              )}

              {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
                <OpenToBadges
                  intents={normalized.openTo}
                  accentColor={accent}
                  variant={isDark ? 'obsidian' : 'light'}
                  className="justify-center lg:justify-start"
                />
              )}

              {normalized.sectionVisibility.contact && normalized.hasContactChannel && (
                <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-3">
                  <button
                    type="button"
                    onClick={openContact}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: accent, color: isDark ? '#123040' : '#FFFFFF' }}
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span>Connect</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-opacity hover:opacity-85"
                    style={{ borderColor: rgbaFromHex(ink, 0.3), color: ink }}
                  >
                    <span>Save vCard</span>
                  </button>
                </div>
              )}
            </div>

            {/* Organic Portrait Frame */}
            <div className="flex justify-center order-1 lg:order-2">
              <div className="relative w-60 h-72 sm:w-80 sm:h-96">
                {normalized.avatarUrl ? (
                  <img
                    src={normalized.avatarUrl}
                    alt={`${normalized.name} portrait`}
                    className="w-full h-full object-cover shadow-2xl"
                    style={{ borderRadius: avatarClipRadius }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center shadow-2xl text-5xl font-bold"
                    style={{
                      borderRadius: avatarClipRadius,
                      backgroundColor: '#C25F46',
                      color: '#F4EDDC',
                      fontFamily: 'var(--profile-font-heading)',
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div
                  className="absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#E2B746', color: '#123040' }}
                  aria-hidden="true"
                >
                  <BadgeCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </section>

          {/* Warm Paper Bio Band */}
          {normalized.sectionVisibility.bio && normalized.bio && (
            <section className="px-4 sm:px-8">
              <div
                className="max-w-5xl mx-auto rounded-3xl p-6 sm:p-10 shadow-xl"
                style={{ backgroundColor: paperBg, color: paperInk }}
              >
                <p
                  className="text-2xl sm:text-3xl leading-[1.2] tracking-tight"
                  style={{ fontFamily: 'var(--profile-font-heading)' }}
                >
                  {normalized.bio}
                </p>
                {normalized.location && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#454A44]">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{normalized.location}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Proof Cards */}
          {normalized.sectionVisibility.proof && normalized.proofs.length > 0 && (
            <section aria-labelledby="human-proof-heading" className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <h2 id="human-proof-heading" className="sr-only">
                Milestones and proof
              </h2>
              {normalized.proofs.map((proof, i) => {
                const palette = [
                  { bg: '#E2B746', text: '#181A18' },
                  { bg: '#A5AE89', text: '#181A18' },
                  { bg: '#9C412A', text: '#F4EDDC' },
                ][i % 3];
                return (
                  <div
                    key={proof.id || i}
                    className="rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-3"
                    style={{ backgroundColor: palette.bg, color: palette.text }}
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.16em]">
                      {proof.label}
                    </span>
                    <span
                      className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums break-words"
                      style={{ fontFamily: 'var(--profile-font-heading)' }}
                    >
                      {proof.value}
                    </span>
                    {proof.description && (
                      <span className="text-xs leading-relaxed opacity-90">
                        {proof.description}
                      </span>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Organic Link Pills */}
          {normalized.sectionVisibility.links && normalized.links.length > 0 && (
            <section aria-labelledby="human-links-heading" className="max-w-3xl mx-auto px-6 space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-3" style={{ borderColor: rgbaFromHex(ink, 0.2) }}>
                <h2
                  id="human-links-heading"
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
                >
                  Official links
                </h2>
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: mutedOnCanvas }}>
                  Direct destinations
                </span>
              </div>

              <div className="flex flex-col gap-3.5">
                {normalized.links.map((link, i) => {
                  const rowBg = ['#EFE4CC', '#C2C8B1', '#E5C6BD'][i % 3];
                  return (
                    <a
                      key={link.id || i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onLinkClick?.(link)}
                      className="group rounded-2xl flex items-center justify-between p-3 sm:p-4 shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                      style={{ backgroundColor: rowBg, color: '#181A18' }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center shrink-0 text-[#181A18]">
                          {getSharedLinkIcon(link.label, link.url, link.icon, 'w-5 h-5')}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm sm:text-base truncate">{link.label}</div>
                          <div className="text-xs text-[#383C38] truncate">
                            {cleanDisplayUrl(link.url)}
                          </div>
                        </div>
                      </div>
                      <ArrowRight
                        className="w-5 h-5 shrink-0 mr-1 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent Activity */}
          {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
            <section aria-labelledby="human-activity-heading" className="max-w-4xl mx-auto px-6 space-y-4">
              <h2
                id="human-activity-heading"
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--profile-font-heading)', color: ink }}
              >
                Recent activity
              </h2>
              <RecentActivitySection
                activity={normalized.recentActivity}
                variant={isDark ? 'obsidian' : 'minimal'}
                accentColor={accent}
                autoScroll={!isPreview}
              />
            </section>
          )}
        </main>

        {/* Minimal Navigation Drawer */}
        {menuOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Profile navigation drawer"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <div
              className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative"
              style={{ backgroundColor: paperBg, color: paperInk }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-[0.18em] text-xs text-[#454A44]">
                  {normalized.name}
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close profile menu"
                  className="p-2 rounded-full hover:bg-black/10"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-2.5">
                {normalized.hasContactChannel && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openContact();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#123040] text-[#F4EDDC] font-semibold text-sm text-left flex items-center justify-between"
                  >
                    <span>Send a message</span>
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleSaveContact();
                    setMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-[#181A18]/20 font-semibold text-sm text-left"
                >
                  Download vCard (.vcf)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#181A18] text-[#F4EDDC] text-xs font-semibold shadow-xl"
          >
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
}

export function HumanTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#123040"
      isDark
      defaultAccent="#E2B746"
      isPreview={props.isPreview}
    >
      <HumanContent {...props} />
    </ProfileTemplateShell>
  );
}
