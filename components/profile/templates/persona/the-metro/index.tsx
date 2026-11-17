'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { getActionVerb, cleanDisplayUrl, downloadProfileVCard } from '@/lib/profile/templateActions';
import { pickReadableText, solveAccessibleAccent } from '@/lib/profile/contrast';
import { Phone, Mail, MessageCircle, Download, MapPin } from 'lucide-react';

function MetroTemplateInner({
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

  const rawAccent = accentColor || normalized.accentColor || '#e5452b';
  const surfaceBg = '#f4f1ea';
  const readableAccent = useMemo(() => solveAccessibleAccent(rawAccent, surfaceBg), [rawAccent]);
  const badgeInk = useMemo(() => pickReadableText(rawAccent), [rawAccent]);

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
     Metro Line Stations: User links, channels & active projects
     ───────────────────────────────────────────────────────────── */
  const stations = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      verb: string;
      platform?: string;
      rawLink?: ProfileLink;
      action?: () => void;
    }> = [];

    // 1. User Links
    links.forEach((l, idx) => {
      items.push({
        id: l.id || `metro-link-${idx}`,
        title: l.label,
        subtitle: cleanDisplayUrl(l.url),
        url: l.url,
        verb: getActionVerb(l.url, l.label),
        rawLink: l,
      });
    });

    // 2. Connected Social Channels
    socialEntries.forEach((s, idx) => {
      const already = links.some((l) => l.url.toLowerCase().includes(s.platform.toLowerCase()));
      if (!already) {
        items.push({
          id: `metro-social-${s.platform}-${idx}`,
          title: s.label,
          subtitle: cleanDisplayUrl(s.url),
          url: s.url,
          verb: getActionVerb(s.url, s.label),
          platform: s.platform,
        });
      }
    });

    // 3. Active Projects from Proofs
    proofs.forEach((p, idx) => {
      const pTitle = (p.title || '').trim();
      const pVal = (p.value || '').trim();
      const combined = pTitle ? `${pTitle}: ${pVal}` : pVal;
      const urlMatch = combined.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
      if (urlMatch) {
        const foundUrl = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
        const already = items.some((it) => it.url && it.url.includes(urlMatch[1]));
        if (!already) {
          items.push({
            id: `metro-proof-${idx}`,
            title: pTitle || urlMatch[1],
            subtitle: cleanDisplayUrl(foundUrl),
            url: foundUrl,
            verb: 'Inspect',
          });
        }
      }
    });

    return items;
  }, [links, socialEntries, proofs]);

  /* ─────────────────────────────────────────────────────────────
     Metro Facilities: Real skills & proof metrics (no fake items)
     ───────────────────────────────────────────────────────────── */
  const facilities = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = [p.title, p.value].filter(Boolean).join(': ').trim();
      if (label && !list.includes(label)) list.push(label);
    });
    return list;
  }, [proofs]);

  return (
    <div className="metro-root min-h-screen text-[#1b1b1b] relative overflow-x-clip">
      <style>{`
        .metro-root {
          --bg: #f4f1ea;
          --ink: #1b1b1b;
          --muted: #45423d;
          --c3: #cfc9bb;
          --accent: ${rawAccent};
          --accent-text: ${readableAccent};
          --e: cubic-bezier(0.2, 0.8, 0.2, 1);
          --s: var(--font-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: var(--bg);
          font-family: var(--s);
        }

        @keyframes metroGrow {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }

        .metro-track-line {
          transform-origin: top;
          animation: metroGrow 1.2s var(--e) both;
        }

        .metro-station-node {
          transition: transform 0.3s var(--e), background-color 0.3s var(--e);
        }

        .metro-station-card:hover .metro-station-node {
          background-color: var(--accent) !important;
          transform: scale(1.18);
          border-color: #1b1b1b;
        }

        .metro-station-card {
          transition: transform 0.3s var(--e), box-shadow 0.3s var(--e);
        }

        .metro-station-card:hover {
          transform: translateX(6px);
        }

        @media (prefers-reduced-motion: reduce) {
          .metro-track-line,
          .metro-station-node,
          .metro-station-card {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <main className="w-full max-w-[680px] mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20 relative z-10">
        {/* Header Profile Station */}
        <header className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
          {/* Avatar Station Badge */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-[7px] sm:border-[8px] shadow-sm"
                style={{ borderColor: rawAccent }}
              />
            ) : (
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full grid place-items-center font-extrabold text-3xl sm:text-4xl text-white shadow-sm border-[7px] sm:border-[8px]"
                style={{
                  backgroundColor: '#1b1b1b',
                  borderColor: rawAccent,
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Profile Identity Details */}
          <div className="flex-1 min-w-0">
            {/* Station Route Pill */}
            <div
              className="inline-grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-full font-extrabold text-lg sm:text-xl mb-2.5 shadow-sm"
              style={{ backgroundColor: rawAccent, color: badgeInk }}
              aria-hidden="true"
            >
              01
            </div>

            {/* Profile Name */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#1b1b1b] break-words">
              {name}
            </h1>

            {/* Role / Headline */}
            {role && (
              <p
                className="text-base sm:text-lg font-extrabold mt-1.5"
                style={{ color: readableAccent }}
              >
                {role}
              </p>
            )}

            {/* OpenTo Intent Badges */}
            {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
              <div className="mt-3">
                <OpenToBadges intents={normalized.openTo} accentColor={readableAccent} variant="light" />
              </div>
            )}

            {/* Bio */}
            {normalized.sectionVisibility.bio && bio && (
              <p className="mt-2.5 text-sm sm:text-base font-medium leading-relaxed text-[#2d2b27] max-w-xl">
                {bio}
              </p>
            )}

            {/* Location & Timezone */}
            {(location || normalized.timezone) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs font-bold uppercase tracking-wider text-[#45423d]">
                <MapPin size={13} style={{ color: readableAccent }} aria-hidden="true" />
                <span>{[location, normalized.timezone].filter(Boolean).join(' · ')}</span>
              </div>
            )}

            {/* Action Buttons */}
            {normalized.sectionVisibility.contact && (
              <div className="flex flex-wrap gap-2.5 mt-5">
                {numericPhone && (
                  <a
                    href={`tel:${numericPhone}`}
                    onClick={() => onLinkClick?.({ id: 'call', label: 'Call', url: `tel:${numericPhone}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                    className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-colors hover:bg-[#35332f]"
                  >
                    <Phone size={13} aria-hidden="true" />
                    <span>Call</span>
                  </a>
                )}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    onClick={() => onLinkClick?.({ id: 'email', label: 'Email', url: `mailto:${email}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                    className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-colors hover:bg-[#35332f]"
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
                    className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-colors hover:bg-[#35332f]"
                  >
                    <MessageCircle size={13} aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {normalized.hasContactChannel && (
                  <button
                    type="button"
                    onClick={openContact}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: rawAccent, color: badgeInk }}
                  >
                    <MessageCircle size={13} aria-hidden="true" />
                    <span>Message</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveContact}
                  className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-colors hover:bg-[#35332f] cursor-pointer"
                >
                  <Download size={13} aria-hidden="true" />
                  <span>Save contact</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Section: STATIONS (Transit route list) */}
        {normalized.sectionVisibility.links && stations.length > 0 && (
          <section className="mt-12 sm:mt-16" aria-label="Stations and Links">
            <h2 className="text-[12px] font-extrabold tracking-[0.3em] uppercase text-[#45423d] mb-6">
              STATIONS
            </h2>

            {/* Transit Line & Stations Container */}
            <div className="relative pl-10 sm:pl-[72px] grid gap-4">
              {/* The Vertical Metro Track Line */}
              <div
                className="metro-track-line absolute left-3 sm:left-[22px] top-4 bottom-4 w-3 sm:w-3.5 rounded-full z-0 shadow-inner"
                style={{ backgroundColor: rawAccent }}
                aria-hidden="true"
              />

              {/* Station Stops */}
              {stations.map((st, idx) => {
                const stationNumber = String(idx + 1).padStart(2, '0');
                const isExt = st.url && (st.url.startsWith('http://') || st.url.startsWith('https://'));

                return (
                  <a
                    key={st.id}
                    href={st.url}
                    target={isExt ? '_blank' : undefined}
                    rel={isExt ? 'noopener noreferrer' : undefined}
                    onClick={(e) => {
                      if (st.action) {
                        e.preventDefault();
                        st.action();
                      } else if (onLinkClick) {
                        onLinkClick(
                          st.rawLink || {
                            id: st.id,
                            label: st.title,
                            url: st.url,
                            icon: null,
                            clicks: 0,
                            order: idx,
                            isVisible: true,
                          }
                        );
                      }
                    }}
                    className="metro-station-card group relative bg-white border-[3px] border-[#1b1b1b] rounded-xl p-3.5 sm:p-4 font-extrabold flex items-center gap-3 sm:gap-4 no-underline z-10 shadow-sm min-w-0"
                  >
                    {/* Station Node on Track Line */}
                    <div
                      className="metro-station-node absolute -left-[38px] sm:-left-[61px] top-1/2 -mt-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-[5px] sm:border-[6px] border-[#1b1b1b]"
                      aria-hidden="true"
                    />

                    {/* Station Number Badge */}
                    <span
                      className="shrink-0 text-xs sm:text-sm font-extrabold px-2 py-0.5 rounded-md text-white font-mono"
                      style={{ backgroundColor: '#1b1b1b' }}
                    >
                      {stationNumber}
                    </span>

                    {/* Brand / Platform Icon (if applicable) */}
                    {st.platform && (
                      <span className="shrink-0 text-[#1b1b1b]">
                        <SocialIcon icon={st.platform} className="w-[18px] h-[18px]" />
                      </span>
                    )}

                    {/* Station Name & Subtitle */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-extrabold text-[#1b1b1b] truncate transition-colors">
                        {st.title}
                      </div>
                      {st.subtitle && (
                        <div className="text-xs font-medium text-[#45423d] truncate mt-0.5 font-mono">
                          {st.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Action Verb / Subway Arrow */}
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#35332f] transition-colors">
                      <span className="hidden sm:inline">{st.verb}</span>
                      <span className="text-base leading-none" aria-hidden="true">→</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: RECENT ACTIVITY */}
        {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
          <section className="mt-12 sm:mt-16" aria-label="Dispatch Bulletin">
            <h2 className="text-[12px] font-extrabold tracking-[0.3em] uppercase text-[#45423d] mb-4">
              DISPATCH // BULLETIN
            </h2>
            <RecentActivitySection
              activity={normalized.recentActivity}
              variant="the-metro"
              accentColor={readableAccent}
              autoScroll={profile.autoScroll}
            />
          </section>
        )}

        {/* Section: FACILITIES (Skills & proofs) */}
        {normalized.sectionVisibility.proof && facilities.length > 0 && (
          <section className="mt-12 sm:mt-16" aria-label="Facilities and Highlights">
            <h2 className="text-[12px] font-extrabold tracking-[0.3em] uppercase text-[#45423d] mb-4">
              FACILITIES & HIGHLIGHTS
            </h2>
            <ul className="flex flex-wrap gap-2.5 p-0 list-none m-0">
              {facilities.map((fac, idx) => (
                <li
                  key={idx}
                  className="bg-[#1b1b1b] text-white rounded-lg px-4 py-2 font-extrabold text-xs tracking-wide shadow-sm"
                >
                  {fac}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Transit Footer */}
        <footer className="mt-16 sm:mt-20 pt-6 border-t-2 border-[#1b1b1b]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#45423d] uppercase tracking-widest font-mono">
          <span>{location || `@${normalized.handle}`}</span>
          <span>&copy; {new Date().getFullYear()} {name}</span>
        </footer>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#1b1b1b] text-white border-2 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-2xl flex items-center gap-2"
          style={{ borderColor: rawAccent }}
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rawAccent }} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export function MetroTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#f4f1ea"
      defaultAccent="#e5452b"
      isPreview={props.isPreview}
    >
      <MetroTemplateInner {...props} />
    </ProfileTemplateShell>
  );
}

export default MetroTemplate;
