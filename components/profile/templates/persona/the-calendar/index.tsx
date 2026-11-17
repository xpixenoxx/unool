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

// Time slots for schedule entries
const TIME_SLOTS = [
  '09:00',
  '11:30',
  '14:00',
  '16:30',
  '18:00',
  '20:15',
  '22:00',
];

function CalendarTemplateInner({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydration-safe calendar day & month formatting
  const [dateInfo, setDateInfo] = useState<{ day: string; monthYear: string }>(() => {
    const d = new Date();
    const day = String(d.getUTCDate()).padStart(2, '0');
    const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
    return { day, monthYear };
  });

  useEffect(() => {
    const d = new Date();
    setDateInfo({
      day: String(d.getDate()).padStart(2, '0'),
      monthYear: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
    });
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

  const rawAccent = accentColor || normalized.accentColor || '#d94a38';
  const paperBg = '#fbf7ee';
  const readableAccent = useMemo(() => solveAccessibleAccent(rawAccent, paperBg), [rawAccent]);
  const binderInk = useMemo(() => pickReadableText(rawAccent), [rawAccent]);

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
     Calendar Schedule Slots: Curated Links & Engagements
     ───────────────────────────────────────────────────────────── */
  const scheduleSlots = useMemo(() => {
    const slots: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      platform?: string;
      time: string;
      rawLink?: ProfileLink;
      action?: () => void;
    }> = [];

    let tIdx = 0;

    // 1. User Links
    links.forEach((l, idx) => {
      slots.push({
        id: l.id || `cal-link-${idx}`,
        title: l.label,
        subtitle: cleanDisplayUrl(l.url),
        url: l.url,
        time: TIME_SLOTS[tIdx++ % TIME_SLOTS.length],
        rawLink: l,
      });
    });

    // 2. Connected Social Channels
    socialEntries.forEach((s, idx) => {
      const already = links.some((l) => l.url.toLowerCase().includes(s.platform.toLowerCase()));
      if (!already) {
        slots.push({
          id: `cal-social-${s.platform}-${idx}`,
          title: s.label,
          subtitle: cleanDisplayUrl(s.url),
          url: s.url,
          platform: s.platform,
          time: TIME_SLOTS[tIdx++ % TIME_SLOTS.length],
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
        const already = slots.some((it) => it.url && it.url.includes(urlMatch[1]));
        if (!already) {
          slots.push({
            id: `cal-proof-${idx}`,
            title: pTitle || urlMatch[1],
            subtitle: cleanDisplayUrl(foundUrl),
            url: foundUrl,
            time: TIME_SLOTS[tIdx++ % TIME_SLOTS.length],
          });
        }
      }
    });

    return slots;
  }, [links, socialEntries, proofs]);

  /* ─────────────────────────────────────────────────────────────
     Memo Notes & Proofs (real proofs only)
     ───────────────────────────────────────────────────────────── */
  const memoNotes = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = [p.title, p.value].filter(Boolean).join(': ').trim();
      if (label && !list.includes(label)) list.push(label);
    });
    return list;
  }, [proofs]);

  return (
    <div className="calendar-root min-h-screen text-[#2a2420] relative py-10 sm:py-16 md:py-20 px-4 overflow-x-clip">
      <style>{`
        .calendar-root {
          --desk-bg: #2d3a35;
          --paper-bg: #fbf7ee;
          --ink: #2a2420;
          --c3: #e9dfc8;
          --binder-red: ${rawAccent};
          --highlighter: #f7e08a;
          --e: cubic-bezier(0.2, 0.9, 0.2, 1);
          --s: var(--font-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: var(--desk-bg);
          font-family: var(--s);
        }

        @keyframes calendarDropIn {
          from {
            transform: perspective(900px) rotateX(-24deg);
            opacity: 0;
          }
          to {
            transform: perspective(900px) rotateX(0deg);
            opacity: 1;
          }
        }

        .calendar-sheet {
          transform-origin: top center;
          animation: calendarDropIn 0.8s var(--e) both;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.65);
        }

        .calendar-schedule-row {
          transition: background 0.25s ease;
        }

        .calendar-schedule-row:hover {
          background: linear-gradient(transparent 52%, var(--highlighter) 52%);
        }

        .calendar-date-number {
          font-family: var(--font-cormorant), Georgia, serif;
        }

        @media (prefers-reduced-motion: reduce) {
          .calendar-sheet,
          .calendar-schedule-row {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Main Calendar Pad Sheet */}
      <main className="calendar-sheet w-full max-w-[620px] mx-auto bg-[#fbf7ee] rounded-2xl overflow-hidden relative z-10">
        {/* Perforated Binding Header with Binder Hole Cutouts */}
        <div
          className="relative h-[72px] sm:h-[80px] font-black text-xs sm:text-sm tracking-[0.35em] uppercase flex items-center justify-center select-none px-4"
          style={{
            backgroundColor: rawAccent,
            color: binderInk,
            backgroundImage: `
              radial-gradient(circle, #2d3a35 0 8px, transparent 9px),
              radial-gradient(circle, #2d3a35 0 8px, transparent 9px)
            `,
            backgroundPosition: '18% 50%, 82% 50%',
            backgroundSize: '24px 24px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span>予定表 · {dateInfo.monthYear}</span>
        </div>

        {/* Calendar Page Content */}
        <div className="p-6 sm:p-8 md:p-10 relative">
          {/* Date Number & Header Layout */}
          <div className="relative grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6 items-end mb-8">
            {/* Decorative Date Numeral aligned safely out of mobile text overlap */}
            <div
              className="calendar-date-number hidden sm:block absolute right-0 top-0 text-[84px] leading-none select-none pointer-events-none opacity-25"
              style={{ color: readableAccent }}
              aria-hidden="true"
            >
              {dateInfo.day}
            </div>

            {/* Avatar as Polaroid Photo Tilted */}
            <div className="relative shrink-0 z-10">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-28 h-36 sm:w-32 sm:h-40 object-cover rounded-sm border-[6px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] -rotate-2 transition-transform hover:rotate-0"
                />
              ) : (
                <div className="w-28 h-36 sm:w-32 sm:h-40 bg-[#e9dfc8] rounded-sm border-[6px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] -rotate-2 grid place-items-center text-3xl font-black text-[#2a2420]">
                  {initials}
                </div>
              )}
            </div>

            {/* Profile Identity Details */}
            <div className="z-10 pt-2 sm:pt-0 sm:pr-20 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.08] text-[#2a2420] break-words">
                {name}
              </h1>

              {role && (
                <p
                  className="text-sm sm:text-base font-black mt-1.5"
                  style={{ color: readableAccent }}
                >
                  {role}
                </p>
              )}

              {/* OpenTo Intent Badges */}
              {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
                <div className="mt-2.5">
                  <OpenToBadges intents={normalized.openTo} accentColor={readableAccent} variant="light" />
                </div>
              )}

              {(location || normalized.timezone) && (
                <div className="flex items-center gap-1.5 mt-2.5 text-xs font-black uppercase tracking-wider text-[#4a423b]">
                  <MapPin size={12} style={{ color: readableAccent }} aria-hidden="true" />
                  <span>{[location, normalized.timezone].filter(Boolean).join(' · ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio Paragraph */}
          {normalized.sectionVisibility.bio && bio && (
            <p className="text-sm sm:text-base font-medium leading-relaxed text-[#352f29] pb-6 border-b-2 border-[#2a2420]/15">
              {bio}
            </p>
          )}

          {/* Action Buttons */}
          {normalized.sectionVisibility.contact && (
            <div className="flex flex-wrap gap-2.5 my-6">
              {numericPhone && (
                <a
                  href={`tel:${numericPhone}`}
                  onClick={() => onLinkClick?.({ id: 'call', label: 'Call', url: `tel:${numericPhone}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                  className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-colors hover:bg-[#4a423b]"
                >
                  <Phone size={13} aria-hidden="true" />
                  <span>Call</span>
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
                  onClick={() => onLinkClick?.({ id: 'email', label: 'Email', url: `mailto:${email}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                  className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-colors hover:bg-[#4a423b]"
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
                  className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-colors hover:bg-[#4a423b]"
                >
                  <MessageCircle size={13} aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              )}

              {normalized.hasContactChannel && (
                <button
                  type="button"
                  onClick={openContact}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs tracking-wider transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: rawAccent, color: binderInk }}
                >
                  <MessageCircle size={13} aria-hidden="true" />
                  <span>Message</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveContact}
                className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-colors hover:bg-[#4a423b] cursor-pointer"
              >
                <Download size={13} aria-hidden="true" />
                <span>Save Contact</span>
              </button>
            </div>
          )}

          {/* Section: SCHEDULE SLOTS */}
          {normalized.sectionVisibility.links && scheduleSlots.length > 0 && (
            <section className="mt-8" aria-label="Schedule and Links">
              <h2 className="text-xs font-black tracking-[0.3em] uppercase text-[#2a2420] border-b-2 border-[#2a2420] pb-2 mb-3">
                SCHEDULE & ENGAGEMENTS
              </h2>

              <div className="divide-y divide-dotted divide-[#2a2420]/30">
                {scheduleSlots.map((slot, idx) => {
                  const isExt = slot.url && (slot.url.startsWith('http://') || slot.url.startsWith('https://'));

                  return (
                    <a
                      key={slot.id}
                      href={slot.url}
                      target={isExt ? '_blank' : undefined}
                      rel={isExt ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (slot.action) {
                          e.preventDefault();
                          slot.action();
                        } else if (onLinkClick) {
                          onLinkClick(
                            slot.rawLink || {
                              id: slot.id,
                              label: slot.title,
                              url: slot.url,
                              icon: null,
                              clicks: 0,
                              order: idx,
                              isVisible: true,
                            }
                          );
                        }
                      }}
                      className="calendar-schedule-row group py-3.5 px-2 flex items-center gap-3 sm:gap-4 no-underline cursor-pointer min-w-0"
                    >
                      {/* Time Slot Monospace Tag */}
                      <span
                        className="shrink-0 font-mono text-xs sm:text-sm font-bold w-12 sm:w-14"
                        style={{ color: readableAccent }}
                      >
                        {slot.time}
                      </span>

                      {/* Platform Icon */}
                      {slot.platform && (
                        <span className="shrink-0 text-[#2a2420]">
                          <SocialIcon icon={slot.platform} className="w-4 h-4" />
                        </span>
                      )}

                      {/* Slot Name & Subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-black text-[#2a2420] truncate">
                          {slot.title}
                        </div>
                        {slot.subtitle && (
                          <div className="text-[11px] sm:text-xs font-mono text-[#4a423b] truncate mt-0.5">
                            {slot.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Arrow CTA */}
                      <div className="shrink-0 text-sm font-black text-[#4a423b] group-hover:text-[#2a2420] transition-colors" aria-hidden="true">
                        →
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section: RECENT ACTIVITY */}
          {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
            <section className="mt-8" aria-label="Daily Dispatch Bulletin">
              <h2 className="text-xs font-black tracking-[0.3em] uppercase text-[#2a2420] border-b-2 border-[#2a2420] pb-2 mb-4">
                DAILY DISPATCH // BULLETIN
              </h2>
              <RecentActivitySection
                activity={normalized.recentActivity}
                variant="the-calendar"
                accentColor={readableAccent}
                autoScroll={profile.autoScroll}
              />
            </section>
          )}

          {/* Section: NOTES & HIGHLIGHTS */}
          {normalized.sectionVisibility.proof && memoNotes.length > 0 && (
            <section className="mt-8" aria-label="Notes and Focus Areas">
              <h2 className="text-xs font-black tracking-[0.3em] uppercase text-[#2a2420] border-b-2 border-[#2a2420] pb-2 mb-4">
                NOTES & HIGHLIGHTS
              </h2>
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {memoNotes.map((note, idx) => (
                  <li
                    key={idx}
                    className="bg-[#e9dfc8] text-[#2a2420] px-3.5 py-1.5 rounded-md font-bold text-xs tracking-wide shadow-sm"
                  >
                    • {note}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Calendar Bottom Signature */}
          <footer className="mt-12 pt-6 border-t-2 border-[#2a2420]/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono font-bold text-[#4a423b] uppercase tracking-widest text-center sm:text-left">
            <span>{location || `@${normalized.handle}`}</span>
            <span>&copy; {new Date().getFullYear()} {name}</span>
          </footer>
        </div>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#2a2420] text-[#fbf7ee] border-2 px-4 py-2.5 rounded-xl font-black text-xs shadow-2xl flex items-center gap-2"
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

export function CalendarTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#2d3a35"
      isDark={true}
      defaultAccent="#d94a38"
      isPreview={props.isPreview}
    >
      <CalendarTemplateInner {...props} />
    </ProfileTemplateShell>
  );
}

export default CalendarTemplate;
