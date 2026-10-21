'use client';

import { useState, useRef, useEffect } from 'react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon as getSharedLinkIcon } from '@/components/profile/templates/utils/socialIcons';
import type { TemplateProps } from '@/components/profile/templates/types';

interface LoverTemplateProps extends TemplateProps {}

export function LoverTemplate({ profile, accentColor }: LoverTemplateProps) {
  const accent = accentColor || '#E85D75';
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sparkleRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  };

  const handleMouseLeave = () => {
    setMouse({ x: 0, y: 0 });
  };

  // Gentle sparkle animation
  useEffect(() => {
    const sparkles = sparkleRefs.current.filter(Boolean) as HTMLSpanElement[];
    const animations: number[] = [];
    sparkles.forEach((sparkle, i) => {
      const anim = requestAnimationFrame(function animate() {
        const tx = (Math.random() - 0.5) * 40;
        const ty = (Math.random() - 0.5) * 40;
        const scale = 0.5 + Math.random() * 0.5;
        sparkle.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        sparkle.style.opacity = (0.3 + Math.random() * 0.5).toString();
        animations.push(requestAnimationFrame(animate));
      });
    });
    return () => animations.forEach(cancelAnimationFrame);
  }, []);

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    .lover-wrap {
      --accent: ${accent};
      --accent-rgb: 232, 93, 117;
      --bg: #FFF8F6;
      --text: #2D1B1B;
      --text-2: #6B4A4A;
      --muted: #F5E6E0;
      --card: #FFFFFF;
      --border: #F0D8D0;

      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow-x: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    /* Ambient Blobs */
    .lover-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.5;
      transition: transform 0.6s ease-out;
    }
    .lover-blob-1 {
      width: 500px; height: 500px;
      top: -100px; right: -100px;
      background: radial-gradient(circle, rgba(var(--accent-rgb), 0.4) 0%, transparent 70%);
    }
    .lover-blob-2 {
      width: 400px; height: 400px;
      bottom: -80px; left: -80px;
      background: radial-gradient(circle, rgba(232, 150, 120, 0.35) 0%, transparent 70%);
    }

    /* Floating Hearts */
    .lover-heart {
      position: absolute;
      font-size: 1.5rem;
      opacity: 0.15;
      pointer-events: none;
      animation: lover-float 8s ease-in-out infinite;
      z-index: 1;
      font-family: serif;
      speak: none;
    }
    .lover-heart-1 { top: 15%; left: 8%; animation-delay: 0s; }
    .lover-heart-2 { top: 25%; right: 10%; animation-delay: 1.5s; font-size: 1rem; }
    .lover-heart-3 { bottom: 30%; left: 5%; animation-delay: 3s; font-size: 2rem; }
    .lover-heart-4 { bottom: 20%; right: 5%; animation-delay: 4.5s; font-size: 1.2rem; }
    @keyframes lover-float {
      0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
      50% { transform: translateY(-20px) rotate(10deg) scale(1.1); }
    }

    /* Sparkles */
    .lover-sparkle {
      position: absolute;
      font-size: 0.7rem;
      color: var(--accent);
      pointer-events: none;
      z-index: 2;
      animation: lover-sparkle 3s ease-in-out infinite;
      speak: none;
    }
    .lover-sparkle-1 { top: 12%; left: 15%; animation-delay: 0s; }
    .lover-sparkle-2 { top: 18%; right: 12%; animation-delay: 0.5s; }
    .lover-sparkle-3 { bottom: 25%; left: 10%; animation-delay: 1s; }
    .lover-sparkle-4 { bottom: 15%; right: 8%; animation-delay: 1.5s; }
    @keyframes lover-sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
      50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
    }

    /* Main Container */
    .lover-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1100px;
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    /* Paper Card */
    .lover-card {
      background: var(--card);
      border-radius: 32px;
      padding: 64px;
      box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.04),
        inset 0 0 0 1px rgba(0, 0, 0, 0.02);
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    /* Subtle foil shimmer */
    .lover-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg,
        transparent 20%,
        rgba(var(--accent-rgb), 0.08) 30%,
        rgba(255, 255, 255, 0.5) 40%,
        rgba(var(--accent-rgb), 0.08) 50%,
        transparent 60%
      );
      background-size: 300% 300%;
      animation: lover-shimmer 8s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 1;
    }
    @keyframes lover-shimmer {
      0% { background-position: 100% 100%; }
      100% { background-position: 0% 0%; }
    }

    /* Decorative Corner Accents */
    .lover-corner {
      position: absolute;
      width: 2px; height: 2px;
      background: var(--accent);
      opacity: 0.3;
      z-index: 2;
    }
    .lover-corner-tl { top: 32px; left: 32px; }
    .lover-corner-tr { top: 32px; right: 32px; }
    .lover-corner-bl { bottom: 32px; left: 32px; }
    .lover-corner-br { bottom: 32px; right: 32px; }
    .lover-corner::before, .lover-corner::after {
      content: ""; position: absolute;
      width: 2px; height: 20px;
      background: var(--accent);
      opacity: 0.2;
    }
    .lover-corner-tl::before { top: -20px; left: 0; }
    .lover-corner-tl::after { top: 0; left: -20px; }
    .lover-corner-tr::before { top: -20px; right: 0; }
    .lover-corner-tr::after { top: 0; right: -20px; }
    .lover-corner-bl::before { bottom: -20px; left: 0; }
    .lover-corner-bl::after { bottom: 0; left: -20px; }
    .lover-corner-br::before { bottom: -20px; right: 0; }
    .lover-corner-br::after { bottom: 0; right: -20px; }

    /* Layout inside card */
    .lover-inner {
      display: flex;
      gap: 60px;
      transform: translateZ(20px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 860px) {
      .lover-inner { flex-direction: column; text-align: center; gap: 40px; }
      .lover-card { padding: 40px 24px; border-radius: 28px; }
      .lover-avatar-wrap { margin: 0 auto; }
    }

    /* Avatar */
    .lover-avatar-wrap {
      position: relative;
      width: 160px; height: 160px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(40px);
    }
    .lover-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #fff;
      box-shadow:
        0 15px 35px rgba(var(--accent-rgb), 0.15),
        inset 0 0 0 2px rgba(var(--accent-rgb), 0.1);
      position: relative;
      z-index: 5;
    }
    .lover-ring {
      position: absolute;
      inset: -12px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(var(--accent-rgb), 0.25), transparent);
      animation: lover-spin-ring 12s linear infinite;
      z-index: -1;
      filter: blur(3px);
    }
    .lover-ring-2 {
      position: absolute;
      inset: -24px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent, rgba(232, 150, 120, 0.2), transparent);
      animation: lover-spin-ring 18s linear infinite reverse;
      z-index: -2;
      filter: blur(5px);
    }
    @keyframes lover-spin-ring {
      to { transform: rotate(360deg); }
    }
    .lover-avatar-placeholder {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #E89678);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-family: 'DM Serif Display', serif;
      font-size: 3.5rem; font-weight: 400;
    }

    /* Text */
    .lover-content {
      flex: 1;
      transform-style: preserve-3d;
    }
    .lover-name {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(2.5rem, 5vw, 4.5rem);
      font-weight: 400;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--accent), #E89678);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
      transform: translateZ(30px);
      line-height: 1.1;
    }
    .lover-role {
      font-family: 'DM Serif Display', serif;
      font-size: 1.3rem;
      font-weight: 400;
      font-style: italic;
      color: var(--text-2);
      margin-bottom: 24px;
      display: inline-block;
      padding: 8px 24px;
      background: rgba(var(--accent-rgb), 0.08);
      border-radius: 100px;
      border: 1px solid rgba(var(--accent-rgb), 0.15);
      transform: translateZ(25px);
    }
    .lover-bio {
      font-size: 1.1rem;
      line-height: 1.8;
      color: var(--text-2);
      max-width: 550px;
      font-weight: 400;
      transform: translateZ(20px);
    }

    /* Data Points */
    .lover-data {
      display: flex;
      gap: 16px;
      margin-top: 40px;
      transform: translateZ(25px);
      flex-wrap: wrap;
    }
    .lover-data-box {
      background: var(--muted);
      border: 1px solid var(--border);
      padding: 20px 28px;
      border-radius: 16px;
      min-width: 140px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .lover-data-box:hover {
      transform: translateY(-6px) scale(1.02);
      border-color: rgba(var(--accent-rgb), 0.4);
      box-shadow: 0 15px 30px -5px rgba(var(--accent-rgb), 0.15);
    }
    .lover-data-val {
      font-family: 'DM Serif Display', serif;
      font-size: 2rem;
      font-weight: 400;
      color: var(--accent);
      line-height: 1.2;
    }
    .lover-data-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-2);
      opacity: 0.8;
      margin-top: 6px;
      font-weight: 500;
    }

    /* Links Grid */
    .lover-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 48px;
      transform: translateZ(30px);
    }
    .lover-link {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text);
      font-weight: 500;
      text-decoration: none;
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
      overflow: hidden;
    }
    .lover-link:hover {
      background: var(--muted);
      transform: translateY(-4px);
      border-color: rgba(var(--accent-rgb), 0.3);
      box-shadow: 0 15px 30px -5px rgba(var(--accent-rgb), 0.1);
      color: var(--accent);
    }
    .lover-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.1), transparent);
      transition: left 0.5s ease;
    }
    .lover-link:hover::after { left: 100%; }
    .lover-link-left { display: flex; align-items: center; gap: 12px; }
    .lover-link-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: var(--muted);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-2);
      transition: all 0.3s;
    }
    .lover-link:hover .lover-link-icon {
      background: var(--accent);
      color: #fff;
    }
    .lover-link-arrow {
      color: var(--accent);
      font-size: 1.2rem;
      transition: transform 0.3s;
    }
    .lover-link:hover .lover-link-arrow {
      transform: translateX(5px);
    }

    /* CTA */
    .lover-cta {
      margin-top: 56px;
      padding: 32px;
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.12), rgba(232, 150, 120, 0.1));
      border-radius: 24px;
      border: 1px solid rgba(var(--accent-rgb), 0.2);
      text-align: center;
      transform: translateZ(15px);
    }
    .lover-cta-text {
      font-family: 'DM Serif Display', serif;
      font-size: 1.5rem;
      color: var(--text);
      margin-bottom: 8px;
    }
    .lover-cta-sub {
      color: var(--text-2);
      margin-bottom: 20px;
    }
    .lover-cta-btn {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 32px; border-radius: 100px;
      background: var(--accent); color: #fff;
      font-weight: 600; font-size: 0.95rem;
      text-decoration: none;
      box-shadow: 0 8px 20px rgba(var(--accent-rgb), 0.3);
      transition: all 0.3s;
    }
    .lover-cta-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 30px rgba(var(--accent-rgb), 0.4);
    }

    /* Floating ornamental shapes */
    .lover-float-shape {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.1), rgba(232, 150, 120, 0.1));
      box-shadow:
        0 10px 30px rgba(var(--accent-rgb), 0.08),
        inset 0 5px 15px rgba(255, 255, 255, 1);
      backdrop-filter: blur(10px) saturate(150%);
    }
    .l-shape-1 {
      top: -30px; right: -10px;
      width: 80px; height: 80px;
      border: 2px solid rgba(var(--accent-rgb), 0.2);
      border-radius: 16px;
      animation: lover-spin-3d 12s ease-in-out infinite alternate;
    }
    .l-shape-2 {
      bottom: -30px; left: -10px;
      width: 60px; height: 60px;
      border: 2px dashed rgba(232, 150, 120, 0.3);
      animation: lover-spin-3d 18s ease-in-out infinite alternate-reverse;
    }
    @keyframes lover-spin-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-15px) scale(1.03) rotate(20deg); }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .lover-blob, .lover-heart, .lover-sparkle, .lover-ring, .lover-ring-2,
      .lover-float-shape { animation: none !important; transition: none !important; }
    }

    /* Focus styles for accessibility */
    .lover-link:focus-visible,
    .lover-cta-btn:focus-visible,
    .lover-conversation-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `;

  const getLinkSubtitle = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('github')) return 'Code & Repos';
    if (lower.includes('linkedin')) return 'Professional';
    if (lower.includes('instagram')) return 'Visual Stories';
    if (lower.includes('twitter') || lower.includes('x.com')) return 'Thoughts';
    return 'External Link';
  };

  return (
    <div
      className="lover-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* Ambient Background */}
      <div className="lover-blob lover-blob-1" style={{ transform: `translate(${mouse.x * 80}px, ${mouse.y * 80}px)` }} />
      <div className="lover-blob lover-blob-2" style={{ transform: `translate(${mouse.x * -60}px, ${mouse.y * -60}px)` }} />

      {/* Floating Hearts */}
      <span aria-hidden="true" className="lover-heart lover-heart-1">♡</span>
      <span aria-hidden="true" className="lover-heart lover-heart-2">♥</span>
      <span aria-hidden="true" className="lover-heart lover-heart-3">♡</span>
      <span aria-hidden="true" className="lover-heart lover-heart-4">♥</span>

      {/* Sparkles */}
      <span aria-hidden="true" className="lover-sparkle lover-sparkle-1" ref={(el) => { sparkleRefs.current[0] = el; }}>✦</span>
      <span aria-hidden="true" className="lover-sparkle lover-sparkle-2" ref={(el) => { sparkleRefs.current[1] = el; }}>✦</span>
      <span aria-hidden="true" className="lover-sparkle lover-sparkle-3" ref={(el) => { sparkleRefs.current[2] = el; }}>✦</span>
      <span aria-hidden="true" className="lover-sparkle lover-sparkle-4" ref={(el) => { sparkleRefs.current[3] = el; }}>✦</span>

      <div
        className="lover-container"
        style={{
          transform: `rotateY(${mouse.x * 8}deg) rotateX(${mouse.y * -8}deg)`
        }}
      >
        <div className="lover-float-shape l-shape-1" />
        <div className="lover-float-shape l-shape-2" />

        <div className="lover-card">
          <div className="lover-corner lover-corner-tl" />
          <div className="lover-corner lover-corner-tr" />
          <div className="lover-corner lover-corner-bl" />
          <div className="lover-corner lover-corner-br" />

          <div className="lover-inner">
            {/* Avatar */}
            <div className="lover-avatar-wrap">
              <div className="lover-ring" />
              <div className="lover-ring-2" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="lover-avatar" />
              ) : (
                <div className="lover-avatar-placeholder">{profile.name?.charAt(0) || 'L'}</div>
              )}
            </div>

            {/* Content */}
            <div className="lover-content">
              <h1 className="lover-name">{profile.name}</h1>
              <div className="lover-role">{profile.headline}</div>
              <p className="lover-bio">{profile.bio}</p>

              {/* Get in Touch CTA */}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="lover-cta-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
                >
                  <span aria-hidden="true">✉</span> Get in Touch
                </a>
              )}

              {/* Conversation Button */}
              {(profile.theme as any)?.conversationUrl && (
                <a
                  href={(profile.theme as any).conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lover-cta-btn"
                >
                  Start a Conversation
                </a>
              )}

              {/* Dynamic Stats/Proofs */}
              {profile.proofs && profile.proofs.length > 0 ? (
                <div className="lover-data">
                  {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                    <div key={i} className="lover-data-box">
                      <div className="lover-data-val">{proof.value}</div>
                      <div className="lover-data-label">{proof.title || proof.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lover-data">
                  {profile.role && (
                    <div className="lover-data-box">
                      <div className="lover-data-val">ROLE</div>
                      <div className="lover-data-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="lover-data-box">
                      <div className="lover-data-val">ORG</div>
                      <div className="lover-data-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="lover-data-box">
                      <div className="lover-data-val">LOC</div>
                      <div className="lover-data-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="lover"
                autoScroll={profile.autoScroll}
              />

              {/* Links */}
              {profile.links && profile.links.length > 0 && (
                <div className="lover-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="lover-link">
                      <div className="lover-link-left">
                        <div className="lover-link-icon">
                          {getSharedLinkIcon(link.label, link.url, link.icon, 'w-4 h-4')}
                        </div>
                        <div>
                          <div className="lover-link-title">{link.label}</div>
                          <div className="lover-link-sub">{getLinkSubtitle(link.label)}</div>
                        </div>
                      </div>
                      <span className="lover-link-arrow">→</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          {(profile.links?.length > 0 || profile.email) && (
            <div className="lover-cta">
              <div className="lover-cta-text">Let's Create Something Beautiful Together</div>
              <div className="lover-cta-sub">Open to collaborations, commissions, and meaningful conversations.</div>
              {profile.email ? (
                <a className="lover-cta-btn" href={`mailto:${profile.email}`}>
                  Get in Touch <span aria-hidden="true">→</span>
                </a>
              ) : profile.links?.[0]?.url ? (
                <a
                  className="lover-cta-btn"
                  href={profile.links[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get in Touch <span aria-hidden="true">→</span>
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}