'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, Folder, ExternalLink, Terminal, MapPin } from 'lucide-react';

function cleanDisplayUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function DesktopTemplate({
  profile,
  accentColor = '#1d2d5c',
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Creator & Engineer';
  const bio = profile?.bio || 'Building systems, crafting interfaces, and compiling ideas on the retro workstation.';
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
     Desktop Icons: Folders & System Applications
     ───────────────────────────────────────────────────────────── */
  const desktopIcons = useMemo(() => {
    const icons: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      platform?: string;
      action?: () => void;
    }> = [];

    // 1. User Links
    links.forEach((l, idx) => {
      icons.push({
        id: l.id || `icon-link-${idx}`,
        title: l.label,
        subtitle: cleanDisplayUrl(l.url),
        url: l.url,
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

    // Fallbacks to guarantee minimum 4 rich icons
    if (icons.length < 4) {
      if (email) {
        icons.push({
          id: 'icon-email',
          title: 'mail.exe',
          subtitle: email,
          url: `mailto:${email}`,
        });
      }
      icons.push({
        id: 'icon-vcard',
        title: 'contact.vcf',
        subtitle: 'Save Contact',
        url: '#',
        action: () => handleSaveContact(),
      });
    }

    return icons;
  }, [links, socialEntries, proofs, email, handleSaveContact]);

  /* ─────────────────────────────────────────────────────────────
     Services List (services.txt)
     ───────────────────────────────────────────────────────────── */
  const servicesList = useMemo(() => {
    const list: string[] = [];
    proofs.forEach((p) => {
      const label = p.title || p.value;
      if (label && !list.includes(label)) list.push(label);
    });
    if (list.length === 0) {
      list.push('System Architecture', 'UI/UX Engineering', 'API Design', 'Creative Direction');
    }
    return list;
  }, [proofs]);

  return (
    <div className="retro-root min-h-screen text-[#111111] relative selection:bg-[#1d2d5c] selection:text-white">
      {/* Google Fonts and Authentic CRT Desktop Grid */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=IBM+Plex+Mono:wght@500;700&display=swap');

            .retro-root {
              --bg: #4f8f8a;
              --ink: #111111;
              --c3: #c2bcab;
              --win-bg: #d8d2c2;
              --title-navy: ${accentColor || '#1d2d5c'};
              --folder-yellow: #f2c14e;
              --s: 'Pixelify Sans', 'IBM Plex Mono', monospace, sans-serif;
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
              transition: background-color 0.15s;
            }

            .retro-btn:active,
            .retro-btn:hover {
              background-color: var(--title-navy) !important;
              color: #ffffff !important;
            }

            .retro-folder-shape {
              clip-path: polygon(0 0, 40% 0, 50% 14%, 100% 14%, 100% 100%, 0 100%);
              border: 2px solid #111111;
              box-shadow: 3px 3px 0 #111111;
            }

            .retro-icon-card:hover .retro-folder-label {
              background-color: var(--title-navy);
              color: #ffffff;
              outline: 1px dotted #ffffff;
            }
          `,
        }}
      />

      {/* Main Container */}
      <main className="w-full max-w-[820px] mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20 relative z-10">
        {/* Window 1: profile.exe */}
        <div className="retro-window relative pt-10 p-5 sm:p-7 mb-8">
          {/* Titlebar */}
          <div
            className="absolute left-[3px] right-[3px] top-[3px] h-[26px] text-white px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
            style={{ backgroundColor: accentColor || '#1d2d5c' }}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span>■</span>
              <span>profile.exe — System Identity</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
            {/* Pixelated Avatar */}
            <div className="mx-auto sm:mx-0 w-32 h-32 sm:w-36 sm:h-36 shrink-0 relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover border-2 border-[#111111] shadow-[inset_2px_2px_0_rgba(0,0,0,0.4)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="w-full h-full bg-[#c2bcab] border-2 border-[#111111] grid place-items-center text-4xl font-bold text-[#111111] shadow-[inset_2px_2px_0_rgba(0,0,0,0.4)]">
                  {initials}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center sm:text-left">
              {/* Retro Badge Mark */}
              <p
                className="text-base font-bold tracking-widest mb-1"
                style={{ color: accentColor || '#1d2d5c' }}
              >
                窓 OS 95
              </p>

              {/* Name */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111111] leading-none">
                {name}
              </h1>

              {/* Role */}
              <p className="text-sm sm:text-base font-bold opacity-75 mt-1.5">
                {role}
              </p>

              {/* Bio */}
              {bio && (
                <p className="mt-2.5 text-xs sm:text-sm font-medium leading-relaxed opacity-85">
                  {bio}
                </p>
              )}

              {/* Location */}
              {location && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2.5 text-xs font-bold opacity-70">
                  <MapPin size={12} />
                  <span>{location}</span>
                </div>
              )}

              {/* 3D Bevel Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-5 justify-center sm:justify-start">
                {phone && (
                  <a
                    href={`tel:${numericPhone}`}
                    className="retro-btn inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#111111] no-underline"
                  >
                    <Phone size={12} />
                    <span>Call</span>
                  </a>
                )}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="retro-btn inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#111111] no-underline"
                  >
                    <Mail size={12} />
                    <span>Email</span>
                  </a>
                )}

                {cleanWaNumber && (
                  <a
                    href={`https://wa.me/${cleanWaNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-btn inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#111111] no-underline"
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleSaveContact}
                  className="retro-btn inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#111111] cursor-pointer"
                >
                  <Download size={12} />
                  <span>Save Contact</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Window 2: my_links (Desktop Icons Grid) */}
        <div className="retro-window relative pt-10 p-5 sm:p-7 mb-8">
          {/* Titlebar */}
          <div
            className="absolute left-[3px] right-[3px] top-[3px] h-[26px] text-white px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
            style={{ backgroundColor: accentColor || '#1d2d5c' }}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span>■</span>
              <span>C:\DESKTOP\my_links — {desktopIcons.length} Object(s)</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
                      onLinkClick({
                        id: item.id,
                        label: item.title,
                        url: item.url,
                        icon: null,
                        clicks: 0,
                        order: 0,
                        isVisible: true,
                      });
                    }
                  }}
                  className="retro-icon-card flex flex-col items-center text-center p-2 rounded cursor-pointer no-underline group"
                >
                  {/* Retro Yellow Folder Graphic */}
                  <div className="relative mb-2">
                    <div className="retro-folder-shape w-[54px] h-[44px] bg-[#f2c14e] flex items-center justify-center">
                      {item.platform ? (
                        <span className="text-[#111111] scale-90">
                          <SocialIcon icon={item.platform} className="w-5 h-5" />
                        </span>
                      ) : (
                        <Folder size={18} className="text-[#111111]" />
                      )}
                    </div>
                  </div>

                  {/* Icon Text Label with 90s OS selection effect */}
                  <span className="retro-folder-label text-xs sm:text-sm font-bold text-[#111111] px-1.5 py-0.5 rounded-sm line-clamp-2 max-w-[120px] transition-colors">
                    {item.title}
                  </span>

                  {item.subtitle && (
                    <span className="text-[10px] font-mono opacity-60 truncate max-w-[110px] mt-0.5">
                      {item.subtitle}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>

        {/* Window 3: activity.log (Recent Activity) */}
        {(profile as any)?.activity && (
          <div className="retro-window relative pt-10 p-5 sm:p-7 mb-8">
            <div
              className="absolute left-[3px] right-[3px] top-[3px] h-[26px] text-white px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
              style={{ backgroundColor: accentColor || '#1d2d5c' }}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Terminal size={13} />
                <span>■ activity.log — System Feed</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-3.5 h-3.5 bg-[#d8d2c2] text-[#111] grid place-items-center text-[10px] leading-none border border-[#111] font-bold">
                  ×
                </span>
              </div>
            </div>
            <RecentActivitySection
              activity={(profile as any)?.activity}
              variant="the-desktop"
              accentColor={accentColor || '#1d2d5c'}
            />
          </div>
        )}

        {/* Window 4: services.txt (Services & Archive) */}
        {servicesList.length > 0 && (
          <div className="retro-window relative pt-10 p-5 sm:p-7">
            {/* Titlebar */}
            <div
              className="absolute left-[3px] right-[3px] top-[3px] h-[26px] text-white px-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider select-none"
              style={{ backgroundColor: accentColor || '#1d2d5c' }}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span>■</span>
                <span>services.txt — Notepad</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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
              <div className="text-[#1d2d5c] font-bold pb-2 border-b border-[#111111]/20">
                // ACTIVE OPERATIONAL CAPABILITIES
              </div>
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0 pt-1">
                {servicesList.map((srv, idx) => (
                  <li
                    key={idx}
                    className="bg-[#f4f4f4] border-2 border-[#111111] px-3 py-1 font-bold text-xs shadow-[2px_2px_0_#111111]"
                  >
                    [✓] {srv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Taskbar / Footer */}
        <footer className="mt-12 sm:mt-16 pt-4 border-t-2 border-[#111111]/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold opacity-75 font-mono">
          <span>WINDOWS 95 // RETRO WORKSTATION</span>
          <span>UNOOL // THE DESKTOP</span>
        </footer>
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#d8d2c2] text-[#111111] border-2 border-[#111111] box-shadow-[4px_4px_0_#111111] px-4 py-2 font-bold text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 bg-[#1d2d5c]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
