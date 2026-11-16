'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { cleanDisplayUrl, downloadProfileVCard } from '@/lib/profile/templateActions';
import { pickReadableText, solveAccessibleAccent } from '@/lib/profile/contrast';
import { Phone, Mail, MessageCircle, Download, MapPin } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Noren Dye Palettes for Hanging Fabric Curtains
   ───────────────────────────────────────────────────────────── */
const NOREN_DYES = [
  { bg: '#1d3b53', text: '#f3ecdc', tag: '藍', name: 'Indigo' },
  { bg: '#9e3e20', text: '#f9f5eb', tag: '柿', name: 'Persimmon' },
  { bg: '#8fa86a', text: '#112220', tag: '苔', name: 'Matcha' },
  { bg: '#8f2e15', text: '#f9f5eb', tag: '朱', name: 'Vermilion' },
  { bg: '#3e3a4f', text: '#f3ecdc', tag: '紫', name: 'Plum' },
  { bg: '#2b4c48', text: '#f3ecdc', tag: '青', name: 'Forest' },
];

function NorenTemplateInner({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const name = normalized.name;
  const role = normalized.role || normalized.headline;
  const bio = normalized.bio;
  const location = normalized.location;
  const avatarUrl = normalized.avatarUrl;
  const initials = normalized.initials;
  const email = normalized.showEmail ? normalized.email : '';
  const phone = (profile as any)?.phone || '';
  const links: ProfileLink[] = normalized.links;
  const proofs = normalized.proofs;

  const rawAccent = accentColor || normalized.accentColor || '#e0734f';
  const readableAccentDarkBg = useMemo(() => solveAccessibleAccent(rawAccent, '#123432'), [rawAccent]);
  const accentInk = useMemo(() => pickReadableText(rawAccent), [rawAccent]);

  const numericPhone = useMemo(() => (phone || '').replace(/[^\d+]/g, ''), [phone]);
  const cleanWaNumber = useMemo(() => (phone || '').replace(/[^\d]/g, ''), [phone]);

  const handleSaveContact = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      downloadProfileVCard({
        name,
        role,
        email,
        phone: numericPhone,
        location,
        bio,
        subdomain: profile?.subdomain,
        website: typeof window !== 'undefined' ? window.location.href : undefined,
      });
      showToast('Contact card downloaded');
    } catch (err) {
      console.error('vCard generation error:', err);
      showToast('Could not save contact');
    }
  }, [name, role, email, numericPhone, location, bio, profile?.subdomain, showToast]);

  const socialEntries = useMemo(() => {
    const handles = profile?.socialHandles || {};
    const entries: Array<{ platform: string; url: string; label: string }> = [];

    Object.entries(handles).forEach(([key, val]) => {
      if (!val || typeof val !== 'string') return;
      const cleanVal = val.trim();
      let targetUrl = cleanVal;
      if (!cleanVal.startsWith('http://') && !cleanVal.startsWith('https://')) {
        if (key === 'twitter' || key === 'x') targetUrl = `https://x.com/${cleanVal.replace(/^@/, '')}`;
        else if (key === 'instagram') targetUrl = `https://instagram.com/${cleanVal.replace(/^@/, '')}`;
        else if (key === 'linkedin') targetUrl = `https://linkedin.com/in/${cleanVal.replace(/^@/, '')}`;
        else if (key === 'github') targetUrl = `https://github.com/${cleanVal.replace(/^@/, '')}`;
        else if (key === 'youtube') targetUrl = `https://youtube.com/@${cleanVal.replace(/^@/, '')}`;
        else targetUrl = `https://${cleanVal}`;
      }
      entries.push({
        platform: key,
        url: targetUrl,
        label: key.charAt(0).toUpperCase() + key.slice(1),
      });
    });

    return entries;
  }, [profile?.socialHandles]);

  /* ─────────────────────────────────────────────────────────────
     Noren Panels: User links, connected channels, portfolio works
     ───────────────────────────────────────────────────────────── */
  const norenPanels = useMemo(() => {
    const panels: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      platform?: string;
      dyeIndex: number;
      rawLink?: ProfileLink;
      action?: () => void;
    }> = [];

    let dIdx = 0;

    // 1. User Links
    links.forEach((l, idx) => {
      panels.push({
        id: l.id || `noren-link-${idx}`,
        title: l.label,
        subtitle: cleanDisplayUrl(l.url),
        url: l.url,
        dyeIndex: dIdx++ % NOREN_DYES.length,
        rawLink: l,
      });
    });

    // 2. Connected Social Channels
    socialEntries.forEach((s, idx) => {
      const already = links.some((l) => l.url.toLowerCase().includes(s.platform.toLowerCase()));
      if (!already) {
        panels.push({
          id: `noren-social-${s.platform}-${idx}`,
          title: s.label,
          subtitle: cleanDisplayUrl(s.url),
          url: s.url,
          platform: s.platform,
          dyeIndex: dIdx++ % NOREN_DYES.length,
        });
      }
    });

    // 3. Proofs / Active Projects
    proofs.forEach((p, idx) => {
      const pTitle = (p.title || '').trim();
      const pVal = (p.value || '').trim();
      const combined = pTitle ? `${pTitle}: ${pVal}` : pVal;
      const urlMatch = combined.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
      if (urlMatch) {
        const foundUrl = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
        const already = panels.some((it) => it.url && it.url.includes(urlMatch[1]));
        if (!already) {
          panels.push({
            id: `noren-proof-${idx}`,
            title: pTitle || urlMatch[1],
            subtitle: cleanDisplayUrl(foundUrl),
            url: foundUrl,
            dyeIndex: dIdx++ % NOREN_DYES.length,
          });
        }
      }
    });

    return panels;
  }, [links, socialEntries, proofs]);

  /* ─────────────────────────────────────────────────────────────
     Notes & Highlights (real proofs only)
     ───────────────────────────────────────────────────────────── */
  const notes = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = [p.title, p.value].filter(Boolean).join(': ').trim();
      if (label && !list.includes(label)) list.push(label);
    });
    return list;
  }, [proofs]);

  return (
    <div className="noren-root min-h-screen text-[#f3ecdc] relative overflow-x-clip">
      <style>{`
        .noren-root {
          --bg: #123432;
          --ink: #f3ecdc;
          --c3: #1d4f4b;
          --terracotta: ${rawAccent};
          --terracotta-text: ${readableAccentDarkBg};
          --wood: #6b4a2f;
          --e: cubic-bezier(0.2, 0.8, 0.2, 1);
          --s: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          background-color: #123432;
          background-image:
            linear-gradient(60deg, transparent 48%, #1d4f4b 48% 52%, transparent 52%),
            linear-gradient(-60deg, transparent 48%, #1d4f4b 48% 52%, transparent 52%),
            linear-gradient(#1d4f4b 0 2px, transparent 2px);
          background-size: 56px 97px, 56px 97px, 56px 97px;
          font-family: var(--s);
        }

        @keyframes norenHangIn {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @keyframes norenSway {
          20% {
            transform: rotate(3deg);
          }
          50% {
            transform: rotate(-2.5deg);
          }
          75% {
            transform: rotate(1.5deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        .noren-curtain-panel {
          transform-origin: top center;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 93%, 0 100%);
          animation: norenHangIn 0.8s var(--e) both;
          transition: transform 0.4s var(--e), box-shadow 0.4s var(--e);
        }

        .noren-curtain-panel:hover {
          animation: norenSway 1.2s ease-in-out;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
        }

        .noren-v-text {
          writing-mode: vertical-rl;
          text-orientation: upright;
          letter-spacing: 0.16em;
        }

        @media (max-width: 640px) {
          .noren-v-text {
            writing-mode: horizontal-tb;
            text-orientation: initial;
            letter-spacing: normal;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .noren-curtain-panel,
          .noren-curtain-panel:hover {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Main Sanctuary Canvas */}
      <main className="w-full max-w-[920px] mx-auto px-4 sm:px-8 py-12 sm:py-16 md:py-24 relative z-10">
        {/* Header Section */}
        <header className="grid grid-cols-1 md:grid-cols-[minmax(180px,240px)_1fr] gap-8 md:gap-12 items-center">
          {/* Avatar with Double Inset Frame */}
          <div className="relative mx-auto md:mx-0 w-36 h-36 sm:w-44 sm:h-44 shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover rounded-xl border-[6px] sm:border-[8px] border-[#f3ecdc] shadow-2xl"
                style={{
                  outline: `2px solid ${readableAccentDarkBg}`,
                  outlineOffset: '6px',
                }}
              />
            ) : (
              <div
                className="w-full h-full rounded-xl grid place-items-center font-extrabold text-4xl sm:text-5xl text-[#f3ecdc] border-[6px] sm:border-[8px] border-[#f3ecdc] shadow-2xl"
                style={{
                  backgroundColor: '#1d4f4b',
                  outline: `2px solid ${readableAccentDarkBg}`,
                  outlineOffset: '6px',
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Profile Identity Details */}
          <div className="text-center md:text-left min-w-0">
            <p
              className="text-lg sm:text-xl font-extrabold tracking-[0.5em] mb-2"
              style={{ color: readableAccentDarkBg }}
              aria-hidden="true"
            >
              暖簾
            </p>

            {/* Profile Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-[#f3ecdc] break-words">
              {name}
            </h1>

            {/* Role / Headline */}
            {role && (
              <p className="text-base sm:text-lg font-medium mt-2 text-[#f3ecdc]">
                {role}
              </p>
            )}

            {/* OpenTo Intent Badges */}
            {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
              <div className="mt-3 flex justify-center md:justify-start">
                <OpenToBadges intents={normalized.openTo} accentColor={readableAccentDarkBg} variant="dark" />
              </div>
            )}

            {/* Bio */}
            {normalized.sectionVisibility.bio && bio && (
              <p className="mt-3 text-sm sm:text-base leading-relaxed max-w-xl text-[#e7decb] mx-auto md:mx-0">
                {bio}
              </p>
            )}

            {/* Location & Timezone */}
            {(location || normalized.timezone) && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 mt-3 text-xs font-semibold tracking-wider text-[#e2d8c3]">
                <MapPin size={13} style={{ color: readableAccentDarkBg }} aria-hidden="true" />
                <span>{[location, normalized.timezone].filter(Boolean).join(' · ')}</span>
              </div>
            )}

            {/* Action Buttons */}
            {normalized.sectionVisibility.contact && (
              <div className="flex flex-wrap gap-2.5 mt-6 justify-center md:justify-start">
                {numericPhone && (
                  <a
                    href={`tel:${numericPhone}`}
                    onClick={() => onLinkClick?.({ id: 'call', label: 'Call', url: `tel:${numericPhone}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                    className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-colors hover:bg-[#1d4f4b]"
                  >
                    <Phone size={13} aria-hidden="true" />
                    <span>Call</span>
                  </a>
                )}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    onClick={() => onLinkClick?.({ id: 'email', label: 'Email', url: `mailto:${email}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                    className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-colors hover:bg-[#1d4f4b]"
                  >
                    <Mail size={13} aria-hidden="true" />
                    <span>Email</span>
                  </a>
                )}

                {cleanWaNumber && (
                  <a
                    href={`https://wa.me/${cleanWaNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onLinkClick?.({ id: 'whatsapp', label: 'WhatsApp', url: `https://wa.me/${cleanWaNumber}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                    className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-colors hover:bg-[#1d4f4b]"
                  >
                    <MessageCircle size={13} aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {normalized.hasContactChannel && (
                  <button
                    type="button"
                    onClick={openContact}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: rawAccent, color: accentInk }}
                  >
                    <MessageCircle size={13} aria-hidden="true" />
                    <span>Message</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveContact}
                  className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-colors hover:bg-[#1d4f4b] cursor-pointer"
                >
                  <Download size={13} aria-hidden="true" />
                  <span>Save contact</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Section: NOREN HANGING CURTAINS */}
        {normalized.sectionVisibility.links && norenPanels.length > 0 && (
          <section className="mt-14 sm:mt-20" aria-label="Curated Links and Channels">
            <div className="text-center md:text-left mb-6">
              <h2 className="text-xs font-extrabold tracking-[0.4em] uppercase text-[#e7decb]">
                NOREN CURTAINS · 暖簾
              </h2>
            </div>

            {/* Wooden Rod & Hanging Fabric Panels */}
            <div className="relative pt-6 sm:pt-8">
              {/* Wooden Curtain Rod Beam */}
              <div className="absolute left-0 right-0 top-0 h-3.5 sm:h-4 bg-[#6b4a2f] rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.55)] border-t border-[#8b6545] z-20" aria-hidden="true" />

              {/* Fabric Curtains Layout */}
              <div className="flex flex-col sm:flex-row sm:flex-nowrap gap-3 sm:gap-3.5 justify-center sm:justify-start sm:overflow-x-auto pb-4 pt-2 no-scrollbar">
                {norenPanels.map((panel, idx) => {
                  const dye = NOREN_DYES[panel.dyeIndex % NOREN_DYES.length];
                  const isExt = panel.url && (panel.url.startsWith('http://') || panel.url.startsWith('https://'));

                  return (
                    <a
                      key={panel.id}
                      href={panel.url}
                      target={isExt ? '_blank' : undefined}
                      rel={isExt ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (panel.action) {
                          e.preventDefault();
                          panel.action();
                        } else if (onLinkClick) {
                          onLinkClick(
                            panel.rawLink || {
                              id: panel.id,
                              label: panel.title,
                              url: panel.url,
                              icon: null,
                              clicks: 0,
                              order: idx,
                              isVisible: true,
                            }
                          );
                        }
                      }}
                      style={{
                        backgroundColor: dye.bg,
                        color: dye.text,
                        animationDelay: `${idx * 0.1 + 0.15}s`,
                      }}
                      className="noren-curtain-panel group relative shrink-0 w-full sm:w-[116px] md:w-[126px] sm:h-[300px] md:h-[320px] p-5 sm:p-4 rounded-b-sm shadow-xl flex flex-col justify-between items-center no-underline cursor-pointer"
                    >
                      {/* Top Loop / Dye Seal */}
                      <div className="w-full flex items-center justify-between pb-2 border-b border-current/25">
                        <span className="text-xs font-mono font-bold">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-extrabold font-serif" aria-hidden="true">
                          {dye.tag}
                        </span>
                      </div>

                      {/* Middle Content: Vertical Label on Desktop, Horizontal on Mobile */}
                      <div className="my-auto text-center flex flex-col items-center gap-2 py-4">
                        {panel.platform && (
                          <span className="shrink-0 mb-1">
                            <SocialIcon icon={panel.platform} className="w-5 h-5" />
                          </span>
                        )}
                        <span className="noren-v-text text-base sm:text-lg md:text-xl font-extrabold leading-tight">
                          {panel.title}
                        </span>
                        {panel.subtitle && (
                          <span className="text-[11px] font-mono tracking-tight sm:hidden opacity-95">
                            {panel.subtitle}
                          </span>
                        )}
                      </div>

                      {/* Bottom Swallowtail Arrow */}
                      <div className="pt-2 text-xs font-extrabold" aria-hidden="true">
                        <span>↓</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Section: RECENT ACTIVITY */}
        {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
          <section className="mt-14 sm:mt-18" aria-label="Dispatch Bulletin">
            <h2 className="text-xs font-extrabold tracking-[0.4em] uppercase text-[#e7decb] mb-4">
              DISPATCH // LOG
            </h2>
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant="the-noren"
              isDark={true}
              accentColor={readableAccentDarkBg}
              autoScroll={profile.autoScroll}
            />
          </section>
        )}

        {/* Section: NOTES & HIGHLIGHTS (Rice Paper Dossier) */}
        {normalized.sectionVisibility.proof && notes.length > 0 && (
          <section className="mt-14 sm:mt-18 bg-[#f3ecdc] text-[#123432] rounded-xl p-6 sm:p-8 shadow-2xl" aria-label="Highlights and Proof">
            <div className="flex items-center justify-between border-b border-[#123432]/25 pb-3 mb-5">
              <h2 className="text-xs font-extrabold tracking-[0.3em] uppercase text-[#123432]">
                HIGHLIGHTS & NOTES · 記録
              </h2>
              <span className="text-xs font-mono font-bold text-[#1d4f4b]">
                {String(notes.length).padStart(2, '0')} ITEMS
              </span>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
              {notes.map((note, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 font-extrabold text-sm sm:text-base py-1.5 border-b border-[#123432]/15"
                >
                  <span className="w-2 h-2 rounded-full bg-[#8f2e15] shrink-0" aria-hidden="true" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Noren Footer */}
        <footer className="mt-16 sm:mt-20 pt-6 border-t border-[#f3ecdc]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold text-[#e2d8c3] uppercase tracking-widest text-center sm:text-left">
          <span>{location || `@${normalized.handle}`}</span>
          <span>&copy; {new Date().getFullYear()} {name}</span>
        </footer>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#f3ecdc] text-[#123432] border-2 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-2xl flex items-center gap-2"
          style={{ borderColor: rawAccent }}
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-[#8f2e15]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export function NorenTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#123432"
      isDark={true}
      defaultAccent="#e0734f"
      isPreview={props.isPreview}
    >
      <NorenTemplateInner {...props} />
    </ProfileTemplateShell>
  );
}

export default NorenTemplate;
