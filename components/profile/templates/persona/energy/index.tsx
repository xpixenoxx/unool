'use client';

import { useState, useRef } from 'react';
import { ExternalLink, Github, Linkedin, Instagram } from 'lucide-react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';

interface EnergyTemplateProps {
  profile: any;
  accentColor?: string;
}

export function EnergyTemplate({ profile, accentColor }: EnergyTemplateProps) {
  const accent = accentColor || '#F59E0B';
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

    .energy-wrap {
      --accent: ${accent};
      --accent-rgb: 245, 158, 11;
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

    .energy-grid {
      position: absolute;
      width: 200vw; height: 200vh;
      top: -50%; left: -50%;
      background-image:
        linear-gradient(rgba(var(--accent-rgb), 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--accent-rgb), 0.04) 1px, transparent 1px);
      background-size: 80px 80px;
      animation: energy-grid-move 60s linear infinite;
      z-index: 0;
      pointer-events: none;
    }
    @keyframes energy-grid-move {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(160px) rotate(5deg); }
    }

    .energy-glow {
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

    .energy-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1200px;
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    .energy-card {
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

    .energy-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg,
        transparent 20%,
        rgba(var(--accent-rgb), 0.12) 30%,
        rgba(255, 255, 255, 0.15) 40%,
        rgba(var(--accent-rgb), 0.12) 50%,
        transparent 60%
      );
      background-size: 300% 300%;
      animation: energy-shimmer 8s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: color-dodge;
    }
    @keyframes energy-shimmer {
      0% { background-position: 100% 100%; }
      100% { background-position: 0% 0%; }
    }

    .energy-corner {
      position: absolute;
      width: 24px; height: 24px;
      border: 3px solid var(--accent);
      opacity: 0.5;
      z-index: 2;
    }
    .energy-corner-tl { top: 20px; left: 20px; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
    .energy-corner-tr { top: 20px; right: 20px; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
    .energy-corner-bl { bottom: 20px; left: 20px; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
    .energy-corner-br { bottom: 20px; right: 20px; border-left: none; border-top: none; border-radius: 0 0 4px 0; }

    .energy-inner {
      display: flex;
      gap: 60px;
      transform: translateZ(40px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 860px) {
      .energy-inner { flex-direction: column; text-align: center; gap: 40px; }
      .energy-card { padding: 40px 24px; border-radius: 32px; }
      .energy-avatar-wrap { margin: 0 auto; }
    }

    .energy-avatar-wrap {
      position: relative;
      width: 200px; height: 200px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(60px);
    }
    .energy-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid var(--accent);
      box-shadow:
        0 20px 40px rgba(var(--accent-rgb), 0.3),
        inset 0 0 0 2px rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 5;
      animation: energy-pulse 4s ease-in-out infinite;
    }
    @keyframes energy-pulse {
      0%, 100% { box-shadow: 0 20px 40px rgba(var(--accent-rgb), 0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.1); }
      50% { box-shadow: 0 25px 50px rgba(var(--accent-rgb), 0.5), inset 0 0 0 4px rgba(255, 255, 255, 0.2); }
    }
    .energy-ring {
      position: absolute;
      inset: -20px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(var(--accent-rgb), 0.4), transparent);
      animation: energy-spin-ring 8s linear infinite;
      z-index: -1;
      filter: blur(6px);
    }
    .energy-ring-2 {
      position: absolute;
      inset: -40px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent, rgba(var(--accent-rgb), 0.2), transparent);
      animation: energy-spin-ring 12s linear infinite reverse;
      z-index: -2;
      filter: blur(8px);
    }
    @keyframes energy-spin-ring {
      to { transform: rotate(360deg); }
    }
    .energy-avatar-placeholder {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #FBBF24);
      display: flex; align-items: center; justify-content: center;
      color: #0F0F0F; font-family: 'Syne', sans-serif;
      font-size: 5rem; font-weight: 800;
    }

    .energy-content {
      flex: 1;
      transform-style: preserve-3d;
    }
    .energy-name {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2.5rem, 5vw, 5rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      background: linear-gradient(135deg, var(--accent), #FBBF24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
      transform: translateZ(50px);
      line-height: 1.05;
    }
    .energy-role {
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
      animation: energy-border-pulse 3s ease-in-out infinite;
    }
    @keyframes energy-border-pulse {
      0%, 100% { border-color: var(--accent); }
      50% { border-color: #FBBF24; }
    }
    .energy-bio {
      font-size: 1.15rem;
      line-height: 1.8;
      color: var(--text-2);
      max-width: 550px;
      font-weight: 400;
      transform: translateZ(30px);
    }

    .energy-data {
      display: flex;
      gap: 16px;
      margin-top: 40px;
      transform: translateZ(35px);
      flex-wrap: wrap;
    }
    .energy-data-box {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      padding: 24px 32px;
      border-radius: 16px;
      min-width: 160px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .energy-data-box:hover {
      box-shadow:
        0 20px 40px -10px rgba(var(--accent-rgb), 0.3),
        inset 0 4px 10px rgba(255, 255, 255, 0.05);
      transform: translateY(-8px) scale(1.02);
      border-color: var(--accent);
    }
    .energy-data-val {
      font-family: 'Syne', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--accent);
      line-height: 1.1;
    }
    .energy-data-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-2);
      opacity: 0.8;
      margin-top: 8px;
      font-weight: 600;
    }

    .energy-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-top: 50px;
      transform: translateZ(45px);
    }
    .energy-link {
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
    .energy-link:hover {
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05));
      transform: translateY(-6px);
      box-shadow:
        0 20px 40px -10px rgba(var(--accent-rgb), 0.3),
        inset 0 3px 8px rgba(255, 255, 255, 0.05);
      color: var(--accent);
      border-color: var(--accent);
    }
    .energy-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.2), transparent);
      transition: left 0.6s ease;
      mix-blend-mode: overlay;
    }
    .energy-link:hover::after { left: 100%; }
    .energy-link-left { display: flex; align-items: center; gap: 14px; }
    .energy-link-icon {
      width: 48px; height: 48px;
      border-radius: 14px;
      background: rgba(var(--accent-rgb), 0.15);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent);
      transition: all 0.3s;
    }
    .energy-link:hover .energy-link-icon { background: var(--accent); color: #0F0F0F; }
    .energy-link-arrow { color: var(--accent); font-size: 1.6rem; transition: transform 0.3s; }
    .energy-link:hover .energy-link-arrow { transform: translateX(8px) scale(1.1); }

    .energy-conversation-btn {
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
    .energy-conversation-btn:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 25px 50px rgba(var(--accent-rgb), 0.5);
      background: #FBBF24;
    }

    .energy-float-shape {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05));
      box-shadow:
        0 10px 30px rgba(var(--accent-rgb), 0.15),
        inset 0 5px 15px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px) saturate(150%);
    }
    .en-shape-1 {
      top: -50px; right: -30px;
      width: 120px; height: 120px;
      border: 3px solid var(--accent);
      border-radius: 24px;
      animation: energy-spin-3d 12s ease-in-out infinite alternate;
    }
    .en-shape-2 {
      bottom: -50px; left: -30px;
      width: 100px; height: 100px;
      border: 3px dashed rgba(var(--accent-rgb), 0.5);
      border-radius: 50%;
      animation: energy-spin-3d 18s ease-in-out infinite alternate-reverse;
    }
    @keyframes energy-spin-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-30px) scale(1.05) rotate(45deg); }
    }

    .energy-particle {
      position: absolute;
      width: 4px; height: 4px;
      background: var(--accent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 2;
      opacity: 0.6;
      animation: energy-particle-float 6s ease-in-out infinite;
    }
    .energy-particle-1 { top: 20%; left: 10%; animation-delay: 0s; }
    .energy-particle-2 { top: 30%; right: 15%; animation-delay: 1s; }
    .energy-particle-3 { bottom: 35%; left: 8%; animation-delay: 2s; }
    .energy-particle-4 { bottom: 20%; right: 10%; animation-delay: 3s; }
    @keyframes energy-particle-float {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
      50% { transform: translateY(-40px) scale(1.5); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .energy-grid, .energy-ring, .energy-ring-2, .energy-float-shape, .energy-particle,
      .energy-avatar, .energy-role { animation: none !important; transition: none !important; }
    }
  `;

  const getLinkIcon = (label: string, url: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('github')) return <Github size={20} />;
    if (lower.includes('linkedin')) return <Linkedin size={20} />;
    if (lower.includes('instagram')) return <Instagram size={20} />;
    if (lower.includes('twitter') || lower.includes('x.com')) return <span style={{ fontSize: '20px' }}>✕</span>;
    return <ExternalLink size={20} />;
  };

  return (
    <div
      className="energy-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="energy-grid" />
      <div
        className="energy-glow"
        style={{ transform: `translate(${mouse.x * 250}px, ${mouse.y * 250}px)` }}
      />

      <div
        className="energy-container"
        style={{
          transform: `rotateY(${mouse.x * 10}deg) rotateX(${mouse.y * -10}deg)`
        }}
      >
        <div className="energy-float-shape en-shape-1" />
        <div className="energy-float-shape en-shape-2" />

        <span className="energy-particle energy-particle-1" />
        <span className="energy-particle energy-particle-2" />
        <span className="energy-particle energy-particle-3" />
        <span className="energy-particle energy-particle-4" />

        <div className="energy-card">
          <div className="energy-corner energy-corner-tl" />
          <div className="energy-corner energy-corner-tr" />
          <div className="energy-corner energy-corner-bl" />
          <div className="energy-corner energy-corner-br" />

          <div className="energy-inner">
            <div className="energy-avatar-wrap">
              <div className="energy-ring" />
              <div className="energy-ring-2" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="energy-avatar" />
              ) : (
                <div className="energy-avatar-placeholder">{profile.name?.charAt(0) || 'E'}</div>
              )}
            </div>

            <div className="energy-content">
              <h1 className="energy-name">{profile.name}</h1>
              <div className="energy-role">{profile.headline}</div>
              <p className="energy-bio">{profile.bio}</p>

              <a
                href={profile.email ? `mailto:${profile.email}` : '#'}
                className="energy-conversation-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <span>⚡</span> Get in Touch
              </a>

              {(profile.theme as any)?.conversationUrl && (
                <a
                  href={(profile.theme as any).conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="energy-conversation-btn"
                >
                  Start a Conversation
                </a>
              )}

              {profile.proofs && profile.proofs.length > 0 ? (
                <div className="energy-data">
                  {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                    <div key={i} className="energy-data-box">
                      <div className="energy-data-val">{proof.value}</div>
                      <div className="energy-data-label">{proof.title || proof.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="energy-data">
                  {profile.role && (
                    <div className="energy-data-box">
                      <div className="energy-data-val">ROLE</div>
                      <div className="energy-data-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="energy-data-box">
                      <div className="energy-data-val">ORG</div>
                      <div className="energy-data-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="energy-data-box">
                      <div className="energy-data-val">LOC</div>
                      <div className="energy-data-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="energy"
                accentColor={accent}
                autoScroll={profile.autoScroll}
              />

              {profile.links && profile.links.length > 0 && (
                <div className="energy-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="energy-link">
                      <div className="energy-link-left">
                        <div className="energy-link-icon">
                          {getLinkIcon(link.label, link.url)}
                        </div>
                        <span>{link.label}</span>
                      </div>
                      <span className="energy-link-arrow">→</span>
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