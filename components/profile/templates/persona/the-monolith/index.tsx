'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { getActionVerb, cleanDisplayUrl, downloadProfileVCard } from '@/lib/profile/templateActions';
import { pickReadableText, solveAccessibleAccent } from '@/lib/profile/contrast';
import { Phone, Mail, MessageCircle, Download, MapPin } from 'lucide-react';

type PanelKey = 'profile' | 'links' | 'services' | 'contact';

function MonolithTemplateInner({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
  const [activePanel, setActivePanel] = useState<PanelKey>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
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

  const c2Bg = accentColor || normalized.accentColor || '#1d3b2f';
  const c2Text = useMemo(() => pickReadableText(c2Bg), [c2Bg]);
  const c2VerbAccent = useMemo(() => solveAccessibleAccent('#d9a441', c2Bg), [c2Bg]);
  const readableAccentOnSlab1 = useMemo(() => solveAccessibleAccent(c2Bg === '#1d3b2f' ? '#8a5a00' : c2Bg, '#ece8de'), [c2Bg]);

  const numericPhone = useMemo(() => (phone || '').replace(/[^\d+]/g, ''), [phone]);
  const cleanWaNumber = useMemo(() => (phone || '').replace(/[^\d]/g, ''), [phone]);

  const handleSaveContact = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
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

  // Keyboard navigation for panels
  useEffect(() => {
    const panels: PanelKey[] = ['profile', 'links', 'services', 'contact'];
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
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
    <div className="monolith-wrap overflow-x-clip">
      <style>{`
        .monolith-wrap {
          --mono-bg: #141412;
          --c1-bg: #ece8de;
          --c1-text: #1a1a17;
          --c2-bg: ${c2Bg};
          --c2-text: ${c2Text};
          --c2-verb: ${c2VerbAccent};
          --c3-bg: #d9a441;
          --c3-text: #1a1a17;
          --c4-bg: #262624;
          --c4-text: #e8e4d8;

          background: var(--mono-bg);
          font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          opacity: 0.9;
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
          opacity: 0.9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mono-link-verb {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--c2-verb);
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
          font-family: var(--font-sans), -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 700;
          opacity: 0.9;
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
          opacity: 0.9;
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

        @media (prefers-reduced-motion: reduce) {
          .mono-slab,
          .mono-label,
          .mono-content,
          .mono-link-item,
          .mono-action-btn {
            transition: none !important;
          }
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
                <span className="inline-flex items-center gap-1 opacity-90 text-xs ml-1">
                  <MapPin size={12} aria-hidden="true" />
                  {location}
                </span>
              )}
            </div>

            {normalized.sectionVisibility.bio && bio && (
              <p className="mono-bio">{bio}</p>
            )}

            {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
              <div className="mt-4">
                <OpenToBadges intents={normalized.openTo} accentColor={readableAccentOnSlab1} variant="light" />
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

            {normalized.sectionVisibility.links && links && links.length > 0 ? (
              <div>
                {links.map((link, idx) => {
                  const verb = getActionVerb(link.url, link.label);
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
              <div className="py-12 opacity-90 text-sm">
                No active links on this monolith yet.
              </div>
            )}
          </div>
        </section>

        {/* ── PANEL 03: HIGHLIGHTS ── */}
        <section
          className={`mono-slab slab-3 ${activePanel === 'services' ? 'active' : ''}`}
          onClick={() => setActivePanel('services')}
          role="tabpanel"
          aria-expanded={activePanel === 'services'}
          tabIndex={0}
        >
          <div className="mono-label">
            <span>03</span>
            <b>Highlights</b>
          </div>

          <div className="mono-content">
            <h2 className="mono-section-heading">Highlights & Activity</h2>

            {normalized.sectionVisibility.proof && proofs && proofs.length > 0 ? (
              <div>
                {proofs.map((proof, idx) => (
                  <div key={proof.id || idx} className="mono-service-row">
                    <b>{proof.title}</b>
                    <span>{proof.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-sm font-medium">
                Verified milestones and highlights appear here as they are published.
              </p>
            )}

            {/* Activity Section */}
            {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
              <div className="mt-6 pt-4 border-t border-[#1a1a17]/25">
                <RecentActivitySection
                  activity={normalized.recentActivity}
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

            {normalized.sectionVisibility.contact && (
              <nav className="mono-action-grid" aria-label="Direct contact actions">
                {numericPhone && (
                  <a
                    href={`tel:${numericPhone}`}
                    className="mono-action-btn"
                    onClick={() => onLinkClick?.({ id: 'call', label: 'Call', url: `tel:${numericPhone}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                  >
                    <Phone size={16} aria-hidden="true" />
                    <span>Call</span>
                  </a>
                )}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="mono-action-btn"
                    onClick={() => onLinkClick?.({ id: 'email', label: 'Email', url: `mailto:${email}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                  >
                    <Mail size={16} aria-hidden="true" />
                    <span>Email</span>
                  </a>
                )}

                {cleanWaNumber && (
                  <a
                    href={`https://wa.me/${cleanWaNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono-action-btn"
                    onClick={() => onLinkClick?.({ id: 'whatsapp', label: 'WhatsApp', url: `https://wa.me/${cleanWaNumber}`, icon: null, clicks: 0, order: 0, isVisible: true })}
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {normalized.hasContactChannel && (
                  <button type="button" className="mono-action-btn" onClick={openContact}>
                    <MessageCircle size={16} aria-hidden="true" />
                    <span>Message</span>
                  </button>
                )}

                <button type="button" className="mono-action-btn" onClick={handleSaveContact}>
                  <Download size={16} aria-hidden="true" />
                  <span>vCard</span>
                </button>
              </nav>
            )}

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
                    onClick={() => onLinkClick?.({ id: `soc-${soc.platform}`, label: soc.label, url: soc.url, icon: null, clicks: 0, order: 0, isVisible: true })}
                  >
                    <SocialIcon label={soc.label} url={soc.url} className="w-3.5 h-3.5 fill-current" />
                    <span>{soc.label}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6 opacity-90 text-xs">
              <p>&copy; {new Date().getFullYear()} {name}</p>
            </div>
          </div>
        </section>

      </main>

      {toastMessage && (
        <div className="mono-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export function MonolithTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#ece8de"
      defaultAccent="#1d3b2f"
      isPreview={props.isPreview}
    >
      <MonolithTemplateInner {...props} />
    </ProfileTemplateShell>
  );
}

export default MonolithTemplate;

