'use client';

import { useState, useRef } from 'react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon as getSharedLinkIcon } from '@/components/profile/templates/utils/socialIcons';
import type { TemplateProps } from '@/components/profile/templates/types';

interface VoiceTemplateProps extends TemplateProps {}

export function VoiceTemplate({ profile, accentColor }: VoiceTemplateProps) {
  const accent = accentColor || '#8B5CF6';
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
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
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

    .voice-wrap {
      --accent: ${accent};
      --accent-rgb: 139, 92, 246;
      --bg: #0A0A0F;
      --text: #F5F0FF;
      --text-2: #A397B8;
      --muted: #15101E;
      --card: #12101A;
      --border: #2A223A;
      --gold: #D4A843;

      font-family: 'Space Grotesk', sans-serif;
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

    .voice-grid {
      position: absolute;
      width: 200vw; height: 200vh;
      top: -50%; left: -50%;
      background-image:
        linear-gradient(rgba(var(--accent-rgb), 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--accent-rgb), 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      animation: voice-grid-drift 80s linear infinite;
      z-index: 0;
      pointer-events: none;
    }
    @keyframes voice-grid-drift {
      0% { transform: translate(0, 0) rotate(0deg); }
      100% { transform: translate(120px, 120px) rotate(3deg); }
    }

    .voice-atmosphere {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 20%, rgba(var(--accent-rgb), 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(212, 168, 67, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 70%);
      z-index: 1;
      pointer-events: none;
    }

    .voice-waveform {
      position: absolute;
      bottom: 0; left: 50%;
      width: 100%; height: 200px;
      transform: translateX(-50%);
      background: linear-gradient(180deg, transparent, rgba(var(--accent-rgb), 0.02));
      mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,100 C150,50 300,150 450,100 C600,50 750,150 900,100 C1050,50 1200,100 1200,100 L1200,200 L0,200 Z' fill='white'/%3E%3C/svg%3E");
      mask-size: cover;
      opacity: 0.3;
      z-index: 2;
      pointer-events: none;
    }

    .voice-particle {
      position: absolute;
      width: 3px; height: 3px;
      background: var(--accent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 3;
      opacity: 0.5;
      animation: voice-particle-rise 8s ease-in-out infinite;
    }
    .voice-particle-1 { left: 10%; bottom: 10%; animation-delay: 0s; }
    .voice-particle-2 { left: 25%; bottom: 15%; animation-delay: 1s; }
    .voice-particle-3 { right: 30%; bottom: 12%; animation-delay: 2s; }
    .voice-particle-4 { right: 15%; bottom: 8%; animation-delay: 3s; }
    .voice-particle-5 { left: 50%; bottom: 20%; animation-delay: 4s; }
    @keyframes voice-particle-rise {
      0% { transform: translateY(0) scale(1); opacity: 0.3; }
      50% { transform: translateY(-300px) scale(0.5); opacity: 0.8; }
      100% { transform: translateY(-600px) scale(0); opacity: 0; }
    }

    .voice-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1200px;
      transform-style: preserve-3d;
      transition: transform 0.15s ease-out;
    }

    .voice-card {
      background: linear-gradient(145deg, var(--card), var(--muted));
      backdrop-filter: blur(32px) saturate(180%);
      -webkit-backdrop-filter: blur(32px) saturate(180%);
      border: 1px solid var(--border);
      border-radius: 32px;
      padding: 64px;
      box-shadow:
        0 40px 80px rgba(0, 0, 0, 0.5),
        inset 0 0 0 1px rgba(255, 255, 255, 0.03);
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
    }

    .voice-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(135deg,
        transparent 0%,
        rgba(var(--accent-rgb), 0.08) 25%,
        rgba(212, 168, 67, 0.06) 50%,
        rgba(var(--accent-rgb), 0.08) 75%,
        transparent 100%
      );
      background-size: 200% 200%;
      animation: voice-shimmer 12s ease-in-out infinite;
      pointer-events: none;
      z-index: 1;
    }
    @keyframes voice-shimmer {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .voice-accent-line {
      position: absolute;
      top: 0; left: 50%;
      width: 80px; height: 3px;
      background: linear-gradient(90deg, var(--accent), var(--gold));
      transform: translateX(-50%);
      border-radius: 0 0 4px 4px;
      z-index: 2;
    }

    .voice-inner {
      display: flex;
      gap: 80px;
      transform: translateZ(50px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 960px) {
      .voice-inner { flex-direction: column; text-align: center; gap: 48px; }
      .voice-card { padding: 48px 28px; border-radius: 36px; }
      .voice-avatar-wrap { margin: 0 auto; }
    }

    .voice-avatar-wrap {
      position: relative;
      width: 220px; height: 220px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(80px);
    }
    .voice-avatar-ring {
      position: absolute;
      inset: -12px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent 0%, var(--accent) 25%, var(--gold) 50%, var(--accent) 75%, transparent 100%);
      animation: voice-ring-spin 20s linear infinite;
      filter: blur(8px);
      opacity: 0.6;
      z-index: -1;
    }
    .voice-avatar-ring-2 {
      position: absolute;
      inset: -28px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent 0%, var(--gold) 25%, var(--accent) 50%, var(--gold) 75%, transparent 100%);
      animation: voice-ring-spin 30s linear infinite reverse;
      filter: blur(12px);
      opacity: 0.4;
      z-index: -2;
    }
    @keyframes voice-ring-spin { to { transform: rotate(360deg); } }

    .voice-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid transparent;
      background: linear-gradient(var(--card), var(--muted)) padding-box,
                  linear-gradient(135deg, var(--accent), var(--gold)) border-box;
      box-shadow:
        0 30px 60px rgba(var(--accent-rgb), 0.25),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      position: relative;
      z-index: 5;
      transition: transform 0.3s ease;
    }
    .voice-avatar-placeholder {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      display: flex; align-items: center; justify-content: center;
      color: #0A0A0F; font-family: 'Space Grotesk', sans-serif;
      font-size: 5rem; font-weight: 700;
      border: 3px solid transparent;
      background: linear-gradient(var(--card), var(--muted)) padding-box,
                  linear-gradient(135deg, var(--accent), var(--gold)) border-box;
    }

    .voice-sound-bars {
      position: absolute;
      bottom: -40px; left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
      z-index: 6;
    }
    .voice-sound-bar {
      width: 6px;
      background: linear-gradient(180deg, var(--accent), var(--gold));
      border-radius: 3px;
      animation: voice-sound-bounce 1.2s ease-in-out infinite;
    }
    .voice-sound-bar:nth-child(1) { height: 40px; animation-delay: 0s; }
    .voice-sound-bar:nth-child(2) { height: 60px; animation-delay: 0.1s; }
    .voice-sound-bar:nth-child(3) { height: 30px; animation-delay: 0.2s; }
    .voice-sound-bar:nth-child(4) { height: 50px; animation-delay: 0.3s; }
    .voice-sound-bar:nth-child(5) { height: 45px; animation-delay: 0.15s; }
    @keyframes voice-sound-bounce {
      0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
      50% { transform: scaleY(1); opacity: 1; }
    }

    .voice-content {
      flex: 1;
      transform-style: preserve-3d;
    }



    .voice-name {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(3rem, 6vw, 6rem);
      font-weight: 400;
      letter-spacing: -0.02em;
      line-height: 1.05;
      margin-bottom: 16px;
      transform: translateZ(60px);
      background: linear-gradient(135deg, var(--text) 0%, var(--accent) 50%, var(--gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .voice-headline {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--gold);
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 32px;
      transform: translateZ(50px);
    }

    .voice-bio {
      font-size: 1.25rem;
      line-height: 1.8;
      color: var(--text-2);
      max-width: 580px;
      font-weight: 300;
      transform: translateZ(40px);
      font-style: italic;
    }

    .voice-quote {
      margin: 48px 0;
      padding-left: 32px;
      border-left: 2px solid;
      border-image: linear-gradient(180deg, var(--accent), var(--gold)) 1;
      transform: translateZ(45px);
    }
    .voice-quote-text {
      font-family: 'DM Serif Display', serif;
      font-size: 1.75rem;
      line-height: 1.4;
      color: var(--text);
      font-weight: 400;
    }
    .voice-quote-author {
      font-size: 0.85rem;
      color: var(--text-2);
      margin-top: 16px;
      font-style: normal;
    }

    .voice-metrics {
      display: flex;
      gap: 24px;
      margin: 48px 0;
      transform: translateZ(45px);
      flex-wrap: wrap;
    }
    .voice-metric {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      padding: 28px 36px;
      border-radius: 20px;
      min-width: 170px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .voice-metric::before {
      content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, var(--accent), var(--gold));
      border-radius: 20px 20px 0 0;
    }
    .voice-metric:hover {
      box-shadow:
        0 25px 50px -15px rgba(var(--accent-rgb), 0.3),
        inset 0 4px 10px rgba(255, 255, 255, 0.05);
      transform: translateY(-10px) scale(1.03);
      border-color: var(--accent);
    }
    .voice-metric-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.1;
    }
    .voice-metric-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--text-2);
      opacity: 0.8;
      margin-top: 8px;
      font-weight: 600;
    }

    .voice-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 56px;
      transform: translateZ(50px);
    }
    .voice-link {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text);
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-decoration: none;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
      overflow: hidden;
    }
    .voice-link:hover {
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.12), rgba(212, 168, 67, 0.08));
      transform: translateY(-8px);
      box-shadow:
        0 25px 50px -15px rgba(var(--accent-rgb), 0.25),
        inset 0 4px 12px rgba(255, 255, 255, 0.05);
      color: var(--accent);
      border-color: var(--accent);
    }
    .voice-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.15), transparent);
      transition: left 0.6s ease;
      mix-blend-mode: overlay;
    }
    .voice-link:hover::after { left: 100%; }
    .voice-link-left { display: flex; align-items: center; gap: 16px; }
    .voice-link-icon {
      width: 56px; height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(212, 168, 67, 0.1));
      display: flex; align-items: center; justify-content: center;
      color: var(--accent);
      transition: all 0.3s;
    }
    .voice-link:hover .voice-link-icon { background: linear-gradient(135deg, var(--accent), var(--gold)); color: #0A0A0F; }
    .voice-link-arrow { color: var(--gold); font-size: 1.6rem; transition: transform 0.3s; }
    .voice-link:hover .voice-link-arrow { transform: translateX(10px) scale(1.1); }
    .voice-link-label { font-family: 'DM Serif Display', serif; font-size: 1.1rem; }
    .voice-link-desc { font-size: 0.7rem; color: var(--text-2); text-transform: uppercase; letter-spacing: 1.5px; }

    .voice-cta {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-top: 40px;
      padding: 20px 48px;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      color: #0A0A0F;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-radius: 60px;
      text-decoration: none;
      box-shadow:
        0 20px 40px rgba(var(--accent-rgb), 0.35),
        inset 0 2px 4px rgba(255, 255, 255, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .voice-cta:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow:
        0 30px 60px rgba(var(--accent-rgb), 0.45),
        inset 0 2px 4px rgba(255, 255, 255, 0.3);
    }

    .voice-float-element {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      border: 1px solid rgba(var(--accent-rgb), 0.3);
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.08), rgba(212, 168, 67, 0.04));
      backdrop-filter: blur(10px) saturate(150%);
    }
    .ve-1 {
      top: -40px; right: -20px;
      width: 140px; height: 140px;
      border-radius: 28px;
      animation: voice-float-3d 15s ease-in-out infinite alternate;
    }
    .ve-2 {
      bottom: -40px; left: -20px;
      width: 100px; height: 100px;
      border-radius: 50%;
      border-style: dashed;
      animation: voice-float-3d 22s ease-in-out infinite alternate-reverse;
    }
    @keyframes voice-float-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-40px) scale(1.08) rotate(30deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .voice-grid, .voice-avatar-ring, .voice-avatar-ring-2,
      .voice-particle, .voice-sound-bar, .voice-float-element,
      .voice-card::before { animation: none !important; transition: none !important; }
    }

    /* Focus visible styles for accessibility */
    .voice-link:focus-visible,
    .voice-cta:focus-visible,
    .voice-metric:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `;

  return (
    <div
      className="voice-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="voice-grid" aria-hidden="true" />
      <div className="voice-atmosphere" aria-hidden="true" />
      <div className="voice-waveform" aria-hidden="true" />

      <span className="voice-particle voice-particle-1" aria-hidden="true" />
      <span className="voice-particle voice-particle-2" aria-hidden="true" />
      <span className="voice-particle voice-particle-3" aria-hidden="true" />
      <span className="voice-particle voice-particle-4" aria-hidden="true" />
      <span className="voice-particle voice-particle-5" aria-hidden="true" />

      <div
        className="voice-container"
        style={{
          transform: `rotateY(${mouse.x * 12}deg) rotateX(${mouse.y * -12}deg)`
        }}
      >
        <div className="voice-float-element ve-1" aria-hidden="true" />
        <div className="voice-float-element ve-2" aria-hidden="true" />

        <div className="voice-card">
          <div className="voice-accent-line" />

          <div className="voice-inner">
            <div className="voice-avatar-wrap">
              <div className="voice-avatar-ring" aria-hidden="true" />
              <div className="voice-avatar-ring-2" aria-hidden="true" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="voice-avatar" />
              ) : (
                <div className="voice-avatar-placeholder">{profile.name?.charAt(0) || 'V'}</div>
              )}
              <div className="voice-sound-bars">
                <span className="voice-sound-bar" />
                <span className="voice-sound-bar" />
                <span className="voice-sound-bar" />
                <span className="voice-sound-bar" />
                <span className="voice-sound-bar" />
              </div>
            </div>

            <div className="voice-content">
              <h1 className="voice-name">{profile.name}</h1>
              <div className="voice-headline">{profile.headline}</div>
              <p className="voice-bio">{profile.bio}</p>

              {(profile.theme as any)?.quote && (
                <div className="voice-quote">
                  <p className="voice-quote-text">"{(profile.theme as any).quote}"</p>
                  <p className="voice-quote-author">— {(profile.theme as any).quoteAuthor || 'Anonymous'}</p>
                </div>
              )}

              {(profile.proofs && profile.proofs.length > 0) || (profile.metrics && profile.metrics.length > 0) ? (
                <div className="voice-metrics">
                  {(profile.proofs || profile.metrics || []).slice(0, 4).map((item: any, i: number) => (
                    <div key={i} className="voice-metric">
                      <div className="voice-metric-value">{item.value || item.count || '—'}</div>
                      <div className="voice-metric-label">{item.title || item.label || item.type || 'METRIC'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="voice-metrics">
                  {profile.role && (
                    <div className="voice-metric">
                      <div className="voice-metric-value">LIVE</div>
                      <div className="voice-metric-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="voice-metric">
                      <div className="voice-metric-value">ORG</div>
                      <div className="voice-metric-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="voice-metric">
                      <div className="voice-metric-value">LOC</div>
                      <div className="voice-metric-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="voice"
                accentColor={accent}
                autoScroll={profile.autoScroll}
              />

              {profile.links && profile.links.length > 0 && (
                <div className="voice-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="voice-link">
                      <div className="voice-link-left">
                        <div className="voice-link-icon">
                          {getSharedLinkIcon(link.label, link.url)}
                        </div>
                        <div>
                          <span className="voice-link-label">{link.label}</span>
                          {link.description && (
                            <div className="voice-link-desc">{link.description}</div>
                          )}
                        </div>
                      </div>
                      <span className="voice-link-arrow">→</span>
                    </a>
                  ))}
                </div>
              )}

              {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="voice-cta"
              >
                <span aria-hidden="true">✉</span> Get in Touch
              </a>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}