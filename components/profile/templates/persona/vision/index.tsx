'use client';

import { useState, useRef } from 'react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon as getSharedLinkIcon } from '@/components/profile/templates/utils/socialIcons';

interface VisionTemplateProps {
  profile: any;
  accentColor?: string;
}

export function VisionTemplate({ profile, accentColor }: VisionTemplateProps) {
  const accent = accentColor || '#FF007A';
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
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
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

    .vision-wrap {
      --color1: ${accent};
      --color1-rgb: 255, 0, 122;
      --color2: #7928CA;
      --color2-rgb: 121, 40, 202;
      --bg: #FAFAFC;

      font-family: 'Rajdhani', sans-serif;
      background: var(--bg);

      background-image:
        radial-gradient(circle at 10% 20%, rgba(var(--color1-rgb), 0.12) 0%, transparent 60%),
        radial-gradient(circle at 90% 80%, rgba(var(--color2-rgb), 0.15) 0%, transparent 60%);
      color: #1a1a2e;
      min-height: 100vh;
      overflow: hidden;
      position: relative;
      perspective: 1200px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .vision-grid {
      position: absolute;
      width: 200vw; height: 200vh;
      top: -50%; left: -50%;
      background-image:
        radial-gradient(rgba(var(--color2-rgb), 0.05) 2px, transparent 2px);
      background-size: 40px 40px;
      animation: vision-grid-move 60s linear infinite;
      z-index: 0;
      pointer-events: none;
      opacity: 0.8;
    }
    @keyframes vision-grid-move {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(100px) rotate(5deg); }
    }

    .vision-glow {
      position: absolute;
      width: 700px; height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(var(--color1-rgb), 0.35) 0%, rgba(var(--color2-rgb), 0.15) 50%, transparent 70%);
      opacity: 0.3;
      filter: blur(90px);
      z-index: 0;
      pointer-events: none;
      transition: transform 0.4s ease-out;
    }

    .vision-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1100px;
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    .vision-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 28px;
      padding: 60px;
      box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.03),
        inset 0 0 0 1px rgba(255, 255, 255, 0.8),
        inset 0 0 20px rgba(255, 255, 255, 0.5);
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
    }

    .vision-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg,
        transparent 20%,
        rgba(var(--color1-rgb), 0.15) 30%,
        rgba(255, 255, 255, 0.6) 40%,
        rgba(var(--color2-rgb), 0.15) 50%,
        transparent 60%
      );
      background-size: 300% 300%;
      animation: holo-shimmer 7s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 2;
      mix-blend-mode: color-dodge;
    }
    @keyframes holo-shimmer {
      0% { background-position: 100% 100%; }
      100% { background-position: 0% 0%; }
    }

    .vision-corner {
      position: absolute;
      width: 8px; height: 8px;
      background: var(--color1);
      border-radius: 50%;
      opacity: 0.3;
      z-index: 3;
    }
    .vision-corner-tl { top: 30px; left: 30px; }
    .vision-corner-tr { top: 30px; right: 30px; }
    .vision-corner-bl { bottom: 30px; left: 30px; }
    .vision-corner-br { bottom: 30px; right: 30px; }

    .vision-inner {
      display: flex;
      gap: 60px;
      transform: translateZ(40px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 860px) {
      .vision-inner { flex-direction: column; text-align: center; gap: 40px; }
      .vision-card { padding: 40px 24px; border-radius: 32px; }
      .vision-avatar-wrap { margin: 0 auto; }
    }

    .vision-avatar-wrap {
      position: relative;
      width: 180px; height: 180px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(60px);
    }
    .vision-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #fff;
      box-shadow:
        0 15px 35px rgba(var(--color1-rgb), 0.2),
        inset 0 0 0 2px rgba(var(--color2-rgb), 0.1);
      position: relative;
      z-index: 5;
    }
    .vision-ring {
      position: absolute;
      inset: -15px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(var(--color1-rgb), 0.25), transparent);
      animation: vision-spin-ring 8s linear infinite;
      z-index: -1;
      filter: blur(4px);
    }
    .vision-ring-2 {
      position: absolute;
      inset: -30px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent, rgba(var(--color2-rgb), 0.2), transparent);
      animation: vision-spin-ring 12s linear infinite reverse;
      z-index: -2;
      filter: blur(6px);
    }
    .vision-ring-3 { display: none; }
    @keyframes vision-spin-ring {
      to { transform: rotate(360deg); }
    }

    .vision-content {
      flex: 1;
      transform-style: preserve-3d;
    }
    .vision-name {
      font-family: 'Orbitron', sans-serif;
      font-size: clamp(2.5rem, 5vw, 4.8rem);
      font-weight: 900;
      letter-spacing: -1px;
      text-transform: uppercase;
      background: linear-gradient(135deg, var(--color2), var(--color1));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      transform: translateZ(50px);
      line-height: 1.1;
    }
    .vision-role {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--color2);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 24px;
      display: inline-block;
      padding: 8px 24px;
      background: rgba(255,255,255,0.4);
      backdrop-filter: blur(4px);
      border-radius: 30px;
      border: 1px solid rgba(255,255,255,0.6);
      box-shadow: 0 8px 20px -5px rgba(var(--color2-rgb), 0.1);
      transform: translateZ(40px);
    }
    .vision-bio {
      font-size: 1.15rem;
      line-height: 1.8;
      color: #555577;
      max-width: 600px;
      font-weight: 500;
      transform: translateZ(30px);
    }

    .vision-data {
      display: flex;
      gap: 16px;
      margin-top: 40px;
      transform: translateZ(35px);
      flex-wrap: wrap;
    }
    .vision-data-box {
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      padding: 16px 24px;
      border-radius: 12px;
      min-width: 140px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      box-shadow:
        0 10px 25px -5px rgba(var(--color2-rgb), 0.05),
        inset 0 4px 10px rgba(255, 255, 255, 1);
    }
    .vision-data-box:hover {
      box-shadow:
        0 20px 40px -10px rgba(var(--color1-rgb), 0.15),
        inset 0 4px 10px rgba(255, 255, 255, 1);
      transform: translateY(-8px) scale(1.02);
      border-color: rgba(var(--color1-rgb), 0.4);
    }
    .vision-data-val {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--color2), var(--color1));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .vision-data-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--color1);
      opacity: 0.9;
      margin-top: 6px;
      font-weight: 700;
    }
    .vision-data-box::before { display: none; }

    .vision-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-top: 50px;
      transform: translateZ(45px);
    }
    .vision-link {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 12px;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #1a1a2e;
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-decoration: none;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
      overflow: hidden;
      box-shadow:
        0 8px 20px -4px rgba(var(--color2-rgb), 0.05),
        inset 0 3px 8px rgba(255, 255, 255, 1);
    }
    .vision-link:hover {
      background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
      transform: translateY(-5px);
      box-shadow:
        0 15px 30px -8px rgba(var(--color1-rgb), 0.2),
        inset 0 3px 8px rgba(255, 255, 255, 1);
      color: var(--color2);
      border-color: rgba(var(--color2-rgb), 0.5);
    }
    .vision-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
      transition: left 0.6s ease;
      mix-blend-mode: overlay;
    }
    .vision-link:hover::after { left: 100%; }
    .vision-link-arrow {
      color: var(--color1);
      font-size: 1.4rem;
      transition: transform 0.3s;
    }
    .vision-link:hover .vision-link-arrow {
      transform: translateX(5px) scale(1.1);
    }

    .vision-conversation-btn {
      display: inline-block;
      margin-top: 30px;
      padding: 16px 36px;
      background: linear-gradient(135deg, var(--color1), var(--color2));
      color: #fff;
      font-family: 'Orbitron', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-radius: 50px;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(var(--color1-rgb), 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .vision-conversation-btn:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 20px 40px rgba(var(--color2-rgb), 0.4);
    }

    .vision-float-shape {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(var(--color1-rgb),0.15), rgba(var(--color2-rgb),0.15));
      box-shadow:
        0 10px 30px rgba(var(--color1-rgb),0.1),
        inset 0 5px 15px rgba(255,255,255,1);
      backdrop-filter: blur(10px) saturate(150%);
    }
    .v-shape-1 {
      top: -40px; right: -20px;
      width: 100px; height: 100px;
      border: 2px solid rgba(var(--color1-rgb), 0.4);
      border-radius: 20px;
      animation: vision-spin-3d 15s ease-in-out infinite alternate;
    }
    .v-shape-2 {
      bottom: -40px; left: -20px;
      width: 80px; height: 80px;
      border: 2px dashed rgba(var(--color2-rgb), 0.5);
      animation: vision-spin-3d 20s ease-in-out infinite alternate-reverse;
    }
    @keyframes vision-spin-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-20px) scale(1.05) rotate(30deg); }
    }

    .vision-scanline { display: none; }

    @media (prefers-reduced-motion: reduce) {
      .vision-grid, .vision-ring, .vision-ring-2, .vision-float-shape, .vision-card::before { animation: none !important; transition: none !important; }
    }
  `;

  return (
    <div
      className="vision-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="vision-grid" />
      <div
        className="vision-glow"
        style={{ transform: `translate(${mouse.x * 200}px, ${mouse.y * 200}px)` }}
      />

      <div
        className="vision-container"
        style={{
          transform: `rotateY(${mouse.x * 12}deg) rotateX(${mouse.y * -12}deg)`
        }}
      >
        <div className="vision-float-shape v-shape-1" />
        <div className="vision-float-shape v-shape-2" />

        <div className="vision-card">
          <div className="vision-scanline" />
          <div className="vision-corner vision-corner-tl" />
          <div className="vision-corner vision-corner-tr" />
          <div className="vision-corner vision-corner-bl" />
          <div className="vision-corner vision-corner-br" />

          <div className="vision-inner">
            <div className="vision-avatar-wrap">
              <div className="vision-ring" />
              <div className="vision-ring-2" />
              <div className="vision-ring-3" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="vision-avatar" />
              ) : (
                <div className="vision-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#FF3366', background: 'rgba(255,51,102,0.1)', fontFamily: 'Orbitron' }}>
                  {profile.name?.charAt(0) || 'V'}
                </div>
              )}
            </div>

            <div className="vision-content">
              <h1 className="vision-name">{profile.name}</h1>
              <div className="vision-role">{profile.headline}</div>
              <p className="vision-bio">{profile.bio}</p>

              <a
                href={profile.email ? `mailto:${profile.email}` : '#'}
                className="vision-conversation-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <span>✉</span> Get in Touch
              </a>

              {(profile.theme as any)?.conversationUrl && (
                <a
                  href={(profile.theme as any).conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vision-conversation-btn"
                >
                  Start a Conversation
                </a>
              )}

              {profile.proofs && profile.proofs.length > 0 ? (
                <div className="vision-data">
                  {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                    <div key={i} className="vision-data-box">
                      <div className="vision-data-val">{proof.value}</div>
                      <div className="vision-data-label">{proof.title || proof.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vision-data">
                  {profile.role && (
                    <div className="vision-data-box">
                      <div className="vision-data-val">ROLE</div>
                      <div className="vision-data-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="vision-data-box">
                      <div className="vision-data-val">ORG</div>
                      <div className="vision-data-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="vision-data-box">
                      <div className="vision-data-val">LOC</div>
                      <div className="vision-data-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="vision"
                autoScroll={profile.autoScroll}
              />

              {profile.links && profile.links.length > 0 && (
                <div className="vision-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="vision-link flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        {getSharedLinkIcon(link.label, link.url, link.icon, 'w-4 h-4')}
                        <span>{link.label}</span>
                      </span>
                      <span className="vision-link-arrow">↗</span>
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