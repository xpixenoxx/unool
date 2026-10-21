'use client';

import { useState, useRef, useEffect } from 'react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon as getSharedLinkIcon } from '@/components/profile/templates/utils/socialIcons';
import type { TemplateProps } from '@/components/profile/templates/types';

interface LoneTemplateProps extends TemplateProps {}

export function LoneTemplate({ profile, accentColor }: LoneTemplateProps) {
  const accent = accentColor || '#3B82F6';
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
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    .lone-wrap {
      --accent: ${accent};
      --accent-rgb: 59, 130, 246;
      --bg: #0A0F1A;
      --text: #F0F4FA;
      --text-2: #8B9CB8;
      --muted: #141D2E;
      --card: #0E1626;
      --border: #1E2D45;

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

    .lone-grid {
      position: absolute;
      width: 200vw; height: 200vh;
      top: -50%; left: -50%;
      background-image:
        linear-gradient(rgba(var(--accent-rgb), 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--accent-rgb), 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      animation: lone-grid-move 80s linear infinite;
      z-index: 0;
      pointer-events: none;
    }
    @keyframes lone-grid-move {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(120px) rotate(5deg); }
    }

    .lone-glow {
      position: absolute;
      width: 600px; height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(var(--accent-rgb), 0.25) 0%, transparent 70%);
      opacity: 0.3;
      filter: blur(100px);
      z-index: 0;
      pointer-events: none;
      transition: transform 0.4s ease-out;
    }

    .lone-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1100px;
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    .lone-card {
      background: linear-gradient(145deg, var(--card), var(--muted));
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 64px;
      box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
    }

    .lone-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg,
        transparent 20%,
        rgba(var(--accent-rgb), 0.1) 30%,
        rgba(255, 255, 255, 0.15) 40%,
        rgba(var(--accent-rgb), 0.1) 50%,
        transparent 60%
      );
      background-size: 300% 300%;
      animation: lone-shimmer 10s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: color-dodge;
    }
    @keyframes lone-shimmer {
      0% { background-position: 100% 100%; }
      100% { background-position: 0% 0%; }
    }

    .lone-corner {
      position: absolute;
      width: 8px; height: 8px;
      border: 2px solid var(--accent);
      border-radius: 2px;
      opacity: 0.4;
      z-index: 2;
    }
    .lone-corner-tl { top: 24px; left: 24px; border-right: none; border-bottom: none; }
    .lone-corner-tr { top: 24px; right: 24px; border-left: none; border-bottom: none; }
    .lone-corner-bl { bottom: 24px; left: 24px; border-right: none; border-top: none; }
    .lone-corner-br { bottom: 24px; right: 24px; border-left: none; border-top: none; }

    .lone-inner {
      display: flex;
      gap: 60px;
      transform: translateZ(40px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 860px) {
      .lone-inner { flex-direction: column; text-align: center; gap: 40px; }
      .lone-card { padding: 40px 24px; border-radius: 32px; }
      .lone-avatar-wrap { margin: 0 auto; }
    }

    .lone-avatar-wrap {
      position: relative;
      width: 180px; height: 180px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(60px);
    }
    .lone-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.2);
      box-shadow:
        0 15px 35px rgba(var(--accent-rgb), 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 5;
    }
    .lone-ring {
      position: absolute;
      inset: -15px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(var(--accent-rgb), 0.3), transparent);
      animation: lone-spin-ring 10s linear infinite;
      z-index: -1;
      filter: blur(4px);
    }
    .lone-ring-2 {
      position: absolute;
      inset: -30px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent, rgba(var(--accent-rgb), 0.15), transparent);
      animation: lone-spin-ring 15s linear infinite reverse;
      z-index: -2;
      filter: blur(6px);
    }
    @keyframes lone-spin-ring {
      to { transform: rotate(360deg); }
    }
    .lone-avatar-placeholder {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #60A5FA);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-family: 'Space Grotesk', sans-serif;
      font-size: 4rem; font-weight: 700;
    }

    .lone-content {
      flex: 1;
      transform-style: preserve-3d;
    }
    .lone-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2.5rem, 5vw, 4.8rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--accent), #93C5FD);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      transform: translateZ(50px);
      line-height: 1.1;
    }
    .lone-role {
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
    .lone-bio {
      font-size: 1.1rem;
      line-height: 1.8;
      color: var(--text-2);
      max-width: 550px;
      font-weight: 400;
      transform: translateZ(30px);
    }

    .lone-data {
      display: flex;
      gap: 16px;
      margin-top: 40px;
      transform: translateZ(35px);
      flex-wrap: wrap;
    }
    .lone-data-box {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      padding: 20px 28px;
      border-radius: 16px;
      min-width: 140px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .lone-data-box:hover {
      box-shadow:
        0 20px 40px -10px rgba(var(--accent-rgb), 0.2),
        inset 0 4px 10px rgba(255, 255, 255, 0.05);
      transform: translateY(-8px) scale(1.02);
      border-color: rgba(var(--accent-rgb), 0.4);
    }
    .lone-data-val {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), #93C5FD);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .lone-data-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent);
      opacity: 0.9;
      margin-top: 6px;
      font-weight: 600;
    }

    .lone-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-top: 50px;
      transform: translateZ(45px);
    }
    .lone-link {
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
    .lone-link:hover {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
      transform: translateY(-5px);
      box-shadow:
        0 15px 30px -8px rgba(var(--accent-rgb), 0.2),
        inset 0 3px 8px rgba(255, 255, 255, 0.05);
      color: var(--accent);
      border-color: rgba(var(--accent-rgb), 0.5);
    }
    .lone-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.6s ease;
      mix-blend-mode: overlay;
    }
    .lone-link:hover::after { left: 100%; }
    .lone-link-left { display: flex; align-items: center; gap: 12px; }
    .lone-link-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: rgba(var(--accent-rgb), 0.15);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent);
      transition: all 0.3s;
    }
    .lone-link:hover .lone-link-icon { background: var(--accent); color: #fff; }
    .lone-link-arrow { color: var(--accent); font-size: 1.4rem; transition: transform 0.3s; }
    .lone-link:hover .lone-link-arrow { transform: translateX(5px) scale(1.1); }

    .lone-conversation-btn {
      display: inline-block;
      margin-top: 30px;
      padding: 16px 36px;
      background: linear-gradient(135deg, var(--accent), #60A5FA);
      color: #fff;
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
    .lone-conversation-btn:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 20px 40px rgba(var(--accent-rgb), 0.4);
    }

    .lone-float-shape {
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
    .lo-shape-1 {
      top: -40px; right: -20px;
      width: 100px; height: 100px;
      border: 2px solid rgba(var(--accent-rgb), 0.3);
      border-radius: 20px;
      animation: lone-spin-3d 15s ease-in-out infinite alternate;
    }
    .lo-shape-2 {
      bottom: -40px; left: -20px;
      width: 80px; height: 80px;
      border: 2px dashed rgba(var(--accent-rgb), 0.4);
      animation: lone-spin-3d 20s ease-in-out infinite alternate-reverse;
    }
    @keyframes lone-spin-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-20px) scale(1.05) rotate(30deg); }
    }

    .lone-sparkle {
      position: absolute;
      font-size: 0.6rem;
      color: var(--accent);
      pointer-events: none;
      z-index: 2;
      animation: lone-sparkle 3s ease-in-out infinite;
    }
    .lone-sparkle-1 { top: 12%; left: 15%; animation-delay: 0s; }
    .lone-sparkle-2 { top: 18%; right: 12%; animation-delay: 0.5s; }
    .lone-sparkle-3 { bottom: 25%; left: 10%; animation-delay: 1s; }
    .lone-sparkle-4 { bottom: 15%; right: 8%; animation-delay: 1.5s; }
    @keyframes lone-sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
      50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .lone-grid, .lone-ring, .lone-ring-2, .lone-float-shape, .lone-sparkle { animation: none !important; transition: none !important; }
    }
  `;

  return (
    <div
      className="lone-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="lone-grid" />
      <div
        className="lone-glow"
        style={{ transform: `translate(${mouse.x * 200}px, ${mouse.y * 200}px)` }}
      />

      <div
        className="lone-container"
        style={{
          transform: `rotateY(${mouse.x * 12}deg) rotateX(${mouse.y * -12}deg)`
        }}
      >
        <span className="lone-sparkle lone-sparkle-1" ref={(el) => { sparkleRefs.current[0] = el; }}>✦</span>
        <span className="lone-sparkle lone-sparkle-2" ref={(el) => { sparkleRefs.current[1] = el; }}>✦</span>
        <span className="lone-sparkle lone-sparkle-3" ref={(el) => { sparkleRefs.current[2] = el; }}>✦</span>
        <span className="lone-sparkle lone-sparkle-4" ref={(el) => { sparkleRefs.current[3] = el; }}>✦</span>

        <div className="lone-float-shape lo-shape-1" />
        <div className="lone-float-shape lo-shape-2" />

        <div className="lone-card">
          <div className="lone-corner lone-corner-tl" />
          <div className="lone-corner lone-corner-tr" />
          <div className="lone-corner lone-corner-bl" />
          <div className="lone-corner lone-corner-br" />

          <div className="lone-inner">
            <div className="lone-avatar-wrap">
              <div className="lone-ring" />
              <div className="lone-ring-2" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="lone-avatar" />
              ) : (
                <div className="lone-avatar-placeholder">{profile.name?.charAt(0) || 'L'}</div>
              )}
            </div>

            <div className="lone-content">
              <h1 className="lone-name">{profile.name}</h1>
              <div className="lone-role">{profile.headline}</div>
              <p className="lone-bio">{profile.bio}</p>

              <a
                href={profile.email ? `mailto:${profile.email}` : '#'}
                className="lone-conversation-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <span>✉</span> Get in Touch
              </a>

              {(profile.theme as any)?.conversationUrl && (
                <a
                  href={(profile.theme as any).conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lone-conversation-btn"
                >
                  Start a Conversation
                </a>
              )}

              {profile.proofs && profile.proofs.length > 0 ? (
                <div className="lone-data">
                  {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                    <div key={i} className="lone-data-box">
                      <div className="lone-data-val">{proof.value}</div>
                      <div className="lone-data-label">{proof.title || proof.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lone-data">
                  {profile.role && (
                    <div className="lone-data-box">
                      <div className="lone-data-val">ROLE</div>
                      <div className="lone-data-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="lone-data-box">
                      <div className="lone-data-val">ORG</div>
                      <div className="lone-data-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="lone-data-box">
                      <div className="lone-data-val">LOC</div>
                      <div className="lone-data-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="lone"
                autoScroll={profile.autoScroll}
              />

              {profile.links && profile.links.length > 0 && (
                <div className="lone-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="lone-link">
                      <div className="lone-link-left">
                        <div className="lone-link-icon">
                          {getSharedLinkIcon(link.label, link.url, link.icon, 'w-4 h-4')}
                        </div>
                        <span>{link.label}</span>
                      </div>
                      <span className="lone-link-arrow">→</span>
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