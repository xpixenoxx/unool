'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { ProfileTemplateShell, useProfileShell } from '@/components/profile/ProfileTemplateShell';
import { getActionVerb, cleanDisplayUrl, downloadProfileVCard } from '@/lib/profile/templateActions';
import { pickReadableText } from '@/lib/profile/contrast';
import { Phone, Mail, MessageCircle, Download, ExternalLink, MapPin, Check, Copy } from 'lucide-react';

function StackTemplateInner({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
}: TemplateProps) {
  const { normalized, openContact } = useProfileShell();
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
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const name = normalized.name;
  const role = normalized.role || normalized.headline;
  const bio = normalized.bio;
  const location = normalized.location;
  const avatarUrl = normalized.avatarUrl;
  const email = normalized.showEmail ? normalized.email : '';
  const phone = (profile as any)?.phone || '';
  const links: ProfileLink[] = normalized.links;
  const proofs = normalized.proofs;

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

  // Accent customization: tint card 2 if user has custom accent
  const customAccentColor = accentColor || normalized.accentColor;
  const c2BgColor = customAccentColor || '#c4693f';
  const c2TextColor = pickReadableText(c2BgColor);

  return (
    <div className="stack-wrap overflow-x-clip">
      {/* Scoped High-Performance CSS (Zero layout-thrashing, GPU accelerated) */}
      <style>{`
        .stack-wrap {
          --stack-bg: #f4f0e8;
          --stack-text-dark: #171714;
          --stack-text-light: #ece6d8;
          --c1-bg: #ece6d8;
          --c2-bg: ${c2BgColor};
          --c2-text: ${c2TextColor};
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
          padding: clamp(16px, 2.8vw, 24px);
          margin-bottom: 28px;
          box-shadow: 0 14px 40px rgba(42, 42, 39, 0.14), 0 2px 10px rgba(0, 0, 0, 0.05);
          transform: translate3d(0, 0, 0);
          will-change: transform;
          contain: paint layout;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          min-height: calc(100dvh - 44px);
          max-height: calc(100dvh - 44px);
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
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
          justify-content: space-between;
        }

        .sc-2 {
          --n: 1;
          top: calc(22px + var(--n) * 18px);
          background: var(--c2-bg);
          color: var(--c2-text);
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
          justify-content: space-between;
        }

        /* Responsive Mobile Clearance (Guaranteed 5-6mm breathing room top and bottom) */
        @media (max-width: 640px) {
          .stack-wrap {
            padding: 16px 8px 80px;
          }
          .stack-card {
            padding: 14px 14px;
            border-radius: 20px;
            min-height: calc(100dvh - 36px);
            max-height: calc(100dvh - 36px);
          }
          .stack-portrait {
            max-height: min(22dvh, 160px) !important;
            max-width: 240px !important;
            margin-bottom: 8px !important;
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
          opacity: 0.88;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .stack-card .stack-bio {
          font-size: 0.88rem;
          line-height: 1.5;
          opacity: 0.9;
          max-width: 520px;
        }

        .stack-section-title {
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-bottom: 14px;
          font-weight: 700;
          opacity: 0.88;
        }

        /* Card 1 Hero Portrait - Authentic aspect ratio that preserves logos & photos */
        .stack-portrait {
          width: 100%;
          aspect-ratio: 16 / 10;
          max-height: min(26dvh, 200px);
          max-width: 290px;
          margin: 0 auto 12px;
          border-radius: 18px;
          background: #ffffff;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.06);
        }

        .stack-portrait img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 12px;
          display: block;
        }

        .stack-portrait-placeholder {
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6a6458;
          font-weight: 700;
        }

        /* Transparent Swipe Cue (Circular Icon Only) */
        .stack-swipe-cue {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          margin: 14px auto 2px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.14);
          color: #171714;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .stack-swipe-cue:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #171714;
          transform: translateY(-2px);
        }

        .stack-swipe-cue .stack-swipe-icon {
          animation: stackSwipeFloat 2s infinite ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .stack-swipe-cue .stack-swipe-icon,
          .stack-card {
            animation: none !important;
            transition: none !important;
          }
        }

        @keyframes stackSwipeFloat {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-4px);
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
          opacity: 0.9;
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
          <div className="stack-card-content">
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

            {bio && <p className="stack-bio">{bio}</p>}

            {/* Open To Intent Badges (if available) */}
            {normalized.sectionVisibility.openTo && normalized.openTo.length > 0 && (
              <div className="mt-4 pt-3 border-t border-black/10">
                <OpenToBadges intents={normalized.openTo} accentColor="#171714" variant="light" />
              </div>
            )}
          </div>

          {/* Transparent Swipe Cue (Card 1 discovery only, no text clutter) */}
          <div
            className="stack-swipe-cue"
            onClick={() => scrollToCard(2)}
            role="button"
            tabIndex={0}
            title="Swipe up to explore"
            aria-label="Swipe to view more"
          >
            <svg
              className="stack-swipe-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="7 14 12 9 17 14" />
              <polyline points="7 19 12 14 17 19" />
            </svg>
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
        </section>

        {/* ── CARD 3: SERVICES, METRICS & LATEST DISPATCH ─────────── */}
        {(proofs.length > 0 || (normalized.sectionVisibility.recentActivity && normalized.recentActivity)) && (
          <section className="stack-card sc-3" aria-label="Highlights and Milestones">
            <h2 className="stack-section-title">Highlights & Milestones</h2>

            {proofs.length > 0 && (
              <ul className="stack-service-list">
                {proofs.map((proof, idx) => (
                  <li key={proof.id || idx} className="stack-service-row">
                    <b>{proof.label}</b>
                    <span>{proof.value}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Seamless Native Recent Activity Embedding */}
            {normalized.sectionVisibility.recentActivity && normalized.recentActivity && (
              <div className="mt-5 pt-4 border-t border-black/15">
                <RecentActivitySection
                  activity={normalized.recentActivity}
                  variant="stack"
                  isDark={false}
                  accentColor="#171714"
                  autoScroll={!isPreview}
                />
              </div>
            )}
          </section>
        )}

        {/* ── CARD 4: ACTION DOCK & CONTACT MATRIX ───────────────── */}
        <section className="stack-card sc-4" aria-label="Contact and Actions">
          <h2 className="stack-section-title" style={{ color: 'rgba(236, 230, 216, 0.9)' }}>
            Initiate Contact
          </h2>

          <nav className="stack-action-dock">
            {normalized.sectionVisibility.contact && normalized.hasContactChannel && (
              <button
                type="button"
                className="stack-action-btn"
                onClick={openContact}
              >
                <Mail size={15} aria-hidden="true" />
                <span>Connect</span>
              </button>
            )}

            {numericPhone && (
              <a href={`tel:${numericPhone}`} className="stack-action-btn" title="Call directly">
                <Phone size={15} aria-hidden="true" />
                <span>Call</span>
              </a>
            )}

            {email && (
              <a href={`mailto:${email}`} className="stack-action-btn" title="Send email">
                <Mail size={15} aria-hidden="true" />
                <span>Email</span>
              </a>
            )}

            {cleanWaNumber && (
              <a
                href={`https://wa.me/${cleanWaNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="stack-action-btn"
                title="Chat on WhatsApp"
                onClick={() => onLinkClick?.({ id: 'whatsapp', label: 'WhatsApp', url: `https://wa.me/${cleanWaNumber}`, icon: null, clicks: 0, order: 0, isVisible: true })}
              >
                <MessageCircle size={15} aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Save Contact (vCard) */}
            <button
              type="button"
              className="stack-action-btn"
              onClick={handleSaveContact}
              title="Download vCard contact file"
            >
              <Download size={15} aria-hidden="true" />
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
                  onClick={() => onLinkClick?.({ id: `soc-${soc.platform}`, label: soc.label, url: soc.url, icon: null, clicks: 0, order: 0, isVisible: true })}
                >
                  <SocialIcon label={soc.label} url={soc.url} className="w-3.5 h-3.5 fill-current" />
                  <span>{soc.label}</span>
                </a>
              ))}
            </div>
          )}

          <footer className="mt-6 pt-3 text-[12px] text-[#ece6d8]/85 flex items-center justify-between">
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

export function StackTemplate(props: TemplateProps) {
  return (
    <ProfileTemplateShell
      profile={props.profile}
      surfaceHex="#ece6d8"
      defaultAccent="#c4693f"
      isPreview={props.isPreview}
    >
      <StackTemplateInner {...props} />
    </ProfileTemplateShell>
  );
}

export default StackTemplate;

