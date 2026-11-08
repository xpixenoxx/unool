'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, ExternalLink, MapPin } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Noren Dye Palettes for Hanging Fabric Curtains
   ───────────────────────────────────────────────────────────── */
const NOREN_DYES = [
  { bg: '#1d3b53', text: '#f3ecdc', tag: '藍', name: 'Indigo' },
  { bg: '#e0734f', text: '#f3ecdc', tag: '柿', name: 'Persimmon' },
  { bg: '#8fa86a', text: '#123432', tag: '苔', name: 'Matcha' },
  { bg: '#c9552f', text: '#f3ecdc', tag: '朱', name: 'Vermilion' },
  { bg: '#3e3a4f', text: '#f3ecdc', tag: '紫', name: 'Plum' },
  { bg: '#2b4c48', text: '#f3ecdc', tag: '青', name: 'Forest' },
];

function cleanDisplayUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function NorenTemplate({
  profile,
  accentColor = '#e0734f',
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Creator & Craftsman';
  const bio = profile?.bio || 'Dedicated to intentional craft, timeless aesthetics, and culture-defining endeavors.';
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
     Noren Panels: Links, connected channels, and portfolio works
     ───────────────────────────────────────────────────────────── */
  const norenPanels = useMemo(() => {
    const panels: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      platform?: string;
      dyeIndex: number;
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
        dyeIndex: (dIdx++) % NOREN_DYES.length,
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
          dyeIndex: (dIdx++) % NOREN_DYES.length,
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
            dyeIndex: (dIdx++) % NOREN_DYES.length,
          });
        }
      }
    });

    // Fallbacks to guarantee minimum 3 rich curtains
    if (panels.length < 3) {
      if (email) {
        panels.push({
          id: 'noren-email',
          title: 'Direct Dispatch',
          subtitle: email,
          url: `mailto:${email}`,
          dyeIndex: (dIdx++) % NOREN_DYES.length,
        });
      }
      panels.push({
        id: 'noren-dossier',
        title: 'Save Contact',
        subtitle: 'Digital vCard',
        url: '#',
        action: () => handleSaveContact(),
        dyeIndex: (dIdx++) % NOREN_DYES.length,
      });
    }

    return panels;
  }, [links, socialEntries, proofs, email, handleSaveContact]);

  /* ─────────────────────────────────────────────────────────────
     Notes & Services / Facilities List
     ───────────────────────────────────────────────────────────── */
  const notes = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = p.title || p.value;
      if (label && !list.includes(label)) list.push(label);
    });
    if (list.length === 0) {
      list.push('Brand Identity', 'Architectural Design', 'Atelier Consulting', 'Editorial Craft');
    }
    return list;
  }, [proofs]);

  return (
    <div className="noren-root min-h-screen text-[#f3ecdc] relative selection:bg-[#e0734f] selection:text-white">
      {/* Google Fonts and Authentic Textile Styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;800&family=Zen+Maru+Gothic:wght@700;900&display=swap');

            .noren-root {
              --bg: #123432;
              --ink: #f3ecdc;
              --c3: #1d4f4b;
              --terracotta: ${accentColor || '#e0734f'};
              --wood: #6b4a2f;
              --e: cubic-bezier(0.2, 0.8, 0.2, 1);
              --s: 'Shippori Mincho', 'Noto Serif JP', 'Zen Maru Gothic', Georgia, serif;
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
                transform: rotate(5deg);
              }
              50% {
                transform: rotate(-4deg);
              }
              75% {
                transform: rotate(2deg);
              }
              100% {
                transform: rotate(0deg);
              }
            }

            .noren-curtain-panel {
              transform-origin: top center;
              clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 93%, 0 100%);
              animation: norenHangIn 1s var(--e) both;
              transition: transform 0.4s var(--e), box-shadow 0.4s var(--e);
            }

            .noren-curtain-panel:hover {
              animation: norenSway 1.3s ease-in-out;
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
          `,
        }}
      />

      {/* Main Sanctuary Canvas */}
      <main className="w-full max-w-[920px] mx-auto px-5 sm:px-8 py-12 sm:py-16 md:py-24 relative z-10">
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
                  outline: `2px solid ${accentColor || '#e0734f'}`,
                  outlineOffset: '6px',
                }}
              />
            ) : (
              <div
                className="w-full h-full rounded-xl grid place-items-center font-extrabold text-4xl sm:text-5xl text-[#f3ecdc] border-[6px] sm:border-[8px] border-[#f3ecdc] shadow-2xl"
                style={{
                  backgroundColor: '#1d4f4b',
                  outline: `2px solid ${accentColor || '#e0734f'}`,
                  outlineOffset: '6px',
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Profile Identity Details */}
          <div className="text-center md:text-left">
            {/* Japanese Seal Symbol */}
            <p
              className="text-lg sm:text-xl font-extrabold tracking-[0.5em] mb-2"
              style={{ color: accentColor || '#e0734f' }}
            >
              暖簾
            </p>

            {/* Profile Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-[#f3ecdc]">
              {name}
            </h1>

            {/* Role / Headline */}
            <p className="text-base sm:text-lg font-medium opacity-85 mt-2 text-[#f3ecdc]">
              {role}
            </p>

            {/* Bio */}
            {bio && (
              <p className="mt-3 text-sm sm:text-base leading-relaxed opacity-80 max-w-xl text-[#f3ecdc]">
                {bio}
              </p>
            )}

            {/* Location Tag */}
            {location && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 mt-3 text-xs font-semibold tracking-wider opacity-70">
                <MapPin size={13} style={{ color: accentColor || '#e0734f' }} />
                <span>{location}</span>
              </div>
            )}

            {/* Action Buttons: Call, Email, WhatsApp, Save Contact */}
            <div className="flex flex-wrap gap-2.5 mt-6 justify-center md:justify-start">
              {phone && (
                <a
                  href={`tel:${numericPhone}`}
                  className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-all duration-300 hover:text-white"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor || '#e0734f';
                    e.currentTarget.style.borderColor = accentColor || '#e0734f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#f3ecdc';
                  }}
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-all duration-300 hover:text-white"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor || '#e0734f';
                    e.currentTarget.style.borderColor = accentColor || '#e0734f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#f3ecdc';
                  }}
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
                  className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-all duration-300 hover:text-white"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor || '#e0734f';
                    e.currentTarget.style.borderColor = accentColor || '#e0734f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#f3ecdc';
                  }}
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleSaveContact}
                className="inline-flex items-center gap-1.5 border border-[#f3ecdc] text-[#f3ecdc] px-4 py-2 rounded font-extrabold text-xs tracking-wider transition-all duration-300 hover:text-white"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = accentColor || '#e0734f';
                  e.currentTarget.style.borderColor = accentColor || '#e0734f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#f3ecdc';
                }}
              >
                <Download size={13} />
                <span>Save contact</span>
              </button>
            </div>
          </div>
        </header>

        {/* Section: NOREN HANGING CURTAINS */}
        <div className="mt-14 sm:mt-20">
          <div className="text-center md:text-left mb-6">
            <h2 className="text-xs font-extrabold tracking-[0.4em] uppercase opacity-75 text-[#f3ecdc]">
              NOREN CURTAINS · 暖簾
            </h2>
          </div>

          {/* Wooden Rod & Hanging Fabric Panels */}
          <div className="relative pt-6 sm:pt-8">
            {/* Wooden Curtain Rod Beam */}
            <div className="absolute left-0 right-0 top-0 h-3.5 sm:h-4 bg-[#6b4a2f] rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.55)] border-t border-[#8b6545] z-20" />

            {/* Fabric Curtains Layout */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-3.5 justify-center sm:justify-start overflow-x-auto pb-4 pt-2 no-scrollbar">
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
                        onLinkClick({
                          id: panel.id,
                          label: panel.title,
                          url: panel.url,
                          icon: null,
                          clicks: 0,
                          order: 0,
                          isVisible: true,
                        });
                      }
                    }}
                    style={{
                      backgroundColor: dye.bg,
                      color: dye.text,
                      animationDelay: `${idx * 0.12 + 0.3}s`,
                    }}
                    className="noren-curtain-panel group relative shrink-0 w-full sm:w-[110px] md:w-[124px] sm:h-[300px] md:h-[320px] p-5 sm:p-4 rounded-b-sm shadow-xl flex flex-col justify-between items-center no-underline cursor-pointer"
                  >
                    {/* Top Loop / Dye Seal */}
                    <div className="w-full flex items-center justify-between opacity-80 pb-2 border-b border-current/20">
                      <span className="text-xs font-mono font-bold">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-extrabold font-serif">
                        {dye.tag}
                      </span>
                    </div>

                    {/* Middle Content: Japanese Vertical Label on Desktop, Fluid on Mobile */}
                    <div className="my-auto text-center flex flex-col items-center gap-2 py-4">
                      {panel.platform && (
                        <span className="shrink-0 mb-1 opacity-90 group-hover:scale-110 transition-transform">
                          <SocialIcon icon={panel.platform} className="w-5 h-5" />
                        </span>
                      )}
                      <span className="noren-v-text text-base sm:text-lg md:text-xl font-extrabold leading-tight">
                        {panel.title}
                      </span>
                      {panel.subtitle && (
                        <span className="text-[10px] sm:text-[11px] font-mono opacity-70 tracking-tight sm:hidden">
                          {panel.subtitle}
                        </span>
                      )}
                    </div>

                    {/* Bottom Swallowtail Arrow */}
                    <div className="pt-2 text-xs font-extrabold opacity-75 group-hover:opacity-100 transition-opacity">
                      <span>↓</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section: RECENT ACTIVITY (Indigo Dispatch) */}
        {(profile as any)?.activity && (
          <div className="mt-14 sm:mt-18">
            <h2 className="text-xs font-extrabold tracking-[0.4em] uppercase opacity-75 text-[#f3ecdc] mb-4">
              DISPATCH // TEA LOG
            </h2>
            <RecentActivitySection
              activity={(profile as any)?.activity}
              variant="the-noren"
              accentColor={accentColor || '#e0734f'}
            />
          </div>
        )}

        {/* Section: NOTES & SERVICES (Rice Paper Dossier) */}
        {notes.length > 0 && (
          <div className="mt-14 sm:mt-18 bg-[#f3ecdc] text-[#123432] rounded-xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#123432]/20 pb-3 mb-5">
              <h2 className="text-xs font-extrabold tracking-[0.3em] uppercase text-[#123432]">
                NOTES & SERVICES · 業務案内
              </h2>
              <span className="text-xs font-mono font-bold opacity-60">
                0{notes.length} ITEMS
              </span>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
              {notes.map((note, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 font-extrabold text-sm sm:text-base py-1.5 border-b border-[#123432]/10"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e0734f]" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Noren Footer */}
        <footer className="mt-16 sm:mt-20 pt-6 border-t border-[#f3ecdc]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold opacity-60 uppercase tracking-widest text-center sm:text-left">
          <span>Kyoto Atelier & International Division</span>
          <span>UNOOL // THE NOREN</span>
        </footer>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#f3ecdc] text-[#123432] border-2 border-[#e0734f] px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#e0734f] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
