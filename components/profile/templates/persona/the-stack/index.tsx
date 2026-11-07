'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon, normalizeSocialPlatform } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, ExternalLink, MapPin, Check, Copy } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Action Verb Intelligence: Infers intentional CTA verbs from URLs
   ───────────────────────────────────────────────────────────── */
function getActionVerb(url: string, label: string): string {
  const u = (url || '').toLowerCase();
  const l = (label || '').toLowerCase();

  // 1. Portfolio, creative showcases, case studies
  if (l.includes('portfolio') || l.includes('work') || l.includes('case stud') || u.includes('dribbble.com') || u.includes('behance.net')) return 'Explore';

  // 2. Websites, personal domains, company portals
  if (l.includes('website') || l.includes('site') || l.includes('homepage') || l.includes('web') || l.includes('portal')) return 'Visit';

  // 3. High-intent interactive actions
  if (u.includes('cal.com') || u.includes('calendly.com') || l.includes('book') || l.includes('schedule') || l.includes('meeting')) return 'Book';
  if (u.includes('wa.me') || u.includes('whatsapp') || l.includes('chat') || l.includes('message')) return 'Chat';
  if (u.includes('linkedin.com') || l.includes('connect')) return 'Connect';
  if (u.includes('.pdf') || l.includes('resume') || l.includes('cv') || l.includes('download')) return 'Get';
  if (u.includes('github.com') || u.includes('gitlab.com') || l.includes('code') || l.includes('repo')) return 'Inspect';

  // 4. Media & Content
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('twitch.tv') || u.includes('vimeo') || l.includes('watch') || l.includes('video')) return 'Watch';
  if (u.includes('spotify.com') || u.includes('apple.com/music') || u.includes('soundcloud') || l.includes('listen') || l.includes('podcast')) return 'Listen';
  if (u.includes('substack.com') || u.includes('medium.com') || l.includes('blog') || l.includes('article') || l.includes('read') || l.includes('newsletter')) return 'Read';

  // 5. Social networks (strict boundary check so domains like pixenox.com or dropbox.com don't match x.com)
  const isX = /(?:^|[\/\.])x\.com(?=[\/\?#:]|$)/i.test(u) || u.includes('twitter.com') || l === 'x' || l === 'twitter';
  const isSocial = isX || u.includes('instagram.com') || u.includes('threads.net') || u.includes('tiktok.com');
  if (isSocial) return 'Follow';

  // 6. High-impact default for custom domains / general links
  return 'Visit';
}

function cleanDisplayUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function StackTemplate({
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

  // Profile data extraction with resilient fallbacks
  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Independent Practitioner';
  const bio = profile?.bio || 'Building clear, lasting solutions. Available for select client engagements.';
  const location = profile?.location || (profile as any)?.city || '';
  const avatarUrl = profile?.avatarUrl || (profile as any)?.avatar_url || '';
  const email = profile?.email || '';
  const phone = (profile as any)?.phone || '';
  const links: ProfileLink[] = (profile?.links || []).filter((l) => l.isVisible !== false);
  const proofs: ProfileProof[] = profile?.proofs || (profile as any)?.proofPoints || [];

  // Sanitize phone for direct WhatsApp / Tel
  const numericPhone = useMemo(() => {
    return (phone || '').replace(/[^\d+]/g, '');
  }, [phone]);

  const cleanWaNumber = useMemo(() => {
    return (phone || '').replace(/[^\d]/g, '');
  }, [phone]);

  // Handle direct vCard contact generation
  const handleSaveContact = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
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

  // Smooth scroll handler for transparent swipe cues
  const scrollToCard = useCallback((cardIndex: number) => {
    if (typeof document === 'undefined') return;
    const targetCard = document.querySelector(`.sc-${cardIndex}`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Social handles extraction
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

  // Schema.org JSON-LD Microdata for Search Engines
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

  // Accent customization: tint card 2 if user has custom accent
  const customAccentColor = accentColor || profile?.theme?.accentColor;

  return (
    <div className="stack-wrap">
      {/* Search Engine & Social Media Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Scoped High-Performance CSS (Zero layout-thrashing, GPU accelerated) */}
      <style>{`
        .stack-wrap {
          --stack-bg: #121212;
          --stack-text-dark: #171714;
          --stack-text-light: #ece6d8;
          --c1-bg: #ece6d8;
          --c2-bg: ${customAccentColor ? customAccentColor : '#c4693f'};
          --c3-bg: #8c9a73;
          --c4-bg: #2a2a27;

          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--stack-bg);
          color: var(--stack-text-dark);
          min-height: 100vh;
          width: 100%;
          padding: 22px 14px 120px;
          position: relative;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .stack-container {
          max-width: 620px;
          margin: 0 auto;
          position: relative;
        }

        /* Hardware-Accelerated Stacking Physics with Guaranteed 5-6mm Margins */
        .stack-card {
          position: sticky;
          border-radius: 26px;
          padding: clamp(18px, 3.5vw, 24px);
          margin-bottom: 24px;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.35);
          transform: translate3d(0, 0, 0);
          will-change: transform;
          contain: paint layout;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: calc(100dvh - 44px - var(--n, 0) * 18px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .stack-card::-webkit-scrollbar {
          width: 4px;
        }
        .stack-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .stack-card::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 4px;
        }
        .sc-4::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Top Offsets to create the physical cascading ledger with ~5.5mm top spacing */
        .sc-1 {
          --n: 0;
          top: calc(22px + var(--n) * 18px);
          background: var(--c1-bg);
          color: var(--stack-text-dark);
          z-index: 10;
        }

        .sc-2 {
          --n: 1;
          top: calc(22px + var(--n) * 18px);
          background: var(--c2-bg);
          color: var(--stack-text-dark);
          z-index: 20;
        }

        .sc-3 {
          --n: 2;
          top: calc(22px + var(--n) * 18px);
          background: var(--c3-bg);
          color: var(--stack-text-dark);
          z-index: 30;
        }

        .sc-4 {
          --n: 3;
          top: calc(22px + var(--n) * 18px);
          background: var(--c4-bg);
          color: var(--stack-text-light);
          z-index: 40;
        }

        /* Responsive Mobile Clearance (Guaranteed 5-6mm breathing room top and bottom) */
        @media (max-width: 640px) {
          .stack-wrap {
            padding: 20px 10px 90px;
          }
          .stack-card {
            padding: 16px 14px;
            border-radius: 22px;
            max-height: calc(100dvh - 40px - var(--n, 0) * 16px);
          }
          .stack-portrait {
            height: clamp(130px, 24dvh, 180px) !important;
            margin-bottom: 12px !important;
          }
        }

        /* Typography & Micro-labels Proportioned to Fit Screen Vertically */
        .stack-card h1 {
          font-size: clamp(1.75rem, 4.5vw, 2.3rem);
          line-height: 1.1;
          letter-spacing: -0.03em;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stack-card .stack-role {
          font-size: 0.95rem;
          font-weight: 500;
          opacity: 0.75;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .stack-card .stack-bio {
          font-size: 0.88rem;
          line-height: 1.5;
          opacity: 0.85;
          max-width: 520px;
        }

        .stack-section-title {
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-bottom: 14px;
          font-weight: 700;
          opacity: 0.75;
        }

        /* Card 1 Hero Portrait - Adaptive Height that Never Overflows Screen */
        .stack-portrait {
          width: 100%;
          height: clamp(140px, 26dvh, 220px);
          border-radius: 18px;
          background: #cfc8b8;
          overflow: hidden;
          position: relative;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.06);
        }

        .stack-portrait img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .stack-portrait-placeholder {
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6a6458;
          font-weight: 700;
        }

        /* Transparent Swipe Indicator */
        .stack-swipe-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 14px auto 0;
          width: fit-content;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.09);
          color: rgba(23, 23, 20, 0.72);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        }

        .stack-swipe-hint:hover {
          background: rgba(0, 0, 0, 0.1);
          color: rgba(23, 23, 20, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
        }

        .stack-swipe-hint-c2 {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.28);
          color: #171714;
        }
        .stack-swipe-hint-c2:hover {
          background: rgba(255, 255, 255, 0.28);
          color: #171714;
        }

        .stack-swipe-hint-c3 {
          background: rgba(0, 0, 0, 0.06);
          border-color: rgba(0, 0, 0, 0.12);
          color: #171714;
        }
        .stack-swipe-hint-c3:hover {
          background: rgba(0, 0, 0, 0.12);
          color: #171714;
        }

        .stack-swipe-hint .stack-swipe-icon {
          animation: stackSwipeFloat 2s infinite ease-in-out;
        }

        @keyframes stackSwipeFloat {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        /* Card 2 Links Grid */
        .stack-link-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
          background: rgba(255, 255, 255, 0.32);
          border-radius: 16px;
          padding: 13px 16px;
          margin-bottom: 9px;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
          text-decoration: none;
          color: inherit;
        }

        .stack-link-row:hover {
          background: #171714;
          color: #ece6d8;
          transform: translateY(-1px);
        }

        .stack-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #171714;
          color: #ece6d8;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          transition: background 0.18s ease, color 0.18s ease;
        }

        .stack-link-row:hover .stack-icon-box {
          background: #ece6d8;
          color: #171714;
        }

        .stack-link-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .stack-link-meta strong {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.25;
        }

        .stack-link-meta small {
          font-size: 12px;
          opacity: 0.7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 2px;
        }

        .stack-action-verb {
          font-style: normal;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          opacity: 0.85;
          padding: 4px 8px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.06);
        }

        .stack-link-row:hover .stack-action-verb {
          background: rgba(255, 255, 255, 0.15);
        }

        /* Card 3 Services & Proof Ledger */
        .stack-service-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .stack-service-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 13px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.15);
          font-size: 16px;
        }

        .stack-service-row:last-child {
          border-bottom: none;
        }

        .stack-service-row b {
          font-weight: 600;
        }

        .stack-service-row span {
          font-size: 14px;
          font-weight: 600;
          opacity: 0.85;
          letter-spacing: -0.01em;
        }

        /* Card 4 Action Dock */
        .stack-action-dock {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 24px;
        }

        .stack-action-btn {
          border: 1px solid rgba(236, 230, 216, 0.35);
          border-radius: 14px;
          padding: 15px 12px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          color: #ece6d8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
        }

        .stack-action-btn:hover {
          background: #ece6d8;
          color: #171714;
          border-color: #ece6d8;
        }

        /* Social Links Matrix */
        .stack-social-matrix {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid rgba(236, 230, 216, 0.15);
        }

        .stack-social-link {
          font-size: 13px;
          color: #ece6d8;
          opacity: 0.75;
          text-decoration: none;
          transition: opacity 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .stack-social-link:hover {
          opacity: 1;
          text-decoration: underline;
        }

        /* Toast Feedback */
        .stack-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #171714;
          color: #ece6d8;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          z-index: 100;
          animation: stackFadeIn 0.2s ease;
        }

        @keyframes stackFadeIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {/* Main Stack Container */}
      <main className="stack-container">
        
        {/* ── CARD 1: IDENTITY & HERO ────────────────────────────── */}
        <section className="stack-card sc-1" aria-label="Profile Identity">
          <div className="stack-portrait">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} loading="eager" />
            ) : (
              <div className="stack-portrait-placeholder">
                {name ? name.slice(0, 2).toUpperCase() : 'PORTFOLIO'}
              </div>
            )}
          </div>

          <h1>{name}</h1>

          <div className="stack-role">
            <span>{role}</span>
            {location && (
              <span className="inline-flex items-center gap-1 opacity-70 text-sm ml-1">
                <MapPin size={13} className="shrink-0" />
                {location}
              </span>
            )}
          </div>

          <p className="stack-bio">{bio}</p>

          {/* Open To Intent Badges (if available) */}
          {profile?.openTo && profile.openTo.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-black/10">
              {profile.openTo.map((intent: string) => (
                <span
                  key={intent}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black/5 text-[#171714] tracking-wide"
                >
                  {intent.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Transparent Swipe Cue */}
          <div
            className="stack-swipe-hint"
            onClick={() => scrollToCard(2)}
            role="button"
            tabIndex={0}
            title="Swipe up to explore links"
          >
            <svg
              className="stack-swipe-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="7 14 12 9 17 14" />
              <polyline points="7 19 12 14 17 19" />
            </svg>
            <span>Swipe</span>
          </div>
        </section>

        {/* ── CARD 2: CHANNELS & PROOF LINKS ─────────────────────── */}
        <section className="stack-card sc-2" aria-label="Curated Links">
          <h2 className="stack-section-title">Links & Channels</h2>

          <div className="stack-links-container">
            {links && links.length > 0 ? (
              links.map((link, idx) => {
                const verb = getActionVerb(link.url, link.label);
                const displayUrl = cleanDisplayUrl(link.url);

                return (
                  <a
                    key={link.id || idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stack-link-row"
                    onClick={() => onLinkClick?.(link)}
                    title={`Open ${link.label}`}
                  >
                    <div className="stack-icon-box">
                      <SocialIcon label={link.label} url={link.url} icon={link.icon || undefined} className="w-5 h-5 fill-current" />
                    </div>
                    <div className="stack-link-meta">
                      <strong>{link.label}</strong>
                      <small>{displayUrl}</small>
                    </div>
                    <em className="stack-action-verb">{verb}</em>
                  </a>
                );
              })
            ) : (
              <div className="p-4 text-center opacity-70 text-sm">
                No active links currently published.
              </div>
            )}
          </div>

          {/* Transparent Swipe Cue */}
          <div
            className="stack-swipe-hint stack-swipe-hint-c2"
            onClick={() => scrollToCard(3)}
            role="button"
            tabIndex={0}
            title="Swipe up to explore services"
          >
            <svg
              className="stack-swipe-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="7 14 12 9 17 14" />
              <polyline points="7 19 12 14 17 19" />
            </svg>
            <span>Swipe</span>
          </div>
        </section>

        {/* ── CARD 3: SERVICES, METRICS & LATEST DISPATCH ─────────── */}
        <section className="stack-card sc-3" aria-label="Services and Milestones">
          <h2 className="stack-section-title">Services & Offerings</h2>

          {proofs && proofs.length > 0 ? (
            <ul className="stack-service-list">
              {proofs.map((proof, idx) => (
                <li key={proof.id || idx} className="stack-service-row">
                  <b>{proof.title}</b>
                  <span>{proof.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="stack-service-list">
              <li className="stack-service-row">
                <b>Brand Identity Systems</b>
                <span>From $800</span>
              </li>
              <li className="stack-service-row">
                <b>Digital Products & Web</b>
                <span>From $1,200</span>
              </li>
              <li className="stack-service-row">
                <b>Design Architecture & Advisory</b>
                <span>From $600</span>
              </li>
            </ul>
          )}

          {/* Seamless Native Recent Activity Embedding */}
          {profile?.recentActivity && (
            <div className="mt-5 pt-4 border-t border-black/15">
              <RecentActivitySection
                activity={profile.recentActivity}
                variant="stack"
                isDark={false}
                accentColor="#c4693f"
                autoScroll={profile.autoScroll}
              />
            </div>
          )}

          {/* Transparent Swipe Cue */}
          <div
            className="stack-swipe-hint stack-swipe-hint-c3"
            onClick={() => scrollToCard(4)}
            role="button"
            tabIndex={0}
            title="Swipe up to contact"
          >
            <svg
              className="stack-swipe-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="7 14 12 9 17 14" />
              <polyline points="7 19 12 14 17 19" />
            </svg>
            <span>Swipe</span>
          </div>
        </section>

        {/* ── CARD 4: ACTION DOCK & CONTACT MATRIX ───────────────── */}
        <section className="stack-card sc-4" aria-label="Contact and Actions">
          <h2 className="stack-section-title" style={{ color: 'rgba(236, 230, 216, 0.75)' }}>
            Initiate Contact
          </h2>

          <nav className="stack-action-dock">
            {/* Call Action */}
            {numericPhone ? (
              <a href={`tel:${numericPhone}`} className="stack-action-btn" title="Call directly">
                <Phone size={15} />
                <span>Call</span>
              </a>
            ) : (
              <button
                type="button"
                className="stack-action-btn"
                onClick={() => showToast('Direct phone line unavailable')}
              >
                <Phone size={15} />
                <span>Call</span>
              </button>
            )}

            {/* Email Action */}
            {email ? (
              <a href={`mailto:${email}`} className="stack-action-btn" title="Send email">
                <Mail size={15} />
                <span>Email</span>
              </a>
            ) : (
              <button
                type="button"
                className="stack-action-btn"
                onClick={() => showToast('Email address not disclosed')}
              >
                <Mail size={15} />
                <span>Email</span>
              </button>
            )}

            {/* WhatsApp Direct Chat */}
            {cleanWaNumber ? (
              <a
                href={`https://wa.me/${cleanWaNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="stack-action-btn"
                title="Chat on WhatsApp"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                type="button"
                className="stack-action-btn"
                onClick={() => showToast('WhatsApp connection unavailable')}
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </button>
            )}

            {/* Save Contact (vCard) */}
            <button
              type="button"
              className="stack-action-btn"
              onClick={handleSaveContact}
              title="Download vCard contact file"
            >
              <Download size={15} />
              <span>Save Contact</span>
            </button>
          </nav>

          {/* Social Links Row */}
          {socialEntries.length > 0 && (
            <div className="stack-social-matrix">
              {socialEntries.map((soc) => (
                <a
                  key={soc.platform}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stack-social-link"
                >
                  <SocialIcon label={soc.label} url={soc.url} className="w-3.5 h-3.5 fill-current" />
                  <span>{soc.label}</span>
                </a>
              ))}
            </div>
          )}

          <footer className="mt-6 pt-3 text-[12px] opacity-50 flex items-center justify-between">
            <p>&copy; {new Date().getFullYear()} {name}</p>
          </footer>
        </section>
      </main>

      {/* Ephemeral Toast Feedback */}
      {toastMessage && (
        <div className="stack-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default StackTemplate;

