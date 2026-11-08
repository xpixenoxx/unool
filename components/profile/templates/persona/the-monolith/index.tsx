'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon, normalizeSocialPlatform } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, MapPin, ExternalLink } from 'lucide-react';

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

export function MonolithTemplate({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    <div className="monolith-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <style>{`
        .monolith-wrap {
          --mono-bg: #141412;
          --c1-bg: #ece8de;
          --c1-text: #1a1a17;
          --c2-bg: ${accentColor ? accentColor : '#1d3b2f'};
          --c2-text: #e8e4d8;
          --c3-bg: #d9a441;
          --c3-text: #1a1a17;
          --c4-bg: #262624;
          --c4-text: #e8e4d8;

          background: var(--mono-bg);
          font-family: 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          position: relative;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Main Layout: Horizontal Flex on Desktop ── */
        .monolith-container {
          display: flex;
          height: 100svh;
          width: 100%;
          overflow: hidden;
        }

        /* Monolith Slab */
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

        /* Collapsed Vertical Label */
        .mono-label {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 34px 0;
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

        /* Expanded Slab Interior Content */
        .mono-content {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: min(720px, calc(100vw - 230px));
          padding: 56px clamp(24px, 4.5vw, 64px) 60px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .mono-content::-webkit-scrollbar {
          width: 4px;
        }
        .mono-content::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 4px;
        }
        .slab-2 .mono-content::-webkit-scrollbar-thumb,
        .slab-4 .mono-content::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
        }

        .mono-slab.active .mono-content {
          opacity: 1;
          pointer-events: auto;
          transition: opacity 0.35s 0.25s ease;
        }

        /* ── Slab 1 Profile Styling ── */
        .mono-avatar {
          width: min(200px, 50%);
          aspect-ratio: 4 / 5;
          border-radius: 16px;
          background: #cfc8b5;
          color: #1d3b2f;
          display: grid;
          place-items: center;
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 52px;
          margin-bottom: 22px;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(0,0,0,0.12);
          flex-shrink: 0;
        }

        .mono-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .mono-name {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(38px, 6vw, 68px);
          line-height: 0.98;
          letter-spacing: -0.025em;
          font-weight: 400;
          margin-bottom: 10px;
        }

        .mono-role {
          font-weight: 700;
          font-size: 17px;
          color: #8a5a00;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .mono-bio {
          font-size: 16px;
          line-height: 1.6;
          max-width: 44ch;
          opacity: 0.9;
        }

        .mono-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }

        .mono-chip {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: rgba(26, 26, 23, 0.08);
          color: #1a1a17;
        }

        /* ── Slab 2 Links Styling ── */
        .mono-section-heading {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 32px;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
          font-weight: 400;
        }

        .mono-link-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 16px 4px;
          border-bottom: 1px solid rgba(232, 228, 216, 0.2);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .mono-link-item:hover {
          transform: translateX(8px);
          opacity: 0.95;
        }

        .mono-link-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #e8e4d8;
          color: #1d3b2f;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .mono-link-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .mono-link-title {
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 21px;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mono-link-url {
          font-size: 12.5px;
          opacity: 0.65;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mono-link-verb {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #d9a441;
          white-space: nowrap;
        }

        /* ── Slab 3 Services Styling ── */
        .mono-service-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid rgba(26, 26, 23, 0.25);
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: clamp(20px, 3.2vw, 32px);
          font-weight: 400;
        }

        .mono-service-row span {
          font-family: 'Avenir Next', -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 700;
          opacity: 0.85;
          white-space: nowrap;
        }

        /* ── Slab 4 Contact Styling ── */
        .mono-action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 22px;
        }

        .mono-action-btn {
          border: 1px solid rgba(232, 228, 216, 0.35);
          border-radius: 14px;
          padding: 16px 8px;
          text-align: center;
          font-weight: 600;
          font-size: 13px;
          color: #e8e4d8;
          background: transparent;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.18s ease, color 0.18s ease;
          cursor: pointer;
        }

        .mono-action-btn:hover {
          background: #e8e4d8;
          color: #262624;
        }

        .mono-dt-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(232, 228, 216, 0.2);
          font-size: 14px;
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
          gap: 8px 18px;
          margin-top: 22px;
          padding-top: 14px;
          border-top: 1px solid rgba(232, 228, 216, 0.2);
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

        /* ── Responsive Mobile Accordion Stack ── */
        @media (max-width: 760px) {
          .monolith-wrap {
            overflow-y: auto;
            overflow-x: hidden;
          }

          .monolith-container {
            flex-direction: column;
            height: auto;
            min-height: 100svh;
          }

          .mono-slab {
            flex-basis: 64px;
            flex-grow: 0;
            min-height: 64px;
            transition: min-height 0.5s cubic-bezier(0.7, 0, 0.2, 1);
          }

          .mono-slab.active {
            min-height: calc(100svh - 192px);
            flex-grow: 1;
          }

          .mono-label {
            flex-direction: row;
            padding: 0 20px;
            align-items: center;
            height: 64px;
            bottom: auto;
          }

          .mono-label b {
            writing-mode: horizontal-tb;
            transform: none;
            font-size: 20px;
          }

          .mono-slab.active .mono-label {
            opacity: 1;
            pointer-events: auto;
          }

          .mono-content {
            position: relative;
            width: 100%;
            top: 64px;
            left: 0;
            padding: 14px 20px 48px;
            opacity: 0;
          }

          .mono-slab.active .mono-content {
            opacity: 1;
            transition: opacity 0.3s 0.15s ease;
          }

          .mono-avatar {
            width: 140px;
          }
        }

        .mono-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #e8e4d8;
          color: #1a1a17;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 100;
        }
      `}</style>

      {/* Monolithic Expanding Slabs */}
      <main className="monolith-container" role="tablist">
        
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
            <div className="mono-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} loading="eager" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <h1 className="mono-name">{name}</h1>

            <div className="mono-role">
              <span>{role}</span>
              {location && (
                <span className="inline-flex items-center gap-1 opacity-70 text-xs ml-1">
                  <MapPin size={12} />
                  {location}
                </span>
              )}
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
            <h2 className="mono-section-heading">Curated Links</h2>

            {links && links.length > 0 ? (
              <div>
                {links.map((link, idx) => {
                  const verb = getMonolithActionVerb(link.url, link.label);
                  return (
                    <a
                      key={link.id || idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono-link-item"
                      onClick={() => onLinkClick?.(link)}
                    >
                      <div className="mono-link-icon">
                        <SocialIcon label={link.label} url={link.url} icon={link.icon || undefined} className="w-5 h-5 fill-current" />
                      </div>
                      <div className="mono-link-text">
                        <strong className="mono-link-title">{link.label}</strong>
                        <span className="mono-link-url">{cleanDisplayUrl(link.url)}</span>
                      </div>
                      <span className="mono-link-verb">{verb} &rarr;</span>
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

            {proofs && proofs.length > 0 ? (
              <div>
                {proofs.map((proof, idx) => (
                  <div key={proof.id || idx} className="mono-service-row">
                    <b>{proof.title}</b>
                    <span>{proof.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="mono-service-row">
                  <b>Architectural Systems</b>
                  <span>From $2,000</span>
                </div>
                <div className="mono-service-row">
                  <b>Digital Identity Systems</b>
                  <span>From $1,500</span>
                </div>
                <div className="mono-service-row">
                  <b>Spatial Direction</b>
                  <span>From $900</span>
                </div>
              </div>
            )}

            {/* Activity Section */}
            {profile?.recentActivity && (
              <div className="mt-6 pt-4 border-t border-[#1a1a17]/25">
                <RecentActivitySection
                  activity={profile.recentActivity}
                  variant="stack"
                  isDark={false}
                  accentColor="#1a1a17"
                  autoScroll={profile.autoScroll}
                />
              </div>
            )}
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

            <nav className="mono-action-grid" aria-label="Direct contact actions">
              {numericPhone ? (
                <a href={`tel:${numericPhone}`} className="mono-action-btn">
                  <Phone size={16} />
                  <span>Call</span>
                </a>
              ) : (
                <button type="button" className="mono-action-btn" onClick={() => showToast('Phone number not listed')}>
                  <Phone size={16} />
                  <span>Call</span>
                </button>
              )}

              {email ? (
                <a href={`mailto:${email}`} className="mono-action-btn">
                  <Mail size={16} />
                  <span>Email</span>
                </a>
              ) : (
                <button type="button" className="mono-action-btn" onClick={() => showToast('Email not listed')}>
                  <Mail size={16} />
                  <span>Email</span>
                </button>
              )}

              {cleanWaNumber ? (
                <a href={`https://wa.me/${cleanWaNumber}`} target="_blank" rel="noopener noreferrer" className="mono-action-btn">
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </a>
              ) : (
                <button type="button" className="mono-action-btn" onClick={() => showToast('WhatsApp unavailable')}>
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </button>
              )}

              <button type="button" className="mono-action-btn" onClick={handleSaveContact}>
                <Download size={16} />
                <span>vCard</span>
              </button>
            </nav>

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

            {socialEntries.length > 0 && (
              <div className="mono-socials">
                {socialEntries.map((soc) => (
                  <a
                    key={soc.platform}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono-social-link"
                  >
                    <SocialIcon label={soc.label} url={soc.url} className="w-3.5 h-3.5 fill-current" />
                    <span>{soc.label}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6 opacity-60 text-xs">
              <p>&copy; {new Date().getFullYear()} {name}</p>
            </div>
          </div>
        </section>

      </main>

      {toastMessage && (
        <div className="mono-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default MonolithTemplate;

