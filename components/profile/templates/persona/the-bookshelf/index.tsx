'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { TemplateProps, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { SocialIcon, normalizeSocialPlatform } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { Phone, Mail, MessageCircle, Download, MapPin, ExternalLink } from 'lucide-react';

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
  { bg: '#7a2e2e', fg: '#f4ead7', height: 262 }, // Burgundy
  { bg: '#2e4a3f', fg: '#f4ead7', height: 284 }, // Hunter Green
  { bg: '#c98f2b', fg: '#2b2118', height: 236 }, // Ochre
  { bg: '#1f3550', fg: '#f4ead7', height: 226 }, // Midnight Navy
  { bg: '#6b4a32', fg: '#f4ead7', height: 274 }, // Leather Walnut
  { bg: '#4b5d67', fg: '#f4ead7', height: 248 }, // Slate Teal
  { bg: '#8a8f98', fg: '#1d1d1d', height: 268 }, // Ash Grey
  { bg: '#d8c9a0', fg: '#2b2118', height: 242 }, // Parchment Gold
  { bg: '#3a3a3a', fg: '#f4ead7', height: 256 }, // Charcoal
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

        /* ── Bookshelf & Vertical Spines ── */
        .bs-shelf-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--bs-wood);
          margin-bottom: 8px;
        }

        .bs-shelf {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          overflow-x: auto;
          padding: 50px 20px 0;
          border-bottom: 16px solid var(--bs-wood);
          box-shadow: 0 14px 22px -6px rgba(0, 0, 0, 0.35);
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

        .bs-spine {
          position: relative;
          flex: none;
          width: 64px;
          align-self: flex-end;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0 18px;
          border-radius: 4px 4px 0 0;
          text-decoration: none;
          box-shadow: inset -6px 0 8px rgba(0, 0, 0, 0.25), inset 3px 0 3px rgba(255, 255, 255, 0.12), 0 4px 10px rgba(0,0,0,0.15);
          transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.26s ease;
          cursor: pointer;
        }

        .bs-spine::before,
        .bs-spine::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(244, 234, 215, 0.45);
        }
        .bs-spine::before { top: 44px; }
        .bs-spine::after { bottom: 44px; }

        .bs-spine:hover,
        .bs-spine:focus-visible {
          transform: translateY(-18px);
          box-shadow: inset -6px 0 8px rgba(0, 0, 0, 0.2), 0 12px 24px rgba(0,0,0,0.3);
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
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: 160px;
        }

        .bs-spine-verb {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--bs-text);
          color: #f4ead7;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .bs-spine:hover .bs-spine-verb,
        .bs-spine:focus-visible .bs-spine-verb {
          opacity: 1;
          transform: translateX(-50%) translateY(-3px);
        }

        .bs-shelf-hint {
          font-size: 13px;
          font-style: italic;
          opacity: 0.75;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Services Bookplate ── */
        .bs-services {
          background: #2b2118;
          color: #e8d9b5;
          border: 2px solid var(--bs-gold);
          border-radius: 10px;
          padding: 22px 28px;
          margin-top: 40px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .bs-services h2 {
          font-size: 12px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--bs-gold);
          margin-bottom: 14px;
          font-weight: 700;
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
          font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
          font-size: 21px;
        }

        .bs-service-row:last-child {
          border-bottom: none;
        }

        .bs-service-row span {
          font-family: 'Avenir Next', -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #d9b86c;
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
          opacity: 0.8;
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
          background: var(--bs-text);
          color: #f4ead7;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(0,0,0,0.35);
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

        {/* On The Shelf (Interactive Book Spines) */}
        <p className="bs-shelf-label">On The Shelf</p>
        <section className="bs-shelf" aria-label="Curated book spines">
          {links && links.length > 0 ? (
            links.map((link, idx) => {
              const verb = getBookActionVerb(link.url, link.label);
              const palette = SPINE_PALETTES[idx % SPINE_PALETTES.length];

              return (
                <a
                  key={link.id || idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bs-spine"
                  onClick={() => onLinkClick?.(link)}
                  style={{
                    background: palette.bg,
                    color: palette.fg,
                    height: `${palette.height}px`,
                  }}
                  title={`${link.label} — ${cleanDisplayUrl(link.url)}`}
                >
                  <span className="bs-spine-verb">{verb}</span>
                  <div className="bs-spine-icon">
                    <SocialIcon label={link.label} url={link.url} icon={link.icon || undefined} className="w-4 h-4 fill-current" />
                  </div>
                  <strong className="bs-spine-title">{link.label}</strong>
                  <span style={{ fontSize: '10px', opacity: 0.65, fontWeight: 700 }}>UNO</span>
                </a>
              );
            })
          ) : (
            <div className="py-8 opacity-70 text-sm">
              No active volumes currently on the shelf.
            </div>
          )}
        </section>
        <p className="bs-shelf-hint">Pull a volume from the shelf to open.</p>

        {/* Services & Offerings Bookplate */}
        <section className="bs-services" aria-label="Services and Offerings">
          <h2>Services & Archive</h2>
          {proofs && proofs.length > 0 ? (
            <ul className="bs-service-list">
              {proofs.map((proof, idx) => (
                <li key={proof.id || idx} className="bs-service-row">
                  <b>{proof.title}</b>
                  <span>{proof.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="bs-service-list">
              <li className="bs-service-row">
                <b>Brand Identity & Systems</b>
                <span>From $800</span>
              </li>
              <li className="bs-service-row">
                <b>Editorial Design & Publishing</b>
                <span>From $1,200</span>
              </li>
              <li className="bs-service-row">
                <b>Archival Advisory</b>
                <span>From $600</span>
              </li>
            </ul>
          )}

          {/* Activity Section */}
          {profile?.recentActivity && (
            <div className="mt-5 pt-4 border-t border-[#b8975a]/30">
              <RecentActivitySection
                activity={profile.recentActivity}
                variant="stack"
                isDark={true}
                accentColor="#d9b86c"
                autoScroll={profile.autoScroll}
              />
            </div>
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

          <button type="button" className="bs-action-btn" onClick={handleSaveContact}>
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
