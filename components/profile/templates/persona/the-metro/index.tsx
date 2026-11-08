'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, ExternalLink, MapPin } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Contextual CTA Action Verbs for Metro Station Stops
   ───────────────────────────────────────────────────────────── */
function getMetroActionVerb(url: string, label: string): string {
  const u = (url || '').toLowerCase();
  const l = (label || '').toLowerCase();

  if (l.includes('portfolio') || l.includes('work') || l.includes('case stud') || u.includes('dribbble.com') || u.includes('behance.net')) return 'Explore';
  if (l.includes('website') || l.includes('site') || l.includes('homepage') || l.includes('web')) return 'Visit';
  if (u.includes('cal.com') || u.includes('calendly.com') || l.includes('book') || l.includes('schedule')) return 'Book';
  if (u.includes('wa.me') || u.includes('whatsapp') || l.includes('chat')) return 'Chat';
  if (u.includes('linkedin.com') || l.includes('connect')) return 'Connect';
  if (u.includes('.pdf') || l.includes('resume') || l.includes('cv') || l.includes('download')) return 'Get';
  if (u.includes('github.com') || u.includes('gitlab.com') || l.includes('code')) return 'Inspect';
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo') || l.includes('watch')) return 'Watch';
  if (u.includes('spotify.com') || u.includes('apple.com/music') || l.includes('listen')) return 'Listen';
  if (u.includes('substack.com') || u.includes('medium.com') || l.includes('blog') || l.includes('read')) return 'Read';

  const isSocial = /(?:^|[\/\.])x\.com(?=[\/\?#:]|$)/i.test(u) || u.includes('twitter.com') || u.includes('instagram.com') || u.includes('threads.net');
  if (isSocial) return 'Follow';

  return 'Visit';
}

function cleanDisplayUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function MetroTemplate({
  profile,
  accentColor = '#e5452b',
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Creator & Designer';
  const bio = profile?.bio || 'Building and crafting digital experiences. Connect to learn more about my work and journey.';
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
     Metro Line Stations: Curates user links + connected channels
     ───────────────────────────────────────────────────────────── */
  const stations = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      verb: string;
      platform?: string;
      customIcon?: string;
      isContactAction?: boolean;
      action?: () => void;
    }> = [];

    // 1. User Links
    links.forEach((l, idx) => {
      items.push({
        id: l.id || `metro-link-${idx}`,
        title: l.label,
        subtitle: cleanDisplayUrl(l.url),
        url: l.url,
        verb: getMetroActionVerb(l.url, l.label),
        customIcon: l.icon || undefined,
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
          verb: getMetroActionVerb(s.url, s.label),
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

    // Fallback station if list is brief
    if (items.length === 0) {
      items.push({
        id: 'station-dispatch',
        title: 'Direct Dispatch',
        subtitle: email || 'Connect with me',
        url: email ? `mailto:${email}` : '#',
        verb: 'Connect',
      });
    }

    return items;
  }, [links, socialEntries, proofs, email]);

  /* ─────────────────────────────────────────────────────────────
     Metro Facilities: Skills, proofs, specialties
     ───────────────────────────────────────────────────────────── */
  const facilities = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = p.title || p.value;
      if (label && !list.includes(label)) list.push(label);
    });
    if (list.length === 0) {
      list.push('Brand Identity', 'Digital Craft', 'System Architecture', 'Advisory');
    }
    return list;
  }, [proofs]);

  return (
    <div className="metro-root min-h-screen text-[#1b1b1b] relative selection:bg-[#e5452b] selection:text-white">
      {/* Google Font Embed for Japanese & International Transit Typography */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@500;800&display=swap');

            .metro-root {
              --bg: #f4f1ea;
              --ink: #1b1b1b;
              --c3: #cfc9bb;
              --accent: ${accentColor || '#e5452b'};
              --e: cubic-bezier(0.2, 0.8, 0.2, 1);
              --s: 'M PLUS 1p', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
              transition: all 0.3s var(--e);
            }

            .metro-station-card:hover .metro-station-node {
              background-color: var(--accent) !important;
              transform: scale(1.22);
              border-color: #1b1b1b;
            }

            .metro-station-card {
              transition: transform 0.35s var(--e), box-shadow 0.35s var(--e);
            }

            .metro-station-card:hover {
              transform: translateX(8px);
            }
          `,
        }}
      />

      {/* Main Container */}
      <main className="w-full max-w-[680px] mx-auto px-5 py-12 sm:py-16 md:py-20 relative z-10">
        {/* Header Profile Station */}
        <header className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
          {/* Avatar Station Badge */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-[7px] sm:border-[8px] shadow-sm"
                style={{ borderColor: accentColor || '#e5452b' }}
              />
            ) : (
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full grid place-items-center font-extrabold text-3xl sm:text-4xl text-white shadow-sm border-[7px] sm:border-[8px]"
                style={{
                  backgroundColor: '#1b1b1b',
                  borderColor: accentColor || '#e5452b',
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
              className="inline-grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white font-extrabold text-lg sm:text-xl mb-2.5 shadow-sm"
              style={{ backgroundColor: accentColor || '#e5452b' }}
            >
              01
            </div>

            {/* Profile Name */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#1b1b1b]">
              {name}
            </h1>

            {/* Role / Headline */}
            <p
              className="text-base sm:text-lg font-extrabold mt-1.5"
              style={{ color: accentColor || '#e5452b' }}
            >
              {role}
            </p>

            {/* Bio */}
            {bio && (
              <p className="mt-2.5 text-sm sm:text-base font-medium leading-relaxed text-[#1b1b1b]/80 max-w-xl">
                {bio}
              </p>
            )}

            {/* Location Tag */}
            {location && (
              <div className="flex items-center gap-1.5 mt-2.5 text-xs font-bold uppercase tracking-wider text-[#1b1b1b]/60">
                <MapPin size={13} style={{ color: accentColor || '#e5452b' }} />
                <span>{location}</span>
              </div>
            )}

            {/* Action Buttons: Call, Email, WhatsApp, Save Contact */}
            <div className="flex flex-wrap gap-2.5 mt-5">
              {phone && (
                <a
                  href={`tel:${numericPhone}`}
                  className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-all duration-300 hover:text-white"
                  style={{
                    ['--hover-bg' as any]: accentColor || '#e5452b',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#e5452b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b1b1b')}
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-all duration-300"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#e5452b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b1b1b')}
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
                  className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-all duration-300"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#e5452b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b1b1b')}
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleSaveContact}
                className="inline-flex items-center gap-1.5 bg-[#1b1b1b] text-white px-4 py-2 rounded-full font-extrabold text-xs tracking-wide transition-all duration-300"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor || '#e5452b')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b1b1b')}
              >
                <Download size={13} />
                <span>Save contact</span>
              </button>
            </div>
          </div>
        </header>

        {/* Section: STATIONS (Transit route list) */}
        <div className="mt-12 sm:mt-16">
          <h2 className="text-[12px] font-extrabold tracking-[0.3em] uppercase text-[#1b1b1b]/60 mb-6">
            STATIONS
          </h2>

          {/* Transit Line & Stations Container */}
          <div className="relative pl-[58px] sm:pl-[72px] grid gap-4">
            {/* The Vertical Metro Track Line */}
            <div
              className="metro-track-line absolute left-[18px] sm:left-[22px] top-4 bottom-4 w-3 sm:w-3.5 rounded-full z-0 shadow-inner"
              style={{ backgroundColor: accentColor || '#e5452b' }}
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
                      onLinkClick({
                        id: st.id,
                        label: st.title,
                        url: st.url,
                        icon: null,
                        clicks: 0,
                        order: 0,
                        isVisible: true,
                      });
                    }
                  }}
                  className="metro-station-card group relative bg-white border-[3px] border-[#1b1b1b] rounded-xl p-3.5 sm:p-4 font-extrabold flex items-center gap-3.5 sm:gap-4 no-underline z-10 shadow-sm"
                >
                  {/* Station Node on Track Line */}
                  <div
                    className="metro-station-node absolute -left-[50px] sm:-left-[61px] top-1/2 -mt-3.5 w-7 h-7 sm:w-7 sm:h-7 rounded-full bg-white border-[6px] sm:border-[6px] border-[#1b1b1b]"
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
                    <div className="text-sm sm:text-base font-extrabold text-[#1b1b1b] truncate group-hover:text-[#e5452b] transition-colors">
                      {st.title}
                    </div>
                    {st.subtitle && (
                      <div className="text-xs font-medium text-[#1b1b1b]/50 truncate mt-0.5 font-mono">
                        {st.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Action Verb / Subway Arrow */}
                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1b1b1b]/70 group-hover:text-[#e5452b] transition-colors">
                    <span className="hidden sm:inline">{st.verb}</span>
                    <span className="text-base leading-none">→</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Section: RECENT ACTIVITY (Subway Dispatch) */}
        {(profile as any)?.activity && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-[12px] font-extrabold tracking-[0.3em] uppercase text-[#1b1b1b]/60 mb-4">
              DISPATCH // BULLETIN
            </h2>
            <RecentActivitySection
              activity={(profile as any)?.activity}
              variant="the-metro"
              accentColor={accentColor || '#e5452b'}
            />
          </div>
        )}

        {/* Section: FACILITIES (Services, Skills & Specialties) */}
        {facilities.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-[12px] font-extrabold tracking-[0.3em] uppercase text-[#1b1b1b]/60 mb-4">
              FACILITIES & SPECIALTIES
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
          </div>
        )}

        {/* Transit Footer */}
        <footer className="mt-16 sm:mt-20 pt-6 border-t-2 border-[#1b1b1b]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#1b1b1b]/50 uppercase tracking-widest font-mono">
          <span>Tokyo & Worldwide · Transit System</span>
          <span>UNOOL // THE METRO</span>
        </footer>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1b1b1b] text-white border-2 border-[#e5452b] px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#e5452b] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
