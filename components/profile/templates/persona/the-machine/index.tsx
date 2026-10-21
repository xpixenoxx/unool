'use client';

import { useState, useRef } from 'react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon as getSharedLinkIcon } from '@/components/profile/templates/utils/socialIcons';

interface MachineTemplateProps {
  profile: any;
  accentColor?: string;
}

export function MachineTemplate({ profile, accentColor }: MachineTemplateProps) {
  const accent = accentColor || '#FF3366';
  const name = profile?.name || "SYS.ADMIN";

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700;900&family=Syne:wght@600;800&display=swap');

    .machine-wrap {
      --m-accent: ${accent};
      --m-text: #1a1a1a;
      font-family: 'Space Grotesk', sans-serif;
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow-x: hidden;
      background: linear-gradient(-45deg, #FFE5E5, #E5F3FF, #E8FFE5, #FFE5F9);
      background-size: 300% 300%;
      animation: gradientBG 15s ease infinite;
      color: var(--m-text);
    }

    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .m-giant-name {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Syne', sans-serif;
      font-size: clamp(8rem, 20vw, 25rem);
      font-weight: 800;
      color: rgba(0, 0, 0, 0.03);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: -0.05em;
    }

    .m-canvas {
      position: relative;
      z-index: 10;
      max-width: 1400px;
      margin: 0 auto;
      padding: 100px 5%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .m-canvas {
        grid-template-columns: 1fr;
        padding: 50px 5%;
        gap: 40px;
      }
    }

    .m-info-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
      order: 2;
    }
    @media (max-width: 900px) {
      .m-info-col {
        align-items: center;
        text-align: center;
        order: 1;
      }
    }

    .m-conversation-btn {
      display: inline-block;
      margin-top: 30px;
      padding: 16px 36px;
      background: var(--m-text);
      color: #fff;
      font-size: 1.1rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 50px;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .m-conversation-btn:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      background: var(--m-accent);
      color: #fff;
    }

    .m-avatar-container {
      position: relative;
      margin-bottom: 40px;
    }

    .m-avatar-img {
      width: clamp(200px, 25vw, 320px);
      height: clamp(200px, 25vw, 320px);
      border-radius: 40px;
      object-fit: cover;
      box-shadow:
        20px 20px 50px rgba(0,0,0,0.1),
        inset 0 0 0 4px rgba(255,255,255,0.8);
      transform: rotate(5deg);
      transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .m-avatar-container:hover .m-avatar-img {
      transform: rotate(0deg) scale(1.02);
    }

    .m-role-badge {
      position: absolute;
      bottom: -20px;
      left: -30px;
      background: var(--m-accent);
      color: #fff;
      font-family: 'Syne', sans-serif;
      padding: 15px 30px;
      border-radius: 100px;
      font-size: 0.9rem;
      font-weight: 800;
      letter-spacing: 2px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.15);
      transform: rotate(-10deg);
      white-space: nowrap;
    }

    .m-bio-panel {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      border-radius: 30px;
      padding: 40px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      max-width: 500px;
      margin-top: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.05);
    }

    .m-bio-text {
      font-size: 1.1rem;
      line-height: 1.6;
      color: var(--m-text);
      font-weight: 500;
    }

    .m-metrics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 40px;
    }
    @media (max-width: 900px) {
      .m-metrics-grid { justify-content: center; }
    }

    .m-metric-item {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: rgba(255,255,255,0.5);
      padding: 20px 30px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 10px 20px rgba(0,0,0,0.04);
    }
    .m-metric-val {
      font-family: 'Syne', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      color: var(--m-text);
      line-height: 1;
      margin-bottom: 5px;
    }
    .m-metric-lbl {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--m-accent);
      font-weight: 700;
    }

    .m-deck-col {
      display: flex;
      flex-direction: column;
      margin-top: 50px;
      order: 1;
    }
    @media (max-width: 900px) {
      .m-deck-col { order: 2; margin-top: 20px; }
    }

    .m-deck-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.2rem;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--m-text);
      margin-bottom: 40px;
      padding-left: 20px;
      border-left: 3px solid var(--m-accent);
      font-weight: 800;
    }

    .m-link-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 2px solid #fff;
      border-radius: 24px;
      padding: 25px 30px;
      text-decoration: none;
      color: var(--m-text);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      margin-bottom: -15px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.06), inset 0 4px 10px rgba(255,255,255,0.5);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1;
    }

    .m-link-card:nth-child(odd) {
      transform: rotate(-2deg) translateX(-5px);
    }
    .m-link-card:nth-child(even) {
      transform: rotate(2deg) translateX(5px);
    }

    .m-link-card:hover {
      transform: rotate(0) scale(1.05) translateY(-15px) !important;
      z-index: 10;
      background: rgba(255, 255, 255, 0.95);
      border-color: var(--m-accent);
      box-shadow: 0 30px 60px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,1);
    }

    .m-link-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .m-link-title {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .m-link-sub {
      font-size: 0.8rem;
      color: var(--m-accent);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
    }

    .m-link-arrow {
      width: 45px; height: 45px;
      border-radius: 50%;
      background: var(--m-text);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.4s;
      color: #fff;
    }
    .m-link-card:hover .m-link-arrow {
      background: var(--m-accent);
      transform: rotate(45deg);
    }

    @media (prefers-reduced-motion: reduce) {
      .m-avatar-img, .m-link-card, .m-giant-name { animation: none !important; transition: none !important; }
    }
  `;

  return (
    <div className="machine-wrap">
      <style>{customStyles}</style>

      <div className="m-giant-name">{name}</div>

      <div className="m-canvas">

        <div className="m-info-col">

          <div className="m-avatar-container">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={name} className="m-avatar-img" />
            ) : (
              <div className="m-avatar-img flex items-center justify-center bg-white text-[var(--m-accent)] text-6xl font-bold">
                {name[0]}
              </div>
            )}
            <div className="m-role-badge">{profile.headline || profile.role || "ENGINEER"}</div>
          </div>

          {profile.bio && (
            <div className="m-bio-panel">
              <div className="m-bio-text">{profile.bio}</div>
            </div>
          )}

          <a
            href={profile.email ? `mailto:${profile.email}` : '#'}
            className="m-conversation-btn"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
          >
            <span>✉</span> Get in Touch
          </a>

          {(profile.theme as any)?.conversationUrl && (
            <a
              href={(profile.theme as any).conversationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="m-conversation-btn"
            >
              Start a Conversation
            </a>
          )}

          {profile.proofPoints && profile.proofPoints.length > 0 && (
            <div className="m-metrics-grid" style={{ marginTop: '30px' }}>
              {profile.proofPoints.map((point: any, i: number) => {
                const val = point.value || point.subtitle || (typeof point === 'string' ? point : point.title);
                const lbl = point.type || point.label || (point.subtitle ? point.title : 'STATS');
                return (
                  <div key={i} className="m-metric-item">
                    <span className="m-metric-val">{val}</span>
                    <span className="m-metric-lbl">{lbl}</span>
                  </div>
                );
              })}
            </div>
          )}

          {profile.metrics && profile.metrics.length > 0 && (
            <div className="m-metrics-grid">
              {profile.metrics.map((m: any, i: number) => (
                <div key={i} className="m-metric-item">
                  <span className="m-metric-val">{m.value}</span>
                  <span className="m-metric-lbl">{m.label || m.title || m.name}</span>
                </div>
              ))}
            </div>
          )}

          <RecentActivitySection
            activity={profile.recentActivity}
            variant="machine"
            accentColor={accent}
            autoScroll={profile.autoScroll}
          />
        </div>

        <div className="m-deck-col">
          <div className="m-deck-title">Access Modules</div>
          <div className="m-deck-wrapper">
            {profile.links?.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="m-link-card">
                <div className="m-link-info flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white">
                    {getSharedLinkIcon(link.label, link.url, link.icon, 'w-4 h-4')}
                  </div>
                  <div>
                    <span className="m-link-title">{link.label}</span>
                    <span className="m-link-sub">SYS.MOD // {i.toString().padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="m-link-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}