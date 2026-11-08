'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import {
  Phone,
  Mail,
  MessageCircle,
  Download,
  MapPin,
  ExternalLink,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Contextual CTA Action Verbs for Monolithic Slabs
   ───────────────────────────────────────────────────────────── */
function getMonolithActionVerb(url: string, label: string): string {
  const u = (url || '').toLowerCase();
  const l = (label || '').toLowerCase();

  if (l.includes('portfolio') || l.includes('work') || l.includes('case stud') || u.includes('dribbble.com') || u.includes('behance.net')) return 'EXPLORE';
  if (l.includes('website') || l.includes('site') || l.includes('homepage') || l.includes('web')) return 'VISIT';
  if (u.includes('cal.com') || u.includes('calendly.com') || l.includes('book') || l.includes('schedule')) return 'BOOK';
  if (u.includes('wa.me') || u.includes('whatsapp') || l.includes('chat')) return 'CHAT';
  if (u.includes('linkedin.com') || l.includes('connect')) return 'CONNECT';
  if (u.includes('.pdf') || l.includes('resume') || l.includes('cv') || l.includes('download')) return 'GET';
  if (u.includes('github.com') || u.includes('gitlab.com') || l.includes('code')) return 'INSPECT';
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo') || l.includes('watch')) return 'WATCH';
  if (u.includes('spotify.com') || u.includes('apple.com/music') || l.includes('listen')) return 'LISTEN';
  if (u.includes('substack.com') || u.includes('medium.com') || l.includes('blog') || l.includes('read')) return 'READ';

  const isX = /(?:^|[\/\.])x\.com(?=[\/\?#:]|$)/i.test(u) || u.includes('twitter.com') || l === 'x' || l === 'twitter';
  const isSocial = isX || u.includes('instagram.com') || u.includes('threads.net') || u.includes('tiktok.com');
  if (isSocial) return 'FOLLOW';

  return 'VISIT';
}

function cleanDisplayUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

type PanelKey = 'profile' | 'links' | 'services' | 'contact';

interface SynthesizedMonolithLink {
  id: string;
  label: string;
  url: string;
  icon?: string | null;
  verb: string;
  category?: string;
  isCustom?: boolean;
  action?: () => void;
}

export function MonolithTemplate({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Touch Swipe Gesture State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Creative Director';
  const bio = profile?.bio || 'Architecting spaces, digital monoliths, and enduring brand structures.';
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

  // Featured Project Detection
  const featuredProject = useMemo(() => {
    for (const proof of proofs) {
      const pTitle = (proof.title || '').trim();
      const pVal = (proof.value || '').trim();
      const combined = `${pTitle} ${pVal}`.toLowerCase();
      if (
        combined.includes('project') ||
        combined.includes('venture') ||
        /^https?:\/\//i.test(pVal) ||
        /\.[a-z]{2,}/i.test(pVal)
      ) {
        let domain = pVal;
        let url = pVal;
        if (pVal.includes(':')) {
          const parts = pVal.split(':');
          domain = parts[parts.length - 1].trim();
          url = domain;
        }
        if (!domain && pTitle) {
          domain = pTitle;
          url = pTitle;
        }
        if (!url.startsWith('http')) {
          url = `https://${url}`;
        }
        return {
          title: pTitle && !pTitle.includes('http') ? pTitle : 'Active Project',
          domain: cleanDisplayUrl(domain) || 'pixenox.com',
          url,
        };
      }
    }

    // Fallback: check links if website is present
    const websiteLink = links.find(
      (l) => l.label.toLowerCase().includes('website') || l.url.includes('pixenox.com')
    );
    if (websiteLink) {
      return {
        title: 'Active Project',
        domain: cleanDisplayUrl(websiteLink.url),
        url: websiteLink.url,
      };
    }

    return null;
  }, [proofs, links]);

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

  // Smart Multi-Channel Synthesis: Guarantees balanced links without empty voids
  const allMonolithLinks = useMemo<SynthesizedMonolithLink[]>(() => {
    const list: SynthesizedMonolithLink[] = [];

    // 1. User custom links
    links.forEach((l) => {
      list.push({
        id: l.id,
        label: l.label,
        url: l.url,
        icon: l.icon,
        verb: getMonolithActionVerb(l.url, l.label),
        category: 'Primary Link',
        isCustom: true,
      });
    });

    // 2. Connected social handles
    socialEntries.forEach((s) => {
      const already = list.some((item) => item.url.toLowerCase() === s.url.toLowerCase());
      if (!already) {
        list.push({
          id: `social-${s.platform}`,
          label: s.label,
          url: s.url,
          verb: getMonolithActionVerb(s.url, s.label),
          category: 'Connected Channel',
        });
      }
    });

    // 3. Essential companion channels (if total items < 4)
    if (list.length < 4 && featuredProject && !list.some((i) => i.url === featuredProject.url)) {
      list.push({
        id: 'companion-project',
        label: featuredProject.title,
        url: featuredProject.url,
        verb: 'EXPLORE',
        category: 'Featured Venture',
      });
    }

    if (list.length < 4 && cleanWaNumber) {
      list.push({
        id: 'companion-wa',
        label: 'Direct WhatsApp',
        url: `https://wa.me/${cleanWaNumber}`,
        verb: 'CHAT',
        category: 'Private Wire',
      });
    }

    if (list.length < 4 && email) {
      list.push({
        id: 'companion-mail',
        label: 'Executive Dispatch',
        url: `mailto:${email}`,
        verb: 'EMAIL',
        category: 'Direct Inquiries',
      });
    }

    if (list.length < 4) {
      list.push({
        id: 'companion-vcard',
        label: 'Monolith Dossier',
        url: '#',
        verb: 'SAVE',
        category: 'Contact Card',
        action: () => handleSaveContact(),
      });
    }

    return list;
  }, [links, socialEntries, featuredProject, cleanWaNumber, email, handleSaveContact]);

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

  // Touch Swipe Gesture Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    const panels: PanelKey[] = ['profile', 'links', 'services', 'contact'];
    const curIdx = panels.indexOf(activePanel);

    // Horizontal swipe detected
    if (Math.abs(diffX) > 48 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swiped left -> Next slab
        setActivePanel(panels[(curIdx + 1) % panels.length]);
      } else {
        // Swiped right -> Previous slab
        setActivePanel(panels[(curIdx + 3) % panels.length]);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation for panels
  useEffect(() => {
    const panels: PanelKey[] = ['profile', 'links', 'services', 'contact'];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setActivePanel('profile');
      if (e.key === '2') setActivePanel('links');
      if (e.key === '3') setActivePanel('services');
      if (e.key === '4') setActivePanel('contact');
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setActivePanel((prev) => {
          const idx = panels.indexOf(prev);
          return panels[(idx + 1) % panels.length];
        });
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setActivePanel((prev) => {
          const idx = panels.indexOf(prev);
          return panels[(idx + 3) % panels.length];
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="monolith-wrap" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <style>{`
        /* ── Sculptural Gallery Canvas Stage ── */
        .monolith-wrap {
          --mono-bg: #f4f0e8;
          --c1-bg: #ece8de;
          --c1-text: #1a1a17;
          --c2-bg: ${accentColor ? accentColor : '#1d3b2f'};
          --c2-text: #e8e4d8;
          --c3-bg: #d9a441;
          --c3-text: #1a1a17;
          --c4-bg: #3d342d;
          --c4-text: #f5f1ea;

          background: var(--mono-bg);
          font-family: 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100svh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(14px, 2.8vh, 28px) clamp(12px, 2.8vw, 28px);
          position: relative;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Architectural Monolith Stage Frame (Guarantees 5-6mm Margin & Architectural Poise) ── */
        .monolith-stage {
          width: 100%;
          max-width: 1220px;
          height: min(840px, calc(100svh - 48px));
          border-radius: 28px;
          box-shadow: 0 18px 50px rgba(42, 42, 39, 0.12), 0 2px 10px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(26, 26, 23, 0.1);
          overflow: hidden;
          display: flex;
          position: relative;
          background: var(--c1-bg);
          transform: translateZ(0);
        }

        /* ── Monolith Slab Dynamics ── */
        .mono-slab {
          position: relative;
          flex: 0.0001 0 74px;
          min-width: 0;
          overflow: hidden;
          transition: flex-grow 0.65s cubic-bezier(0.7, 0, 0.2, 1);
          cursor: pointer;
        }

        .mono-slab.active {
          flex-grow: 100;
          cursor: default;
        }

        .slab-1 { background: var(--c1-bg); color: var(--c1-text); }
        .slab-2 { background: var(--c2-bg); color: var(--c2-text); }
        .slab-3 { background: var(--c3-bg); color: var(--c3-text); }
        .slab-4 { background: var(--c4-bg); color: var(--c4-text); }

        /* Collapsed Vertical Label with Refined Typography */
        .mono-label {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 38px 0;
          transition: opacity 0.25s ease;
          user-select: none;
        }

        .mono-label span {
          font-weight: 700;
          font-size: 13px;
          opacity: 0.65;
          letter-spacing: 0.1em;
        }

        .mono-label b {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 26px;
          letter-spacing: 0.04em;
          font-weight: 400;
          white-space: nowrap;
        }

        .mono-slab.active .mono-label {
          opacity: 0;
          pointer-events: none;
        }

        /* Expanded Slab Interior Content (Full Width, Zero Dead Space) */
        .mono-content {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 50px clamp(24px, 3.8vw, 54px) 44px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          opacity: 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
        }

        .mono-content::-webkit-scrollbar {
          width: 4px;
        }
        .mono-content::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.18);
          border-radius: 4px;
        }
        .slab-2 .mono-content::-webkit-scrollbar-thumb,
        .slab-4 .mono-content::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.22);
        }

        .mono-slab.active .mono-content {
          opacity: 1;
          pointer-events: auto;
          transition: opacity 0.35s 0.2s ease;
        }

        /* ── Dual-Wing Editorial Grid for Slab 01 (Profile) ── */
        .mono-profile-grid {
          display: grid;
          grid-template-columns: minmax(320px, 1.12fr) minmax(300px, 0.98fr);
          gap: clamp(28px, 4vw, 52px);
          align-items: start;
        }

        /* Left Wing Identity */
        .mono-identity-wing {
          display: flex;
          flex-direction: column;
        }

        .mono-avatar-header {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 24px;
        }

        .mono-avatar {
          width: 135px;
          height: 165px;
          border-radius: 18px;
          background: #cfc8b5;
          color: #1d3b2f;
          display: grid;
          place-items: center;
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 46px;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
          flex-shrink: 0;
        }

        .mono-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .mono-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(26, 26, 23, 0.07);
          color: #1a1a17;
          border: 1px solid rgba(26, 26, 23, 0.12);
          margin-bottom: 8px;
        }

        .mono-pulse-beacon {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .mono-name {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(38px, 5.2vw, 58px);
          line-height: 0.98;
          letter-spacing: -0.025em;
          font-weight: 400;
          margin-bottom: 12px;
          color: var(--c1-text);
        }

        .mono-role {
          font-weight: 700;
          font-size: 16px;
          color: #8a5a00;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .mono-bio {
          font-size: 15.5px;
          line-height: 1.62;
          color: rgba(26, 26, 23, 0.9);
          margin-bottom: 18px;
        }

        .mono-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .mono-chip {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: rgba(26, 26, 23, 0.08);
          color: #1a1a17;
          border: 1px solid rgba(26, 26, 23, 0.12);
        }

        .mono-profile-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .mono-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 12px;
          background: #2b2621;
          color: #f7f5f0;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .mono-btn-primary:hover {
          transform: translateY(-2px);
          background: #191613;
        }

        .mono-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 12px;
          background: transparent;
          color: #1a1a17;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid rgba(26, 26, 23, 0.3);
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .mono-btn-ghost:hover {
          background: rgba(26, 26, 23, 0.06);
          border-color: #1a1a17;
        }

        /* Right Wing Showcase (Most Recent Post / Dispatch) */
        .mono-showcase-wing {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
        }

        /* ── Slab 2 Links Styling (Rich 2-Column Responsive Matrix) ── */
        .mono-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 12px;
        }

        .mono-link-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 16px 18px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .mono-link-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .mono-link-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .mono-link-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .mono-link-category {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.6;
          margin-bottom: 2px;
        }

        .mono-link-title {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 19px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mono-link-domain {
          font-size: 12px;
          opacity: 0.65;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mono-link-verb-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #d9a441;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        /* ── Slab 3 Services Styling ── */
        .mono-services-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mono-service-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 18px 22px;
          border-radius: 14px;
          background: rgba(26, 26, 23, 0.06);
          border: 1px solid rgba(26, 26, 23, 0.15);
        }

        .mono-service-main b {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(20px, 2.6vw, 26px);
          font-weight: 500;
          color: #1a1a17;
          display: block;
        }

        .mono-service-val {
          font-family: 'Avenir Next', -apple-system, sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #1a1a17;
          white-space: nowrap;
        }

        /* ── Slab 4 Contact Styling ── */
        .mono-contact-layout {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
          gap: 32px;
        }

        .mono-action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .mono-action-btn {
          border: 1px solid rgba(232, 228, 216, 0.25);
          border-radius: 14px;
          padding: 18px 12px;
          text-align: center;
          font-weight: 600;
          font-size: 13px;
          color: #e8e4d8;
          background: rgba(255, 255, 255, 0.04);
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
          cursor: pointer;
        }

        .mono-action-btn:hover {
          background: #e8e4d8;
          color: #262624;
          transform: translateY(-2px);
        }

        .mono-details-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(232, 228, 216, 0.15);
          border-radius: 16px;
          padding: 20px 24px;
        }

        .mono-dt-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(232, 228, 216, 0.12);
          font-size: 14px;
        }

        .mono-dt-item:last-child {
          border-bottom: none;
        }

        .mono-dt-item span {
          opacity: 0.6;
        }

        .mono-dt-item b {
          font-weight: 600;
        }

        .mono-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(232, 228, 216, 0.15);
        }

        .mono-social-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #e8e4d8;
          text-decoration: none;
          opacity: 0.85;
        }

        .mono-social-link:hover {
          opacity: 1;
          text-decoration: underline;
        }

        /* ── Section Titles ── */
        .mono-section-heading {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(26px, 3.6vw, 36px);
          letter-spacing: -0.02em;
          margin-bottom: 22px;
          font-weight: 400;
        }

        /* Mobile Swipe Pill */
        .mono-swipe-pill {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 12px;
          user-select: none;
        }

        /* ── Responsive Mobile Viewport Stack ── */
        @media (max-width: 820px) {
          .monolith-wrap {
            padding: 10px 8px;
            justify-content: flex-start;
          }

          .monolith-stage {
            flex-direction: column;
            height: auto;
            min-height: calc(100svh - 20px);
            border-radius: 20px;
          }

          .mono-nav-pill {
            display: none;
          }

          .mono-slab {
            flex-basis: 58px;
            flex-grow: 0;
            min-height: 58px;
            transition: min-height 0.45s cubic-bezier(0.7, 0, 0.2, 1);
          }

          .mono-slab.active {
            min-height: calc(100svh - 194px);
            flex-grow: 1;
          }

          .mono-label {
            flex-direction: row;
            padding: 0 20px;
            align-items: center;
            height: 58px;
            bottom: auto;
          }

          .mono-label b {
            writing-mode: horizontal-tb;
            transform: none;
            font-size: 19px;
          }

          .mono-slab.active .mono-label {
            opacity: 1;
            pointer-events: auto;
          }

          .mono-content {
            position: relative;
            width: 100%;
            height: auto;
            top: 58px;
            padding: 12px 18px 48px;
            opacity: 0;
          }

          .mono-slab.active .mono-content {
            opacity: 1;
            transition: opacity 0.3s 0.12s ease;
          }

          .mono-profile-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .mono-contact-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .mono-avatar {
            width: 110px;
            height: 135px;
          }
        }

        .mono-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #e8e4d8;
          color: #1a1a17;
          padding: 10px 20px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(0,0,0,0.45);
          z-index: 100;
        }
      `}</style>

      {/* ── Monolithic Architectural Slab Stage ── */}
      <div className="monolith-stage" role="region" aria-label="Monolith Persona Portfolio">
        
        {/* ── PANEL 01: PROFILE ── */}
        <section
          className={`mono-slab slab-1 ${activePanel === 'profile' ? 'active' : ''}`}
          onClick={() => setActivePanel('profile')}
          role="tabpanel"
          aria-expanded={activePanel === 'profile'}
          tabIndex={0}
        >
          <div className="mono-label">
            <span>01</span>
            <b>Profile</b>
          </div>

          <div className="mono-content">
            <div className="mono-profile-grid">
              
              {/* Left Wing Identity */}
              <div className="mono-identity-wing">
                <div className="mono-avatar-header">
                  <div className="mono-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} loading="eager" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div>
                    <div className="mono-status-badge">
                      <span className="mono-pulse-beacon" />
                      <span>Available for Advisory</span>
                    </div>
                    {location && (
                      <div className="inline-flex items-center gap-1.5 opacity-75 text-xs text-[#1a1a17]">
                        <MapPin size={13} />
                        <span>{location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <h1 className="mono-name">{name}</h1>

                <div className="mono-role">
                  <span>{role}</span>
                </div>

                <p className="mono-bio">{bio}</p>

                {profile?.openTo && profile.openTo.length > 0 && (
                  <div className="mono-chips">
                    {profile.openTo.map((intent: string) => (
                      <span key={intent} className="mono-chip">
                        {intent.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mono-profile-actions">
                  <button type="button" className="mono-btn-primary" onClick={handleSaveContact}>
                    <Download size={15} />
                    <span>Save Contact</span>
                  </button>
                  {email ? (
                    <a href={`mailto:${email}`} className="mono-btn-ghost">
                      <Mail size={15} />
                      <span>Direct Wire</span>
                    </a>
                  ) : cleanWaNumber ? (
                    <a href={`https://wa.me/${cleanWaNumber}`} target="_blank" rel="noopener noreferrer" className="mono-btn-ghost">
                      <MessageCircle size={15} />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Right Wing: Most Recent Post */}
              {profile?.recentActivity && (
                <div className="mono-showcase-wing" onClick={(e) => e.stopPropagation()}>
                  <RecentActivitySection
                    activity={profile.recentActivity}
                    variant="the-monolith"
                    isDark={false}
                    accentColor="#8a5a00"
                    autoScroll={profile.autoScroll}
                  />
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ── PANEL 02: LINKS ── */}
        <section
          className={`mono-slab slab-2 ${activePanel === 'links' ? 'active' : ''}`}
          onClick={() => setActivePanel('links')}
          role="tabpanel"
          aria-expanded={activePanel === 'links'}
          tabIndex={0}
        >
          <div className="mono-label">
            <span>02</span>
            <b>Links</b>
          </div>

          <div className="mono-content">
            <h2 className="mono-section-heading">Curated Links & Channels</h2>

            {allMonolithLinks && allMonolithLinks.length > 0 ? (
              <div className="mono-links-grid">
                {allMonolithLinks.map((item, idx) => {
                  return (
                    <a
                      key={item.id || idx}
                      href={item.url}
                      target={item.url.startsWith('http') ? '_blank' : undefined}
                      rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="mono-link-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.action) {
                          e.preventDefault();
                          item.action();
                          return;
                        }
                        if (item.isCustom) {
                          const original = links.find((l) => l.id === item.id);
                          if (original) onLinkClick?.(original);
                        }
                      }}
                    >
                      <div className="mono-link-icon-wrap">
                        <SocialIcon label={item.label} url={item.url} icon={item.icon || undefined} className="w-5 h-5 fill-current" />
                      </div>
                      <div className="mono-link-text">
                        <span className="mono-link-category">{item.category || 'Link'}</span>
                        <strong className="mono-link-title">{item.label}</strong>
                        <span className="mono-link-domain">{cleanDisplayUrl(item.url)}</span>
                      </div>
                      <span className="mono-link-verb-badge">
                        <span>{item.verb}</span>
                        <ArrowUpRight size={13} />
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 opacity-70 text-sm">
                No active links on this monolith yet.
              </div>
            )}
          </div>
        </section>

        {/* ── PANEL 03: SERVICES ── */}
        <section
          className={`mono-slab slab-3 ${activePanel === 'services' ? 'active' : ''}`}
          onClick={() => setActivePanel('services')}
          role="tabpanel"
          aria-expanded={activePanel === 'services'}
          tabIndex={0}
        >
          <div className="mono-label">
            <span>03</span>
            <b>Services</b>
          </div>

          <div className="mono-content">
            <h2 className="mono-section-heading">Services & Offerings</h2>

            <div className="mono-services-stack">
              {proofs && proofs.length > 0 ? (
                proofs.map((proof, idx) => (
                  <div key={proof.id || idx} className="mono-service-row">
                    <div className="mono-service-main">
                      <b>{proof.title || 'Brand Advisory'}</b>
                    </div>
                    <span className="mono-service-val">{proof.value || 'Inquire'}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="mono-service-row">
                    <div className="mono-service-main">
                      <b>Brand Identity & Systems</b>
                    </div>
                    <span className="mono-service-val">From $800</span>
                  </div>
                  <div className="mono-service-row">
                    <div className="mono-service-main">
                      <b>Digital Systems Architecture</b>
                    </div>
                    <span className="mono-service-val">From $1,500</span>
                  </div>
                  <div className="mono-service-row">
                    <div className="mono-service-main">
                      <b>Spatial & Creative Direction</b>
                    </div>
                    <span className="mono-service-val">From $1,200</span>
                  </div>
                </>
              )}
            </div>

            {/* Inquire Action Button */}
            <div className="mt-8 flex items-center gap-4">
              {email ? (
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent('Advisory Inquiry via Monolith')}`}
                  className="mono-btn-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail size={15} />
                  <span>Inquire for Project</span>
                </a>
              ) : (
                <button
                  type="button"
                  className="mono-btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePanel('contact');
                  }}
                >
                  <ArrowRight size={15} />
                  <span>Contact for Rates</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── PANEL 04: CONTACT ── */}
        <section
          className={`mono-slab slab-4 ${activePanel === 'contact' ? 'active' : ''}`}
          onClick={() => setActivePanel('contact')}
          role="tabpanel"
          aria-expanded={activePanel === 'contact'}
          tabIndex={0}
        >
          <div className="mono-label">
            <span>04</span>
            <b>Contact</b>
          </div>

          <div className="mono-content">
            <h2 className="mono-section-heading">Direct Reach</h2>

            <div className="mono-contact-layout">
              {/* Direct Action Grid */}
              <div>
                <nav className="mono-action-grid" aria-label="Direct contact actions">
                  {numericPhone ? (
                    <a href={`tel:${numericPhone}`} className="mono-action-btn" onClick={(e) => e.stopPropagation()}>
                      <Phone size={18} />
                      <span>Call</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="mono-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast('Phone number not listed');
                      }}
                    >
                      <Phone size={18} />
                      <span>Call</span>
                    </button>
                  )}

                  {email ? (
                    <a href={`mailto:${email}`} className="mono-action-btn" onClick={(e) => e.stopPropagation()}>
                      <Mail size={18} />
                      <span>Email</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="mono-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast('Email not listed');
                      }}
                    >
                      <Mail size={18} />
                      <span>Email</span>
                    </button>
                  )}

                  {cleanWaNumber ? (
                    <a
                      href={`https://wa.me/${cleanWaNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono-action-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle size={18} />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="mono-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast('WhatsApp unavailable');
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="mono-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveContact();
                    }}
                  >
                    <Download size={18} />
                    <span>vCard</span>
                  </button>
                </nav>
              </div>

              {/* Detail Items & Socials */}
              <div className="mono-details-card">
                {phone && (
                  <div className="mono-dt-item">
                    <span>Phone</span>
                    <b>{phone}</b>
                  </div>
                )}

                {email && (
                  <div className="mono-dt-item">
                    <span>Email</span>
                    <b>{email}</b>
                  </div>
                )}

                {location && (
                  <div className="mono-dt-item">
                    <span>Location</span>
                    <b>{location}</b>
                  </div>
                )}

                <div className="mono-dt-item">
                  <span>Availability</span>
                  <b>Direct Bookings Open</b>
                </div>

                {socialEntries.length > 0 && (
                  <div className="mono-socials">
                    {socialEntries.map((soc) => (
                      <a
                        key={soc.platform}
                        href={soc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono-social-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SocialIcon label={soc.label} url={soc.url} className="w-3.5 h-3.5 fill-current" />
                        <span>{soc.label}</span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/10 opacity-60 text-xs">
                  <p>&copy; {new Date().getFullYear()} {name}. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {toastMessage && (
        <div className="mono-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default MonolithTemplate;
