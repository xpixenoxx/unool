'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon, normalizeSocialPlatform } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, MapPin, ExternalLink, Sparkles } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Action Verb Intelligence: Contextual CTA verbs for book spines
   ───────────────────────────────────────────────────────────── */
function getBookActionVerb(url: string, label: string): string {
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

  const isX = /(?:^|[\/\.])x\.com(?=[\/\?#:]|$)/i.test(u) || u.includes('twitter.com') || l === 'x' || l === 'twitter';
  const isSocial = isX || u.includes('instagram.com') || u.includes('threads.net') || u.includes('tiktok.com');
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

// Distinct book spine color themes for visual archival diversity
const SPINE_PALETTES = [
  { bg: '#7a2e2e', fg: '#f4ead7', ribbon: '#d4af37', height: 268 }, // Burgundy
  { bg: '#2e4a3f', fg: '#f4ead7', ribbon: '#d4af37', height: 284 }, // Hunter Green
  { bg: '#c98f2b', fg: '#2b2118', ribbon: '#7a2e2e', height: 242 }, // Ochre Gold
  { bg: '#1f3550', fg: '#f4ead7', ribbon: '#d4af37', height: 254 }, // Midnight Navy
  { bg: '#6b4a32', fg: '#f4ead7', ribbon: '#c98f2b', height: 276 }, // Leather Walnut
  { bg: '#4b5d67', fg: '#f4ead7', ribbon: '#d4af37', height: 250 }, // Slate Teal
  { bg: '#8a8f98', fg: '#1d1d1d', ribbon: '#7a2e2e', height: 262 }, // Ash Grey
  { bg: '#d8c9a0', fg: '#2b2118', ribbon: '#2e4a3f', height: 246 }, // Parchment Gold
  { bg: '#3a3a3a', fg: '#f4ead7', ribbon: '#d4af37', height: 270 }, // Charcoal
];

export function BookshelfTemplate({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Author & Creator';
  const bio = profile?.bio || 'Curating thoughts, artifacts, and select professional engagements.';
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
     World's Best Bookshelf Synthesis:
     Curates links, social channels, active projects & essential
     bound volumes so the shelf is always rich, balanced & full!
     ───────────────────────────────────────────────────────────── */
  const shelfVolumes = useMemo(() => {
    const volumes: Array<{
      id: string;
      title: string;
      subtitle: string;
      url?: string;
      verb: string;
      iconType: 'link' | 'social' | 'dossier' | 'email' | 'chat';
      platform?: string;
      customIcon?: string;
      paletteIndex: number;
      action?: () => void;
    }> = [];

    let pIdx = 0;

    // 1. User Links
    links.forEach((l, idx) => {
      volumes.push({
        id: l.id || `link-${idx}`,
        title: l.label,
        subtitle: cleanDisplayUrl(l.url),
        url: l.url,
        verb: getBookActionVerb(l.url, l.label),
        iconType: 'link',
        customIcon: l.icon || undefined,
        paletteIndex: (pIdx++) % SPINE_PALETTES.length,
      });
    });

    // 2. Connected Social Channels as Bound Volumes
    socialEntries.forEach((s, idx) => {
      const already = links.some((l) => l.url.toLowerCase().includes(s.platform.toLowerCase()));
      if (!already) {
        volumes.push({
          id: `social-${s.platform}-${idx}`,
          title: s.label,
          subtitle: cleanDisplayUrl(s.url),
          url: s.url,
          verb: getBookActionVerb(s.url, s.label),
          iconType: 'social',
          platform: s.platform,
          paletteIndex: (pIdx++) % SPINE_PALETTES.length,
        });
      }
    });

    // 3. Active Project from Proofs (if exists and has URL)
    proofs.forEach((p, idx) => {
      const pTitle = (p.title || '').trim();
      const pVal = (p.value || '').trim();
      const combined = pTitle ? `${pTitle}: ${pVal}` : pVal;
      const urlMatch = combined.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
      if (urlMatch) {
        const foundUrl = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
        const already = volumes.some((v) => v.url && v.url.includes(urlMatch[1]));
        if (!already) {
          volumes.push({
            id: `project-${idx}`,
            title: pTitle || urlMatch[1],
            subtitle: cleanDisplayUrl(foundUrl),
            url: foundUrl,
            verb: 'Inspect',
            iconType: 'link',
            paletteIndex: (pIdx++) % SPINE_PALETTES.length,
          });
        }
      }
    });

    // 4. Essential Curated Volumes:
    // Ensure the shelf has at least 4 richly bound editions
    if (volumes.length < 4) {
      volumes.push({
        id: 'curator-dossier',
        title: 'The Dossier',
        subtitle: 'Save Contact Record',
        verb: 'Save',
        iconType: 'dossier',
        paletteIndex: (pIdx++) % SPINE_PALETTES.length,
        action: () => handleSaveContact(),
      });
    }

    if (volumes.length < 4 && email) {
      volumes.push({
        id: 'direct-dispatch',
        title: 'Direct Dispatch',
        subtitle: email,
        url: `mailto:${email}`,
        verb: 'Email',
        iconType: 'email',
        paletteIndex: (pIdx++) % SPINE_PALETTES.length,
      });
    }

    if (volumes.length < 4 && cleanWaNumber) {
      volumes.push({
        id: 'private-wire',
        title: 'Private Wire',
        subtitle: 'WhatsApp Direct',
        url: `https://wa.me/${cleanWaNumber}`,
        verb: 'Chat',
        iconType: 'chat',
        paletteIndex: (pIdx++) % SPINE_PALETTES.length,
      });
    }

    return volumes;
  }, [links, socialEntries, proofs, email, cleanWaNumber, handleSaveContact]);

  const structuredData = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: name,
      jobTitle: role,
      description: bio,
      image: avatarUrl || undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      email: email ? `mailto:${email}` : undefined,
      telephone: numericPhone || undefined,
      sameAs: [
        ...links.map((l) => l.url),
        ...socialEntries.map((s) => s.url),
      ].filter(Boolean),
    };
  }, [name, role, bio, avatarUrl, email, numericPhone, links, socialEntries]);

  return (
    <div className="bookshelf-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <style>{`
        .bookshelf-wrap {
          --bs-bg: #d9c7bd;
          --bs-wood: #6b4a32;
          --bs-wood-dark: #3a2a1c;
          --bs-text: #2b2118;
          --bs-gold: #b8975a;
          --bs-gold-bright: #d9b86c;
          --bs-parchment: #efe6dc;
          --bs-accent: ${accentColor ? accentColor : '#6b4a32'};

          background: var(--bs-bg);
          color: var(--bs-text);
          font-family: 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          width: 100%;
          padding: 34px 18px 120px;
          position: relative;
          -webkit-font-smoothing: antialiased;
        }

        .bookshelf-container {
          max-width: 880px;
          margin: 0 auto;
        }

        /* ── Header Dossier ── */
        .bs-header {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-bottom: 38px;
          flex-wrap: wrap;
        }

        .bs-portrait-frame {
          flex: none;
          width: 140px;
          height: 175px;
          background: var(--bs-parchment);
          color: var(--bs-wood);
          border: 9px solid var(--bs-wood-dark);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          display: grid;
          place-items: center;
        }

        .bs-portrait-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .bs-portrait-initials {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 40px;
          font-weight: 500;
          color: var(--bs-wood);
        }

        .bs-meta {
          flex: 1;
          min-width: 260px;
        }

        .bs-meta h1 {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(34px, 5.5vw, 50px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          font-weight: 400;
          color: var(--bs-text);
          margin-bottom: 6px;
        }

        .bs-role {
          font-style: italic;
          font-size: 17px;
          color: var(--bs-wood);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .bs-bio {
          font-size: 15px;
          line-height: 1.6;
          max-width: 52ch;
          color: var(--bs-text);
          opacity: 0.9;
        }

        .bs-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .bs-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(43, 33, 24, 0.08);
          color: var(--bs-text);
          border: 1px solid rgba(107, 74, 50, 0.2);
        }

        /* ── Bookshelf Section & Architectural Plank ── */
        .bs-shelf-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--bs-wood);
          margin-bottom: 8px;
        }

        .bs-shelf-frame {
          position: relative;
          width: 100%;
          margin: 10px 0 20px;
        }

        .bs-shelf-alcove {
          position: relative;
          width: 100%;
          background: rgba(43, 33, 24, 0.04);
          border-radius: 12px 12px 0 0;
          overflow: hidden;
        }

        .bs-shelf {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 8px;
          overflow-x: auto;
          padding: 44px 16px 0;
          min-height: 295px;
          scrollbar-width: thin;
          scrollbar-color: var(--bs-wood) transparent;
          -webkit-overflow-scrolling: touch;
        }

        .bs-shelf::-webkit-scrollbar {
          height: 6px;
        }
        .bs-shelf::-webkit-scrollbar-thumb {
          background: var(--bs-wood);
          border-radius: 4px;
        }

        /* Architectural Beveled Walnut Plank with Depth */
        .bs-shelf-plank {
          width: 100%;
          height: 22px;
          background: linear-gradient(180deg, #875c3d 0%, #583720 38%, #362010 100%);
          border-radius: 2px 2px 4px 4px;
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.42), inset 0 2px 2px rgba(255, 255, 255, 0.3), inset 0 -3px 4px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .bs-shelf-plank::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.05));
        }

        /* Sculpted Classical Brass Bookends */
        .bs-bookend {
          flex: none;
          align-self: flex-end;
          width: 22px;
          height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        .bs-bookend-left {
          margin-right: 4px;
        }

        .bs-bookend-right {
          margin-left: 4px;
        }

        .bs-bookend-finial {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fae19c, #d4af37 60%, #7d5910);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          margin-bottom: 2px;
        }

        .bs-bookend-pillar {
          width: 11px;
          height: 154px;
          background: linear-gradient(90deg, #946914, #d4af37 40%, #7d5910);
          border-radius: 3px 3px 0 0;
        }

        .bs-bookend-base {
          width: 22px;
          height: 12px;
          background: linear-gradient(180deg, #d4af37, #8a6213);
          border-radius: 2px;
        }

        /* ── Rich Book Spine Architecture ── */
        .bs-spine {
          position: relative;
          flex: none;
          width: clamp(68px, 12vw, 80px);
          align-self: flex-end;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0 16px;
          border-radius: 5px 5px 0 0;
          text-decoration: none;
          box-shadow: inset -6px 0 9px rgba(0, 0, 0, 0.3), inset 3px 0 4px rgba(255, 255, 255, 0.15), 0 6px 14px rgba(0,0,0,0.22);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease;
          cursor: pointer;
          border: none;
        }

        /* Raised Leather Spine Ribs with Gold Foil Tooling */
        .bs-spine-rib {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(244, 234, 215, 0.55);
          box-shadow: 0 1px 2px rgba(0,0,0,0.35);
        }
        .bs-rib-top { top: 46px; }
        .bs-rib-mid { bottom: 84px; }
        .bs-rib-bot { bottom: 44px; }

        .bs-spine:hover,
        .bs-spine:focus-visible {
          transform: translateY(-20px);
          box-shadow: inset -6px 0 9px rgba(0, 0, 0, 0.25), 0 16px 30px rgba(0,0,0,0.4);
          outline: none;
        }

        .bs-spine-icon {
          width: auto;
          height: auto;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 13px;
        }

        .bs-spine-title {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 12px 0;
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 18px;
          letter-spacing: 0.06em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: 155px;
        }

        .bs-spine-insignia {
          font-size: 10px;
          letter-spacing: 0.1em;
          opacity: 0.75;
          font-weight: 800;
        }

        /* Bookmark Ribbon Hanging Down */
        .bs-spine-ribbon {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 14px;
          background: #d4af37;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          pointer-events: none;
        }

        .bs-spine-verb {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: #1c140d;
          color: #f4ead7;
          border: 1px solid rgba(212, 175, 55, 0.5);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.35);
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .bs-spine:hover .bs-spine-verb,
        .bs-spine:focus-visible .bs-spine-verb {
          opacity: 1;
          transform: translateX(-50%) translateY(-4px);
        }

        .bs-shelf-hint {
          font-size: 13px;
          font-style: italic;
          opacity: 0.8;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Services Bookplate (High-Contrast Gilded Archival Box) ── */
        .bs-services {
          background: #23180f;
          color: #e8d9b5;
          border: 2px solid var(--bs-gold);
          border-radius: 12px;
          padding: 24px 28px;
          margin-top: 32px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
        }

        .bs-services h2 {
          font-size: 12px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--bs-gold-bright);
          margin-bottom: 18px;
          font-weight: 700;
        }

        /* ── Featured Active Project Card ── */
        .bs-project-card {
          background: #17100a;
          border: 1px solid rgba(184, 151, 90, 0.45);
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 14px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .bs-project-card:hover {
          border-color: var(--bs-gold-bright);
          transform: translateY(-1px);
        }

        .bs-project-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .bs-project-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--bs-gold-bright);
        }

        .bs-project-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 8px #4ade80;
        }

        .bs-project-tag {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(244, 234, 215, 0.5);
          font-family: 'Avenir Next', sans-serif;
        }

        .bs-project-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .bs-project-domain {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 400;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .bs-project-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          background: var(--bs-wood);
          color: #f4ead7;
          border: 1px solid var(--bs-gold);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.18s ease, transform 0.18s ease;
        }

        .bs-project-btn:hover {
          background: #3a2211;
          transform: translateY(-1px);
        }

        .bs-service-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .bs-service-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(184, 151, 90, 0.25);
          flex-wrap: wrap;
        }

        .bs-service-row:last-child {
          border-bottom: none;
        }

        .bs-service-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bs-service-mark {
          color: var(--bs-gold-bright);
          font-size: 12px;
          opacity: 0.9;
        }

        .bs-service-main b {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(19px, 3.8vw, 22px);
          font-weight: 500;
          color: #fbf7ef;
        }

        .bs-service-val {
          font-family: 'Avenir Next', -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--bs-gold-bright);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }

        .bs-service-val:hover {
          text-decoration: underline;
        }

        /* ── Action Dock ── */
        .bs-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 32px;
        }

        .bs-action-btn {
          background: var(--bs-wood);
          color: #f4ead7;
          border-radius: 6px;
          padding: 13px 22px;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: background 0.18s ease, transform 0.18s ease;
          border: none;
          cursor: pointer;
        }

        .bs-action-btn:hover {
          background: #2b2118;
          transform: translateY(-1px);
        }

        /* ── Socials & Footer ── */
        .bs-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 20px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(107, 74, 50, 0.2);
        }

        .bs-social-link {
          font-size: 13px;
          color: var(--bs-text);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          opacity: 0.85;
          transition: opacity 0.18s ease;
        }

        .bs-social-link:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .bs-footer {
          margin-top: 28px;
          font-size: 13px;
          opacity: 0.65;
        }

        .bs-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #1c140d;
          color: #f4ead7;
          border: 1px solid var(--bs-gold);
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 100;
        }
      `}</style>

      <main className="bookshelf-container">
        {/* Header Profile Dossier */}
        <header className="bs-header">
          <div className="bs-portrait-frame">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} loading="eager" />
            ) : (
              <span className="bs-portrait-initials">{initials}</span>
            )}
          </div>

          <div className="bs-meta">
            <h1>{name}</h1>
            <div className="bs-role">
              <span>{role}</span>
              {location && (
                <span className="inline-flex items-center gap-1 opacity-75 text-sm ml-2">
                  <MapPin size={13} />
                  {location}
                </span>
              )}
            </div>
            <p className="bs-bio">{bio}</p>

            {profile?.openTo && profile.openTo.length > 0 && (
              <div className="bs-chips">
                {profile.openTo.map((intent: string) => (
                  <span key={intent} className="bs-chip">
                    {intent.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ── ON THE SHELF: Masterwork Curated Bookshelf ── */}
        <p className="bs-shelf-label">On The Shelf</p>
        
        <div className="bs-shelf-frame">
          <div className="bs-shelf-alcove">
            <section className="bs-shelf" aria-label="Curated book volumes">
              
              {/* Left Sculpted Brass Bookend */}
              <div className="bs-bookend bs-bookend-left" aria-hidden="true">
                <div className="bs-bookend-finial" />
                <div className="bs-bookend-pillar" />
                <div className="bs-bookend-base" />
              </div>

              {/* Curated Volumes */}
              {shelfVolumes.map((vol) => {
                const palette = SPINE_PALETTES[vol.paletteIndex % SPINE_PALETTES.length];

                if (vol.action) {
                  return (
                    <button
                      key={vol.id}
                      type="button"
                      className="bs-spine"
                      onClick={vol.action}
                      style={{
                        background: palette.bg,
                        color: palette.fg,
                        height: `${palette.height}px`,
                      }}
                      title={`${vol.title} — ${vol.subtitle}`}
                    >
                      <span className="bs-spine-verb">{vol.verb}</span>
                      <div className="bs-spine-rib bs-rib-top" />
                      <div className="bs-spine-rib bs-rib-mid" />
                      <div className="bs-spine-rib bs-rib-bot" />

                      <div className="bs-spine-icon">
                        <Download size={16} />
                      </div>

                      <strong className="bs-spine-title">{vol.title}</strong>
                      <span className="bs-spine-insignia">UNO</span>
                      <div className="bs-spine-ribbon" style={{ background: palette.ribbon }} />
                    </button>
                  );
                }

                return (
                  <a
                    key={vol.id}
                    href={vol.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bs-spine"
                    onClick={() => {
                      if (vol.url && vol.iconType === 'link') {
                        const original = links.find((l) => l.id === vol.id);
                        if (original) {
                          onLinkClick?.(original);
                        } else {
                          onLinkClick?.({
                            id: vol.id,
                            label: vol.title,
                            url: vol.url,
                            icon: vol.customIcon || null,
                            clicks: 0,
                            order: 0,
                            isVisible: true,
                          });
                        }
                      }
                    }}
                    style={{
                      background: palette.bg,
                      color: palette.fg,
                      height: `${palette.height}px`,
                    }}
                    title={`${vol.title} — ${vol.subtitle}`}
                  >
                    <span className="bs-spine-verb">{vol.verb}</span>
                    <div className="bs-spine-rib bs-rib-top" />
                    <div className="bs-spine-rib bs-rib-mid" />
                    <div className="bs-spine-rib bs-rib-bot" />

                    <div className="bs-spine-icon">
                      {vol.iconType === 'social' ? (
                        <SocialIcon label={vol.title} url={vol.url || ''} className="w-4 h-4 fill-current" />
                      ) : vol.iconType === 'email' ? (
                        <Mail size={15} />
                      ) : vol.iconType === 'chat' ? (
                        <MessageCircle size={15} />
                      ) : (
                        <SocialIcon label={vol.title} url={vol.url || ''} icon={vol.customIcon} className="w-4 h-4 fill-current" />
                      )}
                    </div>

                    <strong className="bs-spine-title">{vol.title}</strong>
                    <span className="bs-spine-insignia">UNO</span>
                    <div className="bs-spine-ribbon" style={{ background: palette.ribbon }} />
                  </a>
                );
              })}

              {/* Right Sculpted Brass Bookend */}
              <div className="bs-bookend bs-bookend-right" aria-hidden="true">
                <div className="bs-bookend-finial" />
                <div className="bs-bookend-pillar" />
                <div className="bs-bookend-base" />
              </div>

            </section>
          </div>

          {/* Solid Beveled Hardwood Plank */}
          <div className="bs-shelf-plank" />
        </div>

        <p className="bs-shelf-hint">Pull a volume from the shelf to open.</p>

        {/* Standalone Archival Dispatch Section (No Double Boxes) */}
        {profile?.recentActivity && (
          <section className="bs-dispatch-wrap" aria-label="Latest Archival Dispatch">
            <RecentActivitySection
              activity={profile.recentActivity}
              variant="the-bookshelf"
              isDark={true}
              accentColor="#d9b86c"
              autoScroll={profile.autoScroll}
            />
          </section>
        )}

        {/* Services & Offerings Bookplate */}
        <section className="bs-services" aria-label="Services and Offerings">
          <h2>Active Practice & Works</h2>
          {proofs && proofs.length > 0 ? (
            <div className="bs-proofs-stack">
              {proofs.map((proof, idx) => {
                const rawTitle = (proof.title || '').trim();
                const rawValue = (proof.value || '').trim();

                let displayTitle = rawTitle;
                let displayValue = rawValue;

                if (!displayTitle && displayValue) {
                  if (displayValue.includes(':')) {
                    const parts = displayValue.split(':');
                    displayTitle = parts[0].trim();
                    displayValue = parts.slice(1).join(':').trim();
                  } else {
                    displayTitle = 'Active Project';
                  }
                } else if (displayTitle && !displayValue) {
                  if (displayTitle.includes(':')) {
                    const parts = displayTitle.split(':');
                    displayTitle = parts[0].trim();
                    displayValue = parts.slice(1).join(':').trim();
                  }
                }

                const isUrl = /^https?:\/\//i.test(displayValue) || /^www\./i.test(displayValue) || (displayValue.includes('.') && !displayValue.includes(' '));
                const targetUrl = isUrl ? (displayValue.startsWith('http') ? displayValue : `https://${displayValue}`) : null;
                const isProject = isUrl || displayTitle.toLowerCase().includes('project') || displayTitle.toLowerCase().includes('venture');

                if (isProject) {
                  return (
                    <div key={proof.id || idx} className="bs-project-card">
                      <div className="bs-project-meta">
                        <div className="bs-project-badge">
                          <span className="bs-project-pulse" />
                          <span>{displayTitle || 'Active Project'}</span>
                        </div>
                        <span className="bs-project-tag">Featured Venture</span>
                      </div>

                      <div className="bs-project-row">
                        <span className="bs-project-domain">{displayValue || displayTitle}</span>
                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bs-project-btn"
                          >
                            <span>Explore</span>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={proof.id || idx} className="bs-service-row">
                    <div className="bs-service-main">
                      <span className="bs-service-mark">✦</span>
                      <b>{displayTitle || 'Key Metric'}</b>
                    </div>
                    {displayValue && (
                      <span className="bs-service-val">{displayValue}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className="bs-service-list">
              <li className="bs-service-row">
                <div className="bs-service-main">
                  <span className="bs-service-mark">✦</span>
                  <b>Brand Identity & Systems</b>
                </div>
                <span className="bs-service-val">From $800</span>
              </li>
              <li className="bs-service-row">
                <div className="bs-service-main">
                  <span className="bs-service-mark">✦</span>
                  <b>Editorial Design & Publishing</b>
                </div>
                <span className="bs-service-val">From $1,200</span>
              </li>
              <li className="bs-service-row">
                <div className="bs-service-main">
                  <span className="bs-service-mark">✦</span>
                  <b>Archival Advisory</b>
                </div>
                <span className="bs-service-val">From $600</span>
              </li>
            </ul>
          )}
        </section>

        {/* Action Dock */}
        <nav className="bs-actions" aria-label="Direct contact actions">
          {numericPhone ? (
            <a href={`tel:${numericPhone}`} className="bs-action-btn">
              <Phone size={15} />
              <span>Call</span>
            </a>
          ) : (
            <button type="button" className="bs-action-btn" onClick={() => showToast('Phone number not listed')}>
              <Phone size={15} />
              <span>Call</span>
            </button>
          )}

          {email ? (
            <a href={`mailto:${email}`} className="bs-action-btn">
              <Mail size={15} />
              <span>Email</span>
            </a>
          ) : (
            <button type="button" className="bs-action-btn" onClick={() => showToast('Email not listed')}>
              <Mail size={15} />
              <span>Email</span>
            </button>
          )}

          {cleanWaNumber ? (
            <a href={`https://wa.me/${cleanWaNumber}`} target="_blank" rel="noopener noreferrer" className="bs-action-btn">
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>
          ) : (
            <button type="button" className="bs-action-btn" onClick={() => showToast('WhatsApp unavailable')}>
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </button>
          )}

          <button type="button" className="bs-action-btn" onClick={() => handleSaveContact()}>
            <Download size={15} />
            <span>Save Contact</span>
          </button>
        </nav>

        {/* Socials Matrix */}
        {socialEntries.length > 0 && (
          <div className="bs-socials">
            {socialEntries.map((soc) => (
              <a
                key={soc.platform}
                href={soc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bs-social-link"
              >
                <SocialIcon label={soc.label} url={soc.url} className="w-3.5 h-3.5 fill-current" />
                <span>{soc.label}</span>
              </a>
            ))}
          </div>
        )}

        <footer className="bs-footer">
          <p>&copy; {new Date().getFullYear()} {name}</p>
        </footer>
      </main>

      {toastMessage && (
        <div className="bs-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default BookshelfTemplate;
