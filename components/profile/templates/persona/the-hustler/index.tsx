'use client';

import { useState, useRef } from 'react';
import { ExternalLink, Github, Linkedin, Instagram } from 'lucide-react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';

interface HustlerTemplateProps {
  profile: any;
  accentColor?: string;
}

export function HustlerTemplate({ profile, accentColor }: HustlerTemplateProps) {
  const accent = accentColor || '#00D4AA';
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
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    .hustler-wrap {
      --accent: ${accent};
      --accent-rgb: 0, 212, 170;
      --bg: #0A0F0D;
      --text: #E8F5F0;
      --text-2: #6FD4B8;
      --muted: #121A16;
      --card: #0E1612;
      --border: #1A2A20;

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

    .hustler-grid {
      position: absolute;
      width: 200vw; height: 200vh;
      top: -50%; left: -50%;
      background-image:
        linear-gradient(rgba(var(--accent-rgb), 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--accent-rgb), 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      animation: hustler-grid-move 80s linear infinite;
      z-index: 0;
      pointer-events: none;
    }
    @keyframes hustler-grid-move {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(120px) rotate(5deg); }
    }

    .hustler-glow {
      position: absolute;
      width: 600px; height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(var(--accent-rgb), 0.2) 0%, transparent 70%);
      opacity: 0.3;
      filter: blur(100px);
      z-index: 0;
      pointer-events: none;
      transition: transform 0.4s ease-out;
    }

    .hustler-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1100px;
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    .hustler-card {
      background: linear-gradient(145deg, var(--card), var(--muted));
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 64px;
      box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.4),
        inset 0 0 0 1px rgba(255, 255, 255, 0.03);
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
    }

    .hustler-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg,
        transparent 20%,
        rgba(var(--accent-rgb), 0.1) 30%,
        rgba(255, 255, 255, 0.1) 40%,
        rgba(var(--accent-rgb), 0.1) 50%,
        transparent 60%
      );
      background-size: 300% 300%;
      animation: hustler-shimmer 10s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: color-dodge;
    }
    @keyframes hustler-shimmer {
      0% { background-position: 100% 100%; }
      100% { background-position: 0% 0%; }
    }

    .hustler-corner {
      position: absolute;
      width: 12px; height: 12px;
      border: 2px solid var(--accent);
      border-radius: 2px;
      opacity: 0.5;
      z-index: 2;
    }
    .hustler-corner-tl { top: 24px; left: 24px; border-right: none; border-bottom: none; }
    .hustler-corner-tr { top: 24px; right: 24px; border-left: none; border-bottom: none; }
    .hustler-corner-bl { bottom: 24px; left: 24px; border-right: none; border-top: none; }
    .hustler-corner-br { bottom: 24px; right: 24px; border-left: none; border-top: none; }

    .hustler-inner {
      display: flex;
      gap: 60px;
      transform: translateZ(40px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 860px) {
      .hustler-inner { flex-direction: column; text-align: center; gap: 40px; }
      .hustler-card { padding: 40px 24px; border-radius: 32px; }
      .hustler-avatar-wrap { margin: 0 auto; }
    }

    .hustler-avatar-wrap {
      position: relative;
      width: 180px; height: 180px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(60px);
    }
    .hustler-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(0, 212, 170, 0.3);
      box-shadow:
        0 15px 35px rgba(var(--accent-rgb), 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 5;
    }
    .hustler-ring {
      position: absolute;
      inset: -15px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(var(--accent-rgb), 0.3), transparent);
      animation: hustler-spin-ring 10s linear infinite;
      z-index: -1;
      filter: blur(4px);
    }
    .hustler-ring-2 {
      position: absolute;
      inset: -30px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent, rgba(var(--accent-rgb), 0.15), transparent);
      animation: hustler-spin-ring 15s linear infinite reverse;
      z-index: -2;
      filter: blur(6px);
    }
    @keyframes hustler-spin-ring {
      to { transform: rotate(360deg); }
    }
    .hustler-avatar-placeholder {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #10B981);
      display: flex; align-items: center; justify-content: center;
      color: #0A0F0D; font-family: 'Space Grotesk', sans-serif;
      font-size: 4rem; font-weight: 700;
    }

    .hustler-content {
      flex: 1;
      transform-style: preserve-3d;
    }
    .hustler-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2.5rem, 5vw, 4.8rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--accent), #34D399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      transform: translateZ(50px);
      line-height: 1.1;
    }
    .hustler-role {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 24px;
      display: inline-block;
      padding: 10px 28px;
      background: rgba(var(--accent-rgb), 0.1);
      border-radius: 100px;
      border: 1px solid rgba(var(--accent-rgb), 0.3);
      transform: translateZ(40px);
    }
    .hustler-bio {
      font-size: 1.1rem;
      line-height: 1.8;
      color: var(--text-2);
      max-width: 550px;
      font-weight: 400;
      transform: translateZ(30px);
    }

    .hustler-data {
      display: flex;
      gap: 16px;
      margin-top: 40px;
      transform: translateZ(35px);
      flex-wrap: wrap;
    }
    .hustler-data-box {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      padding: 20px 28px;
      border-radius: 16px;
      min-width: 140px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .hustler-data-box:hover {
      box-shadow:
        0 20px 40px -10px rgba(var(--accent-rgb), 0.2),
        inset 0 4px 10px rgba(255, 255, 255, 0.05);
      transform: translateY(-8px) scale(1.02);
      border-color: rgba(var(--accent-rgb), 0.4);
    }
    .hustler-data-val {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), #34D399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hustler-data-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent);
      opacity: 0.9;
      margin-top: 6px;
      font-weight: 600;
    }

    .hustler-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-top: 50px;
      transform: translateZ(45px);
    }
    .hustler-link {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text);
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-decoration: none;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
      overflow: hidden;
    }
    .hustler-link:hover {
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05));
      transform: translateY(-5px);
      box-shadow:
        0 15px 30px -8px rgba(var(--accent-rgb), 0.2),
        inset 0 3px 8px rgba(255, 255, 255, 0.05);
      color: var(--accent);
      border-color: rgba(var(--accent-rgb), 0.5);
    }
    .hustler-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.6s ease;
      mix-blend-mode: overlay;
    }
    .hustler-link:hover::after { left: 100%; }
    .hustler-link-left { display: flex; align-items: center; gap: 12px; }
    .hustler-link-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: rgba(var(--accent-rgb), 0.15);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent);
      transition: all 0.3s;
    }
    .hustler-link:hover .hustler-link-icon { background: var(--accent); color: #0A0F0D; }
    .hustler-link-arrow { color: var(--accent); font-size: 1.4rem; transition: transform 0.3s; }
    .hustler-link:hover .hustler-link-arrow { transform: translateX(5px) scale(1.1); }

    .hustler-conversation-btn {
      display: inline-block;
      margin-top: 30px;
      padding: 16px 36px;
      background: linear-gradient(135deg, var(--accent), #10B981);
      color: #0A0F0D;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-radius: 50px;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(var(--accent-rgb), 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .hustler-conversation-btn:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 20px 40px rgba(var(--accent-rgb), 0.4);
    }

    .hustler-float-shape {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05));
      box-shadow:
        0 10px 30px rgba(var(--accent-rgb), 0.1),
        inset 0 5px 15px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px) saturate(150%);
    }
    .hu-shape-1 {
      top: -40px; right: -20px;
      width: 100px; height: 100px;
      border: 2px solid rgba(var(--accent-rgb), 0.3);
      border-radius: 20px;
      animation: hustler-spin-3d 15s ease-in-out infinite alternate;
    }
    .hu-shape-2 {
      bottom: -40px; left: -20px;
      width: 80px; height: 80px;
      border: 2px dashed rgba(var(--accent-rgb), 0.4);
      animation: hustler-spin-3d 20s ease-in-out infinite alternate-reverse;
    }
    @keyframes hustler-spin-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-20px) scale(1.05) rotate(30deg); }
    }

    .hustler-sparkle {
      position: absolute;
      font-size: 0.6rem;
      color: var(--accent);
      pointer-events: none;
      z-index: 2;
      animation: hustler-sparkle 3s ease-in-out infinite;
    }
    .hustler-sparkle-1 { top: 12%; left: 15%; animation-delay: 0s; }
    .hustler-sparkle-2 { top: 18%; right: 12%; animation-delay: 0.5s; }
    .hustler-sparkle-3 { bottom: 25%; left: 10%; animation-delay: 1s; }
    .hustler-sparkle-4 { bottom: 15%; right: 8%; animation-delay: 1.5s; }
    @keyframes hustler-sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
      50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .hustler-grid, .hustler-ring, .hustler-ring-2, .hustler-float-shape, .hustler-sparkle { animation: none !important; transition: none !important; }
    }
  `;

  const getLinkIcon = (label: string, url: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('github')) return <Github size={18} />;
    if (lower.includes('linkedin')) return <Linkedin size={18} />;
    if (lower.includes('instagram')) return <Instagram size={18} />;
    if (lower.includes('twitter') || lower.includes('x.com')) return <span style={{ fontSize: '18px' }}>✕</span>;
    return <ExternalLink size={18} />;
  };

  return (
    <div
      className="hustler-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="hustler-grid" />
      <div
        className="hustler-glow"
        style={{ transform: `translate(${mouse.x * 200}px, ${mouse.y * 200}px)` }}
      />

      <div
        className="hustler-container"
        style={{
          transform: `rotateY(${mouse.x * 12}deg) rotateX(${mouse.y * -12}deg)`
        }}
      >
        <span className="hustler-sparkle hustler-sparkle-1">✦</span>
        <span className="hustler-sparkle hustler-sparkle-2">✦</span>
        <span className="hustler-sparkle hustler-sparkle-3">✦</span>
        <span className="hustler-sparkle hustler-sparkle-4">✦</span>

        <div className="hustler-float-shape hu-shape-1" />
        <div className="hustler-float-shape hu-shape-2" />

        <div className="hustler-card">
          <div className="hustler-corner hustler-corner-tl" />
          <div className="hustler-corner hustler-corner-tr" />
          <div className="hustler-corner hustler-corner-bl" />
          <div className="hustler-corner hustler-corner-br" />

          <div className="hustler-inner">
            <div className="hustler-avatar-wrap">
              <div className="hustler-ring" />
              <div className="hustler-ring-2" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="hustler-avatar" />
              ) : (
                <div className="hustler-avatar-placeholder">{profile.name?.charAt(0) || 'H'}</div>
              )}
            </div>

            <div className="hustler-content">
              <h1 className="hustler-name">{profile.name}</h1>
              <div className="hustler-role">{profile.headline}</div>
              <p className="hustler-bio">{profile.bio}</p>

              <a
                href={profile.email ? `mailto:${profile.email}` : '#'}
                className="hustler-conversation-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <span>✉</span> Get in Touch
              </a>

              {(profile.theme as any)?.conversationUrl && (
                <a
                  href={(profile.theme as any).conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hustler-conversation-btn"
                >
                  Start a Conversation
                </a>
              )}

              {profile.proofs && profile.proofs.length > 0 ? (
                <div className="hustler-data">
                  {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                    <div key={i} className="hustler-data-box">
                      <div className="hustler-data-val">{proof.value}</div>
                      <div className="hustler-data-label">{proof.title || proof.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hustler-data">
                  {profile.role && (
                    <div className="hustler-data-box">
                      <div className="hustler-data-val">ROLE</div>
                      <div className="hustler-data-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="hustler-data-box">
                      <div className="hustler-data-val">ORG</div>
                      <div className="hustler-data-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="hustler-data-box">
                      <div className="hustler-data-val">LOC</div>
                      <div className="hustler-data-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="hustler"
                accentColor={accent}
                autoScroll={profile.autoScroll}
              />

              {profile.links && profile.links.length > 0 && (
                <div className="hustler-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="hustler-link">
                      <div className="hustler-link-left">
                        <div className="hustler-link-icon">
                          {getLinkIcon(link.label, link.url)}
                        </div>
                        <span>{link.label}</span>
                      </div>
                      <span className="hustler-link-arrow">→</span>
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