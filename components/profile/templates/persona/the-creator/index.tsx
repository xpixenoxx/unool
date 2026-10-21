'use client';

import { useState, useRef } from 'react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon as getSharedLinkIcon } from '@/components/profile/templates/utils/socialIcons';
import type { TemplateProps } from '@/components/profile/templates/types';

interface CreatorTemplateProps extends TemplateProps {}

export function CreatorTemplate({ profile, accentColor }: CreatorTemplateProps) {
  const accent = accentColor || '#F97316';
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    .creator-wrap {
      --accent: ${accent};
      --accent-rgb: 249, 115, 22;
      --bg: #0F0F0F;
      --text: #FAFAFA;
      --text-2: #A3A3A3;
      --muted: #1A1A1A;
      --card: #141414;
      --border: #2A2A2A;

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

    .creator-grid {
      position: absolute;
      width: 200vw; height: 200vh;
      top: -50%; left: -50%;
      background-image:
        linear-gradient(rgba(var(--accent-rgb), 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--accent-rgb), 0.04) 1px, transparent 1px);
      background-size: 80px 80px;
      animation: creator-grid-move 60s linear infinite;
      z-index: 0;
      pointer-events: none;
    }
    @keyframes creator-grid-move {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(160px) rotate(5deg); }
    }

    .creator-glow {
      position: absolute;
      width: 700px; height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(var(--accent-rgb), 0.2) 0%, transparent 70%);
      opacity: 0.4;
      filter: blur(120px);
      z-index: 0;
      pointer-events: none;
      transition: transform 0.4s ease-out;
    }

    .creator-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1200px;
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    .creator-card {
      background: linear-gradient(145deg, var(--card), var(--muted));
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 64px;
      box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.4),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
    }

    .creator-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg,
        transparent 20%,
        rgba(var(--accent-rgb), 0.12) 30%,
        rgba(255, 255, 255, 0.15) 40%,
        rgba(var(--accent-rgb), 0.12) 50%,
        transparent 60%
      );
      background-size: 300% 300%;
      animation: creator-shimmer 8s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: color-dodge;
    }
    @keyframes creator-shimmer {
      0% { background-position: 100% 100%; }
      100% { background-position: 0% 0%; }
    }

    .creator-corner {
      position: absolute;
      width: 24px; height: 24px;
      border: 3px solid var(--accent);
      opacity: 0.5;
      z-index: 2;
    }
    .creator-corner-tl { top: 20px; left: 20px; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
    .creator-corner-tr { top: 20px; right: 20px; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
    .creator-corner-bl { bottom: 20px; left: 20px; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
    .creator-corner-br { bottom: 20px; right: 20px; border-left: none; border-top: none; border-radius: 0 0 4px 0; }

    .creator-inner {
      display: flex;
      gap: 60px;
      transform: translateZ(40px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 860px) {
      .creator-inner { flex-direction: column; text-align: center; gap: 40px; }
      .creator-card { padding: 40px 24px; border-radius: 32px; }
      .creator-avatar-wrap { margin: 0 auto; }
    }

    .creator-avatar-wrap {
      position: relative;
      width: 200px; height: 200px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(60px);
    }
    .creator-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid var(--accent);
      box-shadow:
        0 20px 40px rgba(var(--accent-rgb), 0.3),
        inset 0 0 0 2px rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 5;
      animation: creator-pulse 4s ease-in-out infinite;
    }
    @keyframes creator-pulse {
      0%, 100% { box-shadow: 0 20px 40px rgba(var(--accent-rgb), 0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.1); }
      50% { box-shadow: 0 25px 50px rgba(var(--accent-rgb), 0.5), inset 0 0 0 4px rgba(255, 255, 255, 0.2); }
    }
    .creator-ring {
      position: absolute;
      inset: -20px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(var(--accent-rgb), 0.4), transparent);
      animation: creator-spin-ring 8s linear infinite;
      z-index: -1;
      filter: blur(6px);
    }
    .creator-ring-2 {
      position: absolute;
      inset: -40px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent, rgba(var(--accent-rgb), 0.2), transparent);
      animation: creator-spin-ring 12s linear infinite reverse;
      z-index: -2;
      filter: blur(8px);
    }
    @keyframes creator-spin-ring {
      to { transform: rotate(360deg); }
    }
    .creator-avatar-placeholder {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #FB923C);
      display: flex; align-items: center; justify-content: center;
      color: #0F0F0F; font-family: 'Syne', sans-serif;
      font-size: 5rem; font-weight: 800;
    }

    .creator-content {
      flex: 1;
      transform-style: preserve-3d;
    }
    .creator-name {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2.5rem, 5vw, 5rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      background: linear-gradient(135deg, var(--accent), #FB923C);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
      transform: translateZ(50px);
      line-height: 1.05;
    }
    .creator-role {
      font-family: 'Syne', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 24px;
      display: inline-block;
      padding: 12px 32px;
      background: rgba(var(--accent-rgb), 0.1);
      border-radius: 100px;
      border: 2px solid var(--accent);
      transform: translateZ(40px);
      animation: creator-border-pulse 3s ease-in-out infinite;
    }
    @keyframes creator-border-pulse {
      0%, 100% { border-color: var(--accent); }
      50% { border-color: #FB923C; }
    }
    .creator-bio {
      font-size: 1.15rem;
      line-height: 1.8;
      color: var(--text-2);
      max-width: 550px;
      font-weight: 400;
      transform: translateZ(30px);
    }

    .creator-data {
      display: flex;
      gap: 16px;
      margin-top: 40px;
      transform: translateZ(35px);
      flex-wrap: wrap;
    }
    .creator-data-box {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      padding: 24px 32px;
      border-radius: 16px;
      min-width: 160px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .creator-data-box:hover {
      box-shadow:
        0 20px 40px -10px rgba(var(--accent-rgb), 0.3),
        inset 0 4px 10px rgba(255, 255, 255, 0.05);
      transform: translateY(-8px) scale(1.02);
      border-color: var(--accent);
    }
    .creator-data-val {
      font-family: 'Syne', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--accent);
      line-height: 1.1;
    }
    .creator-data-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-2);
      opacity: 0.8;
      margin-top: 8px;
      font-weight: 600;
    }

    .creator-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-top: 50px;
      transform: translateZ(45px);
    }
    .creator-link {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text);
      font-family: 'Syne', sans-serif;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-decoration: none;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
      overflow: hidden;
    }
    .creator-link:hover {
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05));
      transform: translateY(-6px);
      box-shadow:
        0 20px 40px -10px rgba(var(--accent-rgb), 0.3),
        inset 0 3px 8px rgba(255, 255, 255, 0.05);
      color: var(--accent);
      border-color: var(--accent);
    }
    .creator-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.2), transparent);
      transition: left 0.6s ease;
      mix-blend-mode: overlay;
    }
    .creator-link:hover::after { left: 100%; }
    .creator-link-left { display: flex; align-items: center; gap: 14px; }
    .creator-link-icon {
      width: 48px; height: 48px;
      border-radius: 14px;
      background: rgba(var(--accent-rgb), 0.15);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent);
      transition: all 0.3s;
    }
    .creator-link:hover .creator-link-icon { background: var(--accent); color: #0F0F0F; }
    .creator-link-arrow { color: var(--accent); font-size: 1.6rem; transition: transform 0.3s; }
    .creator-link:hover .creator-link-arrow { transform: translateX(8px) scale(1.1); }

    .creator-conversation-btn {
      display: inline-block;
      margin-top: 30px;
      padding: 18px 40px;
      background: var(--accent);
      color: #0F0F0F;
      font-family: 'Syne', sans-serif;
      font-size: 1.2rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-radius: 50px;
      text-decoration: none;
      box-shadow: 0 15px 35px rgba(var(--accent-rgb), 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .creator-conversation-btn:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 25px 50px rgba(var(--accent-rgb), 0.5);
      background: #FB923C;
    }

    .creator-float-shape {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05));
      box-shadow:
        0 10px 30px rgba(var(--accent-rgb), 0.15),
        inset 0 5px 15px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px) saturate(150%);
    }
    .cr-shape-1 {
      top: -50px; right: -30px;
      width: 120px; height: 120px;
      border: 3px solid var(--accent);
      border-radius: 24px;
      animation: creator-spin-3d 12s ease-in-out infinite alternate;
    }
    .cr-shape-2 {
      bottom: -50px; left: -30px;
      width: 100px; height: 100px;
      border: 3px dashed rgba(var(--accent-rgb), 0.5);
      border-radius: 50%;
      animation: creator-spin-3d 18s ease-in-out infinite alternate-reverse;
    }
    @keyframes creator-spin-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-30px) scale(1.05) rotate(45deg); }
    }

    .creator-particle {
      position: absolute;
      width: 4px; height: 4px;
      background: var(--accent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 2;
      opacity: 0.6;
      animation: creator-particle-float 6s ease-in-out infinite;
    }
    .creator-particle-1 { top: 20%; left: 10%; animation-delay: 0s; }
    .creator-particle-2 { top: 30%; right: 15%; animation-delay: 1s; }
    .creator-particle-3 { bottom: 35%; left: 8%; animation-delay: 2s; }
    .creator-particle-4 { bottom: 20%; right: 10%; animation-delay: 3s; }
    @keyframes creator-particle-float {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
      50% { transform: translateY(-40px) scale(1.5); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .creator-grid, .creator-ring, .creator-ring-2, .creator-float-shape, .creator-particle,
      .creator-avatar, .creator-role { animation: none !important; transition: none !important; }
    }
  `;

  return (
    <div
      className="creator-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="creator-grid" />
      <div
        className="creator-glow"
        style={{ transform: `translate(${mouse.x * 250}px, ${mouse.y * 250}px)` }}
      />

      <div
        className="creator-container"
        style={{
          transform: `rotateY(${mouse.x * 10}deg) rotateX(${mouse.y * -10}deg)`
        }}
      >
        <div className="creator-float-shape cr-shape-1" />
        <div className="creator-float-shape cr-shape-2" />

        <span className="creator-particle creator-particle-1" />
        <span className="creator-particle creator-particle-2" />
        <span className="creator-particle creator-particle-3" />
        <span className="creator-particle creator-particle-4" />

        <div className="creator-card">
          <div className="creator-corner creator-corner-tl" />
          <div className="creator-corner creator-corner-tr" />
          <div className="creator-corner creator-corner-bl" />
          <div className="creator-corner creator-corner-br" />

          <div className="creator-inner">
            <div className="creator-avatar-wrap">
              <div className="creator-ring" />
              <div className="creator-ring-2" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="creator-avatar" />
              ) : (
                <div className="creator-avatar-placeholder">{profile.name?.charAt(0) || 'C'}</div>
              )}
            </div>

            <div className="creator-content">
              <h1 className="creator-name">{profile.name}</h1>
              <div className="creator-role">{profile.headline}</div>
              <p className="creator-bio">{profile.bio}</p>

              <a
                href={profile.email ? `mailto:${profile.email}` : '#'}
                className="creator-conversation-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <span>✉</span> Get in Touch
              </a>

              {(profile.theme as any)?.conversationUrl && (
                <a
                  href={(profile.theme as any).conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="creator-conversation-btn"
                >
                  Start a Conversation
                </a>
              )}

              {profile.proofs && profile.proofs.length > 0 ? (
                <div className="creator-data">
                  {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                    <div key={i} className="creator-data-box">
                      <div className="creator-data-val">{proof.value}</div>
                      <div className="creator-data-label">{proof.title || proof.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="creator-data">
                  {profile.role && (
                    <div className="creator-data-box">
                      <div className="creator-data-val">ROLE</div>
                      <div className="creator-data-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="creator-data-box">
                      <div className="creator-data-val">ORG</div>
                      <div className="creator-data-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="creator-data-box">
                      <div className="creator-data-val">LOC</div>
                      <div className="creator-data-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="creator"
                accentColor={accent}
                autoScroll={profile.autoScroll}
              />

              {profile.links && profile.links.length > 0 && (
                <div className="creator-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="creator-link">
                      <div className="creator-link-left">
                        <div className="creator-link-icon">
                          {getSharedLinkIcon(link.label, link.url)}
                        </div>
                        <span>{link.label}</span>
                      </div>
                      <span className="creator-link-arrow">→</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}