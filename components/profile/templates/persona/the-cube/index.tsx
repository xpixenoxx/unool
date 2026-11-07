'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon, normalizeSocialPlatform } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Contextual CTA Action Verbs for Kinetic Cube
   ───────────────────────────────────────────────────────────── */
function getCubeActionVerb(url: string, label: string): string {
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

type CubeFaceIndex = 0 | 1 | 2 | 3;

export function CubeTemplate({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [activeFace, setActiveFace] = useState<CubeFaceIndex>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const name = profile?.name || 'Your Name';
  const role = profile?.role || profile?.headline || 'Founder & Creator';
  const bio = profile?.bio || 'Building and designing next-generation digital artifacts and systems.';
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

  // Handle vCard contact generation
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

  // Spatial Navigation Helpers
  const nextFace = useCallback(() => {
    setActiveFace((prev) => ((prev + 1) % 4) as CubeFaceIndex);
  }, []);

  const prevFace = useCallback(() => {
    setActiveFace((prev) => ((prev + 3) % 4) as CubeFaceIndex);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextFace();
      if (e.key === 'ArrowLeft') prevFace();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextFace, prevFace]);

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) nextFace();
      else prevFace();
    }
    setTouchStartX(null);
  };

  // Rotation angles for CSS
  const rotationY = -90 * activeFace;

  return (
    <div className="cube-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <style>{`
        .cube-wrap {
          --w: min(88vw, 440px);
          --cube-bg: #d9d6cc;
          --c1-bg: #f2efe6;
          --c1-text: #1c1c1a;
          --c2-bg: ${accentColor ? accentColor : '#2c5aa0'};
          --c2-text: #ffffff;
          --c3-bg: #e8c13c;
          --c3-text: #1c1c1a;
          --c4-bg: #c8402d;
          --c4-text: #ffffff;

          background: var(--cube-bg);
          color: var(--c1-text);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100svh;
          width: 100%;
          overflow-x: hidden;
          padding: 16px 10px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          -webkit-font-smoothing: antialiased;
        }

        /* 3D Scene Viewport */
        .cube-scene {
          perspective: 1800px;
          width: 100%;
          height: min(74svh, 600px);
          display: grid;
          place-items: center;
          position: relative;
          touch-action: pan-y;
        }

        /* 3D Spatial Box */
        .cube-box {
          position: relative;
          width: var(--w);
          height: min(68svh, 540px);
          transform-style: preserve-3d;
          transform: translateZ(calc(var(--w) / -2)) rotateY(${rotationY}deg);
          transition: transform 0.75s cubic-bezier(0.7, 0, 0.2, 1);
          will-change: transform;
        }

        /* Faces Common Styles */
        .cube-face {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.22), 0 2px 10px rgba(0,0,0,0.06);
        }

        .face-inner {
          position: absolute;
          inset: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: clamp(20px, 4vw, 32px) clamp(18px, 3.5vw, 28px);
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
        }

        .face-inner::-webkit-scrollbar {
          width: 4px;
        }
        .face-inner::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 4px;
        }

        /* Face 1: Profile (Front) */
        .face-1 {
          transform: translateZ(calc(var(--w) / 2));
          background: var(--c1-bg);
          color: var(--c1-text);
        }

        /* Face 2: Links (Right) */
        .face-2 {
          transform: rotateY(90deg) translateZ(calc(var(--w) / 2));
          background: var(--c2-bg);
          color: var(--c2-text);
        }

        /* Face 3: Services (Back) */
        .face-3 {
          transform: rotateY(180deg) translateZ(calc(var(--w) / 2));
          background: var(--c3-bg);
          color: var(--c3-text);
        }

        /* Face 4: Contact (Left) */
        .face-4 {
          transform: rotateY(270deg) translateZ(calc(var(--w) / 2));
          background: var(--c4-bg);
          color: var(--c4-text);
        }

        /* ── Face 1 Profile Typography & Avatar ── */
        .cube-avatar {
          width: clamp(100px, 22vw, 130px);
          aspect-ratio: 1;
          border-radius: 50%;
          background: #1c1c1a;
          color: #e8c13c;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: clamp(32px, 7vw, 42px);
          margin-bottom: 16px;
          overflow: hidden;
          border: 4px solid #ffffff;
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          flex-shrink: 0;
        }

        .cube-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cube-title {
          font-weight: 800;
          font-size: clamp(32px, 7vw, 44px);
          line-height: 0.98;
          letter-spacing: -0.04em;
          margin-bottom: 8px;
        }

        .cube-role {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 12px;
          opacity: 0.85;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .cube-bio {
          font-size: 15px;
          line-height: 1.5;
          opacity: 0.9;
        }

        .cube-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 14px;
        }

        .cube-chip {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: rgba(28, 28, 26, 0.08);
          color: #1c1c1a;
        }

        /* ── Face 2 Links ── */
        .face-heading {
          font-weight: 800;
          font-size: 26px;
          letter-spacing: -0.03em;
          margin-bottom: 14px;
        }

        .cube-link-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .cube-link-row:hover {
          transform: translateX(4px);
          opacity: 0.95;
        }

        .cube-link-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          color: var(--c2-bg);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .cube-link-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .cube-link-title {
          font-weight: 700;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cube-link-sub {
          font-size: 12px;
          opacity: 0.8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cube-link-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* ── Face 3 Services ── */
        .cube-service-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 2px solid #1c1c1a;
          font-weight: 800;
          font-size: clamp(17px, 3.8vw, 21px);
          letter-spacing: -0.02em;
        }

        .cube-service-row span {
          font-size: 13px;
          font-weight: 700;
          opacity: 0.85;
          white-space: nowrap;
        }

        /* ── Face 4 Contact ── */
        .cube-action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 18px;
        }

        .cube-action-btn {
          border: 2px solid #ffffff;
          border-radius: 12px;
          padding: 12px 6px;
          text-align: center;
          font-weight: 800;
          font-size: 13px;
          color: #ffffff;
          background: transparent;
          text-decoration: none;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: background 0.18s ease, color 0.18s ease;
          cursor: pointer;
        }

        .cube-action-btn:hover {
          background: #ffffff;
          color: var(--c4-bg);
        }

        .cube-dt-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.35);
          font-size: 13px;
        }

        .cube-dt-row span {
          opacity: 0.75;
        }

        .cube-dt-row b {
          font-weight: 700;
        }

        .cube-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 14px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
        }

        .cube-social-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          opacity: 0.9;
        }

        .cube-social-pill:hover {
          opacity: 1;
          text-decoration: underline;
        }

        /* ── Spatial Pill Tabs Navigation ── */
        .cube-tabs {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          flex-wrap: wrap;
          z-index: 10;
        }

        .cube-tab {
          padding: 9px 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.65);
          color: #1c1c1a;
          font-weight: 700;
          font-size: 13px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }

        .cube-tab:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .cube-tab.active {
          background: #1c1c1a;
          color: #ffffff;
          border-color: #1c1c1a;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }

        /* Spatial Chevron Navigators */
        .cube-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          color: #1c1c1a;
          border: none;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          transition: background 0.2s, transform 0.15s;
          z-index: 25;
        }

        .cube-nav-btn:hover {
          background: #ffffff;
          transform: translateY(-50%) scale(1.08);
        }

        .cube-nav-prev {
          left: max(4px, calc((100% - var(--w)) / 2 - 46px));
        }

        .cube-nav-next {
          right: max(4px, calc((100% - var(--w)) / 2 - 46px));
        }

        @media (max-width: 520px) {
          .cube-nav-prev { left: 4px; }
          .cube-nav-next { right: 4px; }
        }

        /* Toast notifications */
        .cube-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #1c1c1a;
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 100;
        }
      `}</style>

      {/* 3D Kinetic Scene */}
      <div
        className="cube-scene"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left/Right Spatial Chevrons */}
        <button
          type="button"
          className="cube-nav-btn cube-nav-prev"
          onClick={prevFace}
          aria-label="Previous Face"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className="cube-nav-btn cube-nav-next"
          onClick={nextFace}
          aria-label="Next Face"
        >
          <ChevronRight size={20} />
        </button>

        {/* 3D Box with 4 Kinetic Faces */}
        <div className="cube-box">
          
          {/* ── FACE 1: IDENTITY & PROFILE ── */}
          <section className="cube-face face-1" aria-label="Profile Face">
            <div className="face-inner">
              <div className="cube-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} loading="eager" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <h1 className="cube-title">{name}</h1>

              <div className="cube-role">
                <span>{role}</span>
                {location && (
                  <span className="inline-flex items-center gap-1 opacity-70 text-xs ml-1">
                    <MapPin size={12} />
                    {location}
                  </span>
                )}
              </div>

              <p className="cube-bio">{bio}</p>

              {profile?.openTo && profile.openTo.length > 0 && (
                <div className="cube-chips">
                  {profile.openTo.map((intent: string) => (
                    <span key={intent} className="cube-chip">
                      {intent.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-6 opacity-60 text-xs flex justify-between items-center">
                <span>01 / 04 PROFILE</span>
                <span>SWIPE OR TAP TABS &rarr;</span>
              </div>
            </div>
          </section>

          {/* ── FACE 2: LINKS & CHANNELS ── */}
          <section className="cube-face face-2" aria-label="Links Face">
            <div className="face-inner">
              <h2 className="face-heading">Links & Channels</h2>

              {links && links.length > 0 ? (
                <div className="flex flex-col">
                  {links.map((link, idx) => {
                    const verb = getCubeActionVerb(link.url, link.label);
                    return (
                      <a
                        key={link.id || idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cube-link-row"
                        onClick={() => onLinkClick?.(link)}
                      >
                        <div className="cube-link-icon">
                          <SocialIcon label={link.label} url={link.url} icon={link.icon || undefined} className="w-5 h-5 fill-current" />
                        </div>
                        <div className="cube-link-info">
                          <strong className="cube-link-title">{link.label}</strong>
                          <span className="cube-link-sub">{cleanDisplayUrl(link.url)}</span>
                        </div>
                        <span className="cube-link-badge">{verb}</span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 opacity-80 text-sm">
                  No links added yet.
                </div>
              )}

              <div className="mt-auto pt-6 opacity-75 text-xs flex justify-between items-center">
                <span>02 / 04 LINKS</span>
                <span>SWIPE &rarr;</span>
              </div>
            </div>
          </section>

          {/* ── FACE 3: SERVICES & PROOFS ── */}
          <section className="cube-face face-3" aria-label="Services Face">
            <div className="face-inner">
              <h2 className="face-heading">Services & Proofs</h2>

              {proofs && proofs.length > 0 ? (
                <div>
                  {proofs.map((proof, idx) => (
                    <div key={proof.id || idx} className="cube-service-row">
                      <b>{proof.title}</b>
                      <span>{proof.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="cube-service-row">
                    <b>Digital Product Architecture</b>
                    <span>From $1,500</span>
                  </div>
                  <div className="cube-service-row">
                    <b>Brand & Spatial Systems</b>
                    <span>From $2,000</span>
                  </div>
                  <div className="cube-service-row">
                    <b>Technical Advisory</b>
                    <span>From $750</span>
                  </div>
                </div>
              )}

              {/* Activity Section */}
              {profile?.recentActivity && (
                <div className="mt-4 pt-3 border-t-2 border-[#1c1c1a]/40">
                  <RecentActivitySection
                    activity={profile.recentActivity}
                    variant="stack"
                    isDark={false}
                    accentColor="#1c1c1a"
                    autoScroll={profile.autoScroll}
                  />
                </div>
              )}

              <div className="mt-auto pt-6 opacity-75 text-xs flex justify-between items-center">
                <span>03 / 04 SERVICES</span>
                <span>SWIPE &rarr;</span>
              </div>
            </div>
          </section>

          {/* ── FACE 4: CONTACT & REACH ── */}
          <section className="cube-face face-4" aria-label="Contact Face">
            <div className="face-inner">
              <h2 className="face-heading">Direct Contact</h2>

              <nav className="cube-action-grid" aria-label="Direct actions">
                {numericPhone ? (
                  <a href={`tel:${numericPhone}`} className="cube-action-btn">
                    <Phone size={16} />
                    <span>Call</span>
                  </a>
                ) : (
                  <button type="button" className="cube-action-btn" onClick={() => showToast('Phone number not listed')}>
                    <Phone size={16} />
                    <span>Call</span>
                  </button>
                )}

                {email ? (
                  <a href={`mailto:${email}`} className="cube-action-btn">
                    <Mail size={16} />
                    <span>Email</span>
                  </a>
                ) : (
                  <button type="button" className="cube-action-btn" onClick={() => showToast('Email not listed')}>
                    <Mail size={16} />
                    <span>Email</span>
                  </button>
                )}

                {cleanWaNumber ? (
                  <a href={`https://wa.me/${cleanWaNumber}`} target="_blank" rel="noopener noreferrer" className="cube-action-btn">
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <button type="button" className="cube-action-btn" onClick={() => showToast('WhatsApp unavailable')}>
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </button>
                )}

                <button type="button" className="cube-action-btn" onClick={handleSaveContact}>
                  <Download size={16} />
                  <span>vCard</span>
                </button>
              </nav>

              {phone && (
                <div className="cube-dt-row">
                  <span>Phone</span>
                  <b>{phone}</b>
                </div>
              )}

              {email && (
                <div className="cube-dt-row">
                  <span>Email</span>
                  <b>{email}</b>
                </div>
              )}

              {location && (
                <div className="cube-dt-row">
                  <span>Location</span>
                  <b>{location}</b>
                </div>
              )}

              {socialEntries.length > 0 && (
                <div className="cube-socials">
                  {socialEntries.map((soc) => (
                    <a
                      key={soc.platform}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cube-social-pill"
                    >
                      <SocialIcon label={soc.label} url={soc.url} className="w-3.5 h-3.5 fill-current" />
                      <span>{soc.label}</span>
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-5 opacity-70 text-xs flex justify-between items-center">
                <span>04 / 04 CONTACT</span>
                <span>&copy; {new Date().getFullYear()} {name}</span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Spatial Tabs Selector */}
      <nav className="cube-tabs" aria-label="Select cube face">
        <button
          type="button"
          className={`cube-tab ${activeFace === 0 ? 'active' : ''}`}
          onClick={() => setActiveFace(0)}
        >
          Profile
        </button>
        <button
          type="button"
          className={`cube-tab ${activeFace === 1 ? 'active' : ''}`}
          onClick={() => setActiveFace(1)}
        >
          Links
        </button>
        <button
          type="button"
          className={`cube-tab ${activeFace === 2 ? 'active' : ''}`}
          onClick={() => setActiveFace(2)}
        >
          Services
        </button>
        <button
          type="button"
          className={`cube-tab ${activeFace === 3 ? 'active' : ''}`}
          onClick={() => setActiveFace(3)}
        >
          Contact
        </button>
      </nav>

      {toastMessage && (
        <div className="cube-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default CubeTemplate;

