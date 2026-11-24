'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { cleanDisplayUrl, downloadProfileVCard } from '@/lib/profile/templateActions';
import { pickReadableText, solveAccessibleAccent } from '@/lib/profile/contrast';
import { Phone, Mail, MessageCircle, Download, Folder, Terminal, MapPin } from 'lucide-react';

function DesktopTemplateInner({
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

  const rawAccent = accentColor || normalized.accentColor || '#1d2d5c';
  const titleBarText = useMemo(() => pickReadableText(rawAccent), [rawAccent]);
  const readableAccentOnWindow = useMemo(() => solveAccessibleAccent(rawAccent, '#d8d2c2'), [rawAccent]);
  const readableAccentOnWhite = useMemo(() => solveAccessibleAccent(rawAccent, '#ffffff'), [rawAccent]);

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
     Desktop Icons: Folders & System Applications
     ───────────────────────────────────────────────────────────── */
  const desktopIcons = useMemo(() => {
    const icons: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      platform?: string;
      rawLink?: ProfileLink;
      action?: () => void;
    }> = [];

    // 1. User Links
    links.forEach((l, idx) => {
      icons.push({
        id: l.id || `icon-link-${idx}`,
        title: l.label,
        subtitle: cleanDisplayUrl(l.url),
        url: l.url,
        rawLink: l,
      });
    });

    // 2. Connected Social Handles
    socialEntries.forEach((s, idx) => {
      const already = links.some((l) => l.url.toLowerCase().includes(s.platform.toLowerCase()));
      if (!already) {
        icons.push({
          id: `icon-social-${s.platform}-${idx}`,
          title: s.label,
          subtitle: cleanDisplayUrl(s.url),
          url: s.url,
          platform: s.platform,
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
        const already = icons.some((it) => it.url && it.url.includes(urlMatch[1]));
        if (!already) {
          icons.push({
            id: `icon-proof-${idx}`,
            title: pTitle || urlMatch[1],
            subtitle: cleanDisplayUrl(foundUrl),
            url: foundUrl,
          });
        }
      }
    });

    return icons;
  }, [links, socialEntries, proofs]);

  /* ─────────────────────────────────────────────────────────────
     Proofs / Highlights List (real proofs only)
     ───────────────────────────────────────────────────────────── */
  const servicesList = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = [p.title, p.value].filter(Boolean).join(': ').trim();
      if (label && !list.includes(label)) list.push(label);
    });
    return list;
  }, [proofs]);

  return (
    <div className="retro-root min-h-screen text-[#111111] relative overflow-x-clip">
      <style>{`
        .retro-root {
          --bg: #4f8f8a;
          --ink: #111111;
          --c3: #c2bcab;
          --win-bg: #d8d2c2;
          --title-navy: ${rawAccent};
          --title-ink: ${titleBarText};
          --folder-yellow: #f2c14e;
          --s: var(--font-geist-mono), ui-monospace, 'IBM Plex Mono', monospace;
          background-color: #4f8f8a;
          background-image: radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1.5px);
          background-size: 4px 4px;
          font-family: var(--s);
        }

        .retro-window {
          background-color: var(--win-bg);
          border: 2px solid #111111;
          box-shadow: 5px 5px 0 #111111, inset 2px 2px 0 #ffffff;
        }

        .retro-btn {
          background-color: var(--win-bg);
          border: 2px solid #111111;
          box-shadow: inset 2px 2px 0 #ffffff, inset -2px -2px 0 #8a8472;
          transition: background-color 0.15s, color 0.15s;
        }

        .retro-btn:active,
        .retro-btn:hover {
          background-color: var(--title-navy) !important;
          color: var(--title-ink) !important;
        }

        .retro-folder-shape {
          clip-path: polygon(0 0, 40% 0, 50% 14%, 100% 14%, 100% 100%, 0 100%);
          border: 2px solid #111111;
          box-shadow: 3px 3px 0 #111111;
        }

        .retro-icon-card:hover .retro-folder-label {
          background-color: var(--title-navy);
          color: var(--title-ink);
          outline: 1px dotted var(--title-ink);
        }

        @media (prefers-reduced-motion: reduce) {
          .retro-btn,
          .retro-folder-label {
            transition: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <main className="w-full max-w-[820px] mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20 relative z-10">
        {/* Window 1: profile.exe */}
        <div className="retro-window relative pt-10 p-5 sm:p-7 mb-8">
          {/* Titlebar */}
          <div
            className="absolute left-[3px] right-[3px] top-[3px] h-[26px] px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
            style={{ backgroundColor: rawAccent, color: titleBarText }}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span aria-hidden="true">■</span>
              <span>profile.exe — System Identity</span>
            </div>
            <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
              <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                _
              </span>
              <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                ×
              </span>
            </div>
          </div>

          {/* Profile Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-6 items-start">
            {/* Avatar */}
            <div className="mx-auto sm:mx-0 w-32 h-32 sm:w-36 sm:h-36 shrink-0 relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover border-2 border-[#111111] shadow-[inset_2px_2px_0_rgba(0,0,0,0.4)]"
                />
              ) : (
                <div className="w-full h-full bg-[#c2bcab] border-2 border-[#111111] grid place-items-center text-4xl font-bold text-[#111111] shadow-[inset_2px_2px_0_rgba(0,0,0,0.4)]">
                  {initials}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center sm:text-left min-w-0">
              <p
                className="text-sm font-bold tracking-widest mb-1"
                style={{ color: readableAccentOnWindow }}
              >
                SYS // @{normalized.handle}
              </p>

              {/* Name */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111111] leading-none break-words">
                {name}
              </h1>

              {/* Role */}
              {role && (
                <p className="text-sm sm:text-base font-bold text-[#2b2923] mt-2">
                  {role}
                </p>
              )}

              {/* OpenTo Intent Badges */}
              {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
                <div className="mt-3 flex justify-center sm:justify-start">
                  <OpenToBadges intents={normalized.openTo} accentColor={readableAccentOnWindow} variant="light" />
                </div>
              )}

              {/* Bio */}
              {normalized.sectionVisibility.bio && bio && (
                <p className="mt-2.5 text-xs sm:text-sm font-medium leading-relaxed text-[#22201b]">
                  {bio}
                </p>
              )}

              {/* Location & Timezone */}
              {(location || normalized.timezone) && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2.5 text-xs font-bold text-[#333029]">
                  <MapPin size={12} aria-hidden="true" />
                  <span>{[location, normalized.timezone].filter(Boolean).join(' · ')}</span>
                </div>
              )}

              {/* 3D Bevel Action Buttons */}
              {normalized.sectionVisibility.contact && (
                <div className="flex flex-wrap gap-2 mt-5 justify-center sm:justify-start">
                  {numericPhone && (
                    <a
                      href={`tel:${numericPhone}`}
                      onClick={() => onLinkClick?.({ id: 'call', label: 'Call', url: `tel:${numericPhone}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                      className="retro-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#111111] no-underline"
                    >
                      <Phone size={12} aria-hidden="true" />
                      <span>Call</span>
                    </a>
                  )}

                  {email && (
                    <a
                      href={`mailto:${email}`}
                      onClick={() => onLinkClick?.({ id: 'email', label: 'Email', url: `mailto:${email}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                      className="retro-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#111111] no-underline"
                    >
                      <Mail size={12} aria-hidden="true" />
                      <span>Email</span>
                    </a>
                  )}

                  {cleanWaNumber && (
                    <a
                      href={`https://wa.me/${cleanWaNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onLinkClick?.({ id: 'whatsapp', label: 'WhatsApp', url: `https://wa.me/${cleanWaNumber}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                      className="retro-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#111111] no-underline"
                    >
                      <MessageCircle size={12} aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {normalized.hasContactChannel && (
                    <button
                      type="button"
                      onClick={openContact}
                      className="retro-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#111111] cursor-pointer"
                    >
                      <MessageCircle size={12} aria-hidden="true" />
                      <span>Message</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveContact}
                    className="retro-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#111111] cursor-pointer"
                  >
                    <Download size={12} aria-hidden="true" />
                    <span>Save Contact</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Window 2: my_links (Desktop Icons Grid) */}
        {normalized.sectionVisibility.links && desktopIcons.length > 0 && (
          <section className="retro-window relative pt-10 p-5 sm:p-7 mb-8" aria-label="Links Directory">
            {/* Titlebar */}
            <div
              className="absolute left-[3px] right-[3px] top-[3px] h-[26px] px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
              style={{ backgroundColor: rawAccent, color: titleBarText }}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span aria-hidden="true">■</span>
                <span>C:\DESKTOP\links — {desktopIcons.length} Object(s)</span>
              </div>
              <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
                <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                  _
                </span>
                <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                  ×
                </span>
              </div>
            </div>

            {/* Desktop Folders Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
              {desktopIcons.map((item, idx) => {
                const isExt = item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'));

                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target={isExt ? '_blank' : undefined}
                    rel={isExt ? 'noopener noreferrer' : undefined}
                    onClick={(e) => {
                      if (item.action) {
                        e.preventDefault();
                        item.action();
                      } else if (onLinkClick) {
                        onLinkClick(
                          item.rawLink || {
                            id: item.id,
                            label: item.title,
                            url: item.url,
                            icon: null,
                            clicks: 0,
                            order: idx,
                            isVisible: true,
                          }
                        );
                      }
                    }}
                    className="retro-icon-card flex flex-col items-center text-center p-2 rounded cursor-pointer no-underline group min-w-0"
                  >
                    {/* Retro Yellow Folder Graphic */}
                    <div className="relative mb-2">
                      <div className="retro-folder-shape w-[54px] h-[44px] bg-[#f2c14e] flex items-center justify-center">
                        {item.platform ? (
                          <span className="text-[#111111] scale-90">
                            <SocialIcon icon={item.platform} className="w-5 h-5" />
                          </span>
                        ) : (
                          <Folder size={18} className="text-[#111111]" aria-hidden="true" />
                        )}
                      </div>
                    </div>

                    {/* Icon Text Label */}
                    <span className="retro-folder-label text-xs sm:text-sm font-bold text-[#111111] px-1.5 py-0.5 rounded-sm line-clamp-2 max-w-[128px] transition-colors break-words">
                      {item.title}
                    </span>

                    {item.subtitle && (
                      <span className="text-[11px] font-mono text-[#2b2923] truncate max-w-[120px] mt-0.5">
                        {item.subtitle}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Window 3: activity.log (Recent Activity) */}
        {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
          <section className="retro-window relative pt-10 p-5 sm:p-7 mb-8" aria-label="Activity Log">
            <div
              className="absolute left-[3px] right-[3px] top-[3px] h-[26px] px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
              style={{ backgroundColor: rawAccent, color: titleBarText }}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Terminal size={13} aria-hidden="true" />
                <span>activity.log — System Feed</span>
              </div>
              <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
                <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                  ×
                </span>
              </div>
            </div>
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant="the-desktop"
              accentColor={readableAccentOnWindow}
              autoScroll={profile.autoScroll}
            />
          </section>
        )}

        {/* Window 4: highlights.txt */}
        {normalized.sectionVisibility.proof && servicesList.length > 0 && (
          <section className="retro-window relative pt-10 p-5 sm:p-7 mb-8" aria-label="Highlights">
            {/* Titlebar */}
            <div
              className="absolute left-[3px] right-[3px] top-[3px] h-[26px] px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
              style={{ backgroundColor: rawAccent, color: titleBarText }}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span aria-hidden="true">■</span>
                <span>highlights.txt — Notepad</span>
              </div>
              <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
                <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                  _
                </span>
                <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                  ×
                </span>
              </div>
            </div>

            {/* Notepad Content */}
            <div className="bg-white border-2 border-[#111111] p-4 text-xs sm:text-sm font-mono space-y-2">
              <h2 className="font-bold pb-2 border-b border-[#111111]/20 text-xs sm:text-sm" style={{ color: readableAccentOnWhite }}>
                {'// TRACK RECORD & HIGHLIGHTS'}
              </h2>
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0 pt-1">
                {servicesList.map((srv, idx) => (
                  <li
                    key={idx}
                    className="bg-[#f4f4f4] text-[#111111] border-2 border-[#111111] px-3 py-1 font-bold text-xs shadow-[2px_2px_0_#111111]"
                  >
                    [✓] {srv}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Taskbar Footer with solid high-contrast surface */}
        <footer className="mt-10 bg-[#d8d2c2] border-2 border-[#111111] shadow-[3px_3px_0_#111111] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-[#111111] font-mono">
          <span>{location || `@${normalized.handle}`}</span>
          <span>&copy; {new Date().getFullYear()} {name}</span>
        </footer>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#d8d2c2] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0_#111111] px-4 py-2 font-bold text-xs flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2" style={{ backgroundColor: rawAccent }} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export function DesktopTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#4f8f8a"
      defaultAccent="#1d2d5c"
      isPreview={props.isPreview}
    >
      <DesktopTemplateInner {...props} />
    </ProfileTemplateShell>
  );
}

export default DesktopTemplate;
