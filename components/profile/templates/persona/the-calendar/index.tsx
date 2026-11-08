'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, ExternalLink, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

function cleanDisplayUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

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

export function CalendarTemplate({
  profile,
  accentColor = '#d94a38',
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Creator & Architect';
  const bio = profile?.bio || 'Designing timeless rituals, spaces, and digital experiences on a daily cadence.';
  const location = profile?.location || (profile as any)?.city || '';
  const avatarUrl = profile?.avatarUrl || (profile as any)?.avatar_url || '';
  const email = profile?.email || '';
  const phone = (profile as any)?.phone || '';
  const links: ProfileLink[] = (profile?.links || []).filter((l) => l.isVisible !== false);
  const proofs: ProfileProof[] = profile?.proofs || (profile as any)?.proofPoints || [];

  const numericPhone = useMemo(() => (phone || '').replace(/[^\d+]/g, ''), [phone]);
  const cleanWaNumber = useMemo(() => (phone || '').replace(/[^\d]/g, ''), [phone]);

  const initials = useMemo(() => {
    return (name || '')
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  // Current Day of Month (e.g., '08')
  const dateDay = useMemo(() => {
    const d = new Date();
    return String(d.getDate()).padStart(2, '0');
  }, []);

  const monthYear = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  }, []);

  const handleSaveContact = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${name}`,
        `TITLE:${role}`,
        email ? `EMAIL;TYPE=INTERNET,WORK:${email}` : '',
        numericPhone ? `TEL;TYPE=CELL,VOICE:${numericPhone}` : '',
        location ? `ADR;TYPE=WORK:;;${location};;;;` : '',
        `NOTE:${bio.replace(/\n/g, ' ')}`,
        `URL:${typeof window !== 'undefined' ? window.location.href : `https://${profile?.subdomain}.unool.com`}`,
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\r\n');

      const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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

    // Fallbacks to guarantee minimum 4 rich schedule entries
    if (slots.length < 4) {
      if (email) {
        slots.push({
          id: 'cal-email',
          title: 'Direct Dispatch',
          subtitle: email,
          url: `mailto:${email}`,
          time: TIME_SLOTS[tIdx++ % TIME_SLOTS.length],
        });
      }
      slots.push({
        id: 'cal-vcard',
        title: 'Save Contact Record',
        subtitle: 'Digital Dossier (.vcf)',
        url: '#',
        time: TIME_SLOTS[tIdx++ % TIME_SLOTS.length],
        action: () => handleSaveContact(),
      });
    }

    return slots;
  }, [links, socialEntries, proofs, email, handleSaveContact]);

  /* ─────────────────────────────────────────────────────────────
     Memo Notes & Services
     ───────────────────────────────────────────────────────────── */
  const memoNotes = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = p.title || p.value;
      if (label && !list.includes(label)) list.push(label);
    });
    if (list.length === 0) {
      list.push('Brand Architecture', 'Daily Editorial', 'Executive Advisory', 'Cultural Curation');
    }
    return list;
  }, [proofs]);

  return (
    <div className="calendar-root min-h-screen text-[#2a2420] relative selection:bg-[#d94a38] selection:text-white py-10 sm:py-16 md:py-20 px-4">
      {/* Google Fonts and Authentic Calendar Pad Styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Zen+Maru+Gothic:wght@500;700;900&display=swap');

            .calendar-root {
              --desk-bg: #2d3a35;
              --paper-bg: #fbf7ee;
              --ink: #2a2420;
              --c3: #e9dfc8;
              --binder-red: ${accentColor || '#d94a38'};
              --highlighter: #f7e08a;
              --e: cubic-bezier(0.2, 0.9, 0.2, 1);
              --s: 'Zen Maru Gothic', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: var(--desk-bg);
              font-family: var(--s);
            }

            @keyframes calendarDropIn {
              from {
                transform: perspective(900px) rotateX(-40deg);
                opacity: 0;
              }
              to {
                transform: perspective(900px) rotateX(0deg);
                opacity: 1;
              }
            }

            .calendar-sheet {
              transform-origin: top center;
              animation: calendarDropIn 1.1s var(--e) both;
              box-shadow: 0 30px 70px rgba(0, 0, 0, 0.65);
            }

            .calendar-schedule-row {
              transition: background 0.25s ease;
            }

            .calendar-schedule-row:hover {
              background: linear-gradient(transparent 52%, var(--highlighter) 52%);
            }

            .calendar-date-number {
              font-family: 'Rozha One', Georgia, serif;
            }
          `,
        }}
      />

      {/* Main Calendar Pad Sheet */}
      <main className="calendar-sheet w-full max-w-[620px] mx-auto bg-[#fbf7ee] rounded-2xl overflow-hidden relative z-10">
        {/* Perforated Red Binding Header with Binder Hole Cutouts */}
        <div
          className="relative h-[72px] sm:h-[80px] text-[#fbf7ee] font-black text-xs sm:text-sm tracking-[0.4em] uppercase flex items-center justify-center select-none"
          style={{
            backgroundColor: accentColor || '#d94a38',
            backgroundImage: `
              radial-gradient(circle, #2d3a35 0 8px, transparent 9px),
              radial-gradient(circle, #2d3a35 0 8px, transparent 9px)
            `,
            backgroundPosition: '22% 50%, 78% 50%',
            backgroundSize: '24px 24px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span>予定表 · SCHEDULE · {monthYear}</span>
        </div>

        {/* Calendar Page Content */}
        <div className="p-6 sm:p-8 md:p-10 relative">
          {/* Giant Date Number & Header Layout */}
          <div className="relative grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6 items-end mb-8">
            {/* Giant Date Numeral in Corner */}
            <div
              className="calendar-date-number absolute right-0 top-0 text-[96px] sm:text-[115px] leading-none select-none pointer-events-none opacity-85"
              style={{ color: accentColor || '#d94a38' }}
            >
              {dateDay}
            </div>

            {/* Avatar as Polaroid Photo Tilted */}
            <div className="relative shrink-0 z-10">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-28 h-36 sm:w-32 sm:h-40 object-cover rounded-sm border-[6px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] -rotate-3 transition-transform hover:rotate-0"
                />
              ) : (
                <div className="w-28 h-36 sm:w-32 sm:h-40 bg-[#e9dfc8] rounded-sm border-[6px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] -rotate-3 grid place-items-center text-3xl font-black text-[#2a2420]">
                  {initials}
                </div>
              )}
            </div>

            {/* Profile Identity Details */}
            <div className="z-10 pt-4 sm:pt-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.08] text-[#2a2420]">
                {name}
              </h1>

              <p
                className="text-sm sm:text-base font-black opacity-70 mt-1"
                style={{ color: accentColor || '#d94a38' }}
              >
                {role}
              </p>

              {location && (
                <div className="flex items-center gap-1.5 mt-2 text-xs font-black uppercase tracking-wider text-[#2a2420]/60">
                  <MapPin size={12} style={{ color: accentColor || '#d94a38' }} />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio Paragraph */}
          {bio && (
            <p className="text-sm sm:text-base font-medium leading-relaxed text-[#2a2420]/80 pb-6 border-b-2 border-[#2a2420]/10">
              {bio}
            </p>
          )}

          {/* Action Buttons: Call, Email, WhatsApp, Save Contact */}
          <div className="flex flex-wrap gap-2.5 my-6">
            {phone && (
              <a
                href={`tel:${numericPhone}`}
                className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-all duration-300 hover:text-white"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#d94a38')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2a2420')}
              >
                <Phone size={13} />
                <span>Call</span>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-all duration-300 hover:text-white"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#d94a38')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2a2420')}
              >
                <Mail size={13} />
                <span>Email</span>
              </a>
            )}

            {cleanWaNumber && (
              <a
                href={`https://wa.me/${cleanWaNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-all duration-300 hover:text-white"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#d94a38')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2a2420')}
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleSaveContact}
              className="inline-flex items-center gap-1.5 bg-[#2a2420] text-[#fbf7ee] px-4 py-2 rounded-full font-black text-xs tracking-wider transition-all duration-300 hover:text-white"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#d94a38')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2a2420')}
            >
              <Download size={13} />
              <span>Save Contact</span>
            </button>
          </div>

          {/* Section: SCHEDULE SLOTS */}
          <div className="mt-8">
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
                        onLinkClick({
                          id: slot.id,
                          label: slot.title,
                          url: slot.url,
                          icon: null,
                          clicks: 0,
                          order: 0,
                          isVisible: true,
                        });
                      }
                    }}
                    className="calendar-schedule-row group py-3.5 px-2 flex items-center gap-3 sm:gap-4 no-underline cursor-pointer"
                  >
                    {/* Time Slot Monospace Tag */}
                    <span
                      className="shrink-0 font-mono text-xs sm:text-sm font-bold w-12 sm:w-14"
                      style={{ color: accentColor || '#d94a38' }}
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
                        <div className="text-[11px] sm:text-xs font-mono text-[#2a2420]/60 truncate mt-0.5">
                          {slot.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Arrow CTA */}
                    <div className="shrink-0 text-sm font-black text-[#2a2420]/40 group-hover:text-[#2a2420] group-hover:translate-x-1 transition-all">
                      →
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Section: RECENT ACTIVITY */}
          {(profile as any)?.activity && (
            <div className="mt-8">
              <h2 className="text-xs font-black tracking-[0.3em] uppercase text-[#2a2420] border-b-2 border-[#2a2420] pb-2 mb-4">
                DAILY DISPATCH // BULLETIN
              </h2>
              <RecentActivitySection
                activity={(profile as any)?.activity}
                variant="the-calendar"
                accentColor={accentColor || '#d94a38'}
              />
            </div>
          )}

          {/* Section: NOTES & SERVICES (Memo Badges) */}
          {memoNotes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xs font-black tracking-[0.3em] uppercase text-[#2a2420] border-b-2 border-[#2a2420] pb-2 mb-4">
                NOTES & FOCUS AREAS
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
            </div>
          )}

          {/* Calendar Bottom Signature */}
          <footer className="mt-12 pt-6 border-t-2 border-[#2a2420]/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono font-bold text-[#2a2420]/60 uppercase tracking-widest text-center sm:text-left">
            <span>TOKYO & ATELIER DAILY SHEET</span>
            <span>UNOOL // THE CALENDAR</span>
          </footer>
        </div>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2a2420] text-[#fbf7ee] border-2 border-[#d94a38] px-4 py-2.5 rounded-xl font-black text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d94a38] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
