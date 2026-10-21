'use client';

import { useState, useRef } from 'react';
import { ExternalLink, Github, Linkedin, Instagram } from 'lucide-react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';

interface RebellionTemplateProps {
  profile: any;
  accentColor?: string;
}

export function RebellionTemplate({ profile, accentColor }: RebellionTemplateProps) {
  const accent = accentColor || '#C8102E';
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Cinzel:wght@400;600;700;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    .reb-wrap {
      --crimson: ${accent};
      --crimson-rgb: 200, 16, 46;
      --gold: #C9993A;
      --gold-rgb: 201, 153, 58;
      --bg: #1A0F0F;
      --text: #F5EEE6;
      --text-2: #C9B8A8;
      --text-3: #8B7A6A;
      --card: #1F1212;
      --card-elevated: #2A1A1A;
      --border: #3D2A2A;

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
      padding: 40px 20px;
    }

    /* Deep atmospheric background */
    .reb-bg-layer {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(var(--crimson-rgb), 0.15) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 100% 100%, rgba(var(--gold-rgb), 0.1) 0%, transparent 50%),
        radial-gradient(ellipse 50% 30% at 0% 100%, rgba(var(--crimson-rgb), 0.08) 0%, transparent 50%);
    }
    .reb-bg-noise {
      position: absolute;
      inset: 0;
      z-index: 1;
      opacity: 0.03;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }
    .reb-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 1;
      opacity: 0.4;
      transition: transform 0.6s ease-out;
    }
    .reb-orb-1 { width: 400px; height: 400px; top: -100px; right: -100px; background: radial-gradient(circle, rgba(var(--crimson-rgb), 0.5) 0%, transparent 70%); }
    .reb-orb-2 { width: 300px; height: 300px; bottom: -50px; left: -50px; background: radial-gradient(circle, rgba(var(--gold-rgb), 0.4) 0%, transparent 70%); }
    .reb-orb-3 { width: 200px; height: 200px; top: 40%; left: 10%; background: radial-gradient(circle, rgba(var(--crimson-rgb), 0.3) 0%, transparent 70%); animation: reb-orb-float 8s ease-in-out infinite; }
    @keyframes reb-orb-float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }

    .reb-frame {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1200px;
      background: linear-gradient(145deg, var(--card), var(--card-elevated));
      border: 1.5px solid var(--border);
      border-radius: 32px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.03) inset,
        0 30px 60px -10px rgba(0,0,0,0.5),
        0 0 120px -20px rgba(var(--crimson-rgb), 0.15);
      transform-style: preserve-3d;
    }

    /* ── HEADER ── */
    .reb-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 28px 40px; margin-bottom: 8px;
      border-bottom: 1px solid rgba(var(--gold-rgb), 0.15);
    }
    .reb-logo {
      font-family: 'Uncial Antiqua', cursive;
      font-size: 1.8rem; color: var(--gold);
      text-decoration: none; letter-spacing: 1px;
      display: flex; align-items: center; gap: 10px;
    }
    .reb-crown-icon { font-size: 1.5rem; animation: reb-crown-float 3s ease-in-out infinite; }
    @keyframes reb-crown-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    .reb-nav-right { display: flex; align-items: center; gap: 24px; }
    .reb-tagline {
      font-family: 'Cinzel', serif; font-size: 0.85rem; letter-spacing: 3px;
      text-transform: uppercase; color: var(--gold); opacity: 0.8;
    }
    .reb-year {
      font-family: 'Cinzel', serif; font-size: 0.75rem; letter-spacing: 4px;
      color: var(--text-3); background: rgba(var(--gold-rgb), 0.1);
      padding: 6px 16px; border-radius: 50px; border: 1px solid rgba(var(--gold-rgb), 0.2);
    }

    /* ── HERO ── */
    .reb-hero {
      display: flex; align-items: stretch; justify-content: space-between;
      gap: 48px; padding: 48px 40px 32px;
      position: relative;
    }
    .reb-deco-container { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
    .reb-float-crown {
      position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
      font-size: 4rem; animation: reb-crown-orbit 6s ease-in-out infinite;
      text-shadow: 0 0 40px rgba(var(--gold-rgb), 0.6), 0 0 80px rgba(var(--crimson-rgb), 0.3);
    }
    @keyframes reb-crown-orbit { 0%,100%{transform:translateX(-50%) rotate(-5deg)} 50%{transform:translateX(-50%) rotate(5deg)} }
    .reb-sparkle {
      position: absolute; font-size: 1.2rem; color: var(--gold);
      animation: reb-sparkle 2.5s ease-in-out infinite; opacity: 0;
    }
    .reb-sparkle-1 { top: 15%; left: 20%; animation-delay: 0s; }
    .reb-sparkle-2 { top: 25%; right: 15%; animation-delay: 0.7s; }
    @keyframes reb-sparkle { 0%,100%{opacity:0;transform:scale(0.5)} 50%{opacity:1;transform:scale(1.2)} }
    .reb-float-orb {
      position: absolute; width: 60px; height: 60px; border-radius: 50%;
      background: radial-gradient(circle, rgba(var(--gold-rgb), 0.4), transparent);
      filter: blur(12px); animation: reb-orb-drift 10s ease-in-out infinite;
    }
    .reb-float-orb-a { top: 30%; right: 10%; animation-delay: 0s; }
    .reb-float-orb-b { bottom: 20%; left: 15%; animation-delay: 3s; }
    @keyframes reb-orb-drift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-15px) scale(1.2)} }

    .reb-hero-left { flex: 1; display: flex; flex-direction: column; justify-content: center; padding-right: 40px; transform: translateZ(40px); }
    .reb-eyebrow {
      font-family: 'Cinzel', serif; font-size: 0.75rem; letter-spacing: 4px;
      text-transform: uppercase; color: var(--gold); margin-bottom: 16px; opacity: 0.9;
    }
    .reb-name {
      font-family: 'Cinzel', serif; font-weight: 900; font-size: clamp(3.5rem, 6vw, 5.5rem);
      line-height: 0.95; letter-spacing: -0.02em; color: var(--text); margin-bottom: 16px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .reb-role-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .reb-role-gem {
      width: 10px; height: 10px; border-radius: 50%;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      box-shadow: 0 0 12px var(--crimson), 0 0 24px var(--gold);
      animation: reb-gem-pulse 2s ease-in-out infinite;
    }
    @keyframes reb-gem-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
    .reb-role {
      font-family: 'Cinzel', serif; font-size: 1.6rem; font-weight: 600;
      background: linear-gradient(135deg, var(--gold), var(--crimson));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .reb-bio {
      font-family: 'DM Sans', sans-serif; font-size: 1.1rem; line-height: 1.85;
      color: var(--text-2); max-width: 520px; font-weight: 400;
    }

    /* ── 3D TILT CARD ── */
    .reb-card-3d-wrap {
      flex-shrink: 0; width: 380px; max-width: 45%; perspective: 1000px;
      transform-style: preserve-3d; transform: translateZ(60px);
    }
    .reb-card-3d {
      width: 100%; aspect-ratio: 3/4; border-radius: 24px;
      background: linear-gradient(145deg, var(--card-elevated), var(--card));
      border: 1.5px solid var(--border);
      box-shadow: 0 20px 50px -5px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04);
      transform-style: preserve-3d; transition: transform 0.1s linear;
      position: relative; overflow: hidden;
    }
    .reb-card-3d::before {
      content: ""; position: absolute; inset: 0; border-radius: 24px;
      background: linear-gradient(135deg, rgba(var(--gold-rgb), 0.1), transparent 50%, rgba(var(--crimson-rgb), 0.05));
      pointer-events: none; z-index: 1;
    }
    .reb-card-face { padding: 36px; position: relative; z-index: 2; display: flex; flex-direction: column; height: 100%; }
    .reb-avatar-ring {
      width: 120px; height: 120px; margin: 0 auto 24px; position: relative;
    }
    .reb-avatar-ring::before {
      content: ""; position: absolute; inset: -6px; border-radius: 50%;
      background: conic-gradient(from 0deg, var(--crimson), var(--gold), var(--crimson));
      animation: reb-ring-spin 8s linear infinite; z-index: -1; filter: blur(8px);
    }
    @keyframes reb-ring-spin { to { transform: rotate(360deg); } }
    .reb-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #1A0F0F; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .reb-avatar-placeholder { width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, var(--crimson), var(--gold)); display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Cinzel', serif; font-size: 3rem; font-weight: 700; }
    .reb-card-name { font-family: 'Cinzel', serif; font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 6px; color: var(--text); }
    .reb-card-title { font-family: 'Cinzel', serif; font-size: 0.95rem; font-weight: 400; text-align: center; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
    .reb-stat-row { display: flex; justify-content: space-around; gap: 12px; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(var(--gold-rgb), 0.15); }
    .reb-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .reb-stat strong { font-family: 'Cinzel', serif; font-size: 1.4rem; font-weight: 700; background: linear-gradient(135deg, var(--gold), var(--crimson)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .reb-stat span { font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; color: var(--text-3); }

    /* ── MARQUEE RIBBON ── */
    .reb-ribbon-wrap { padding: 0 40px; margin-bottom: 16px; overflow: hidden; position: relative; }
    .reb-ribbon-wrap::before, .reb-ribbon-wrap::after {
      content: ""; position: absolute; top: 50%; width: 60px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }
    .reb-ribbon-wrap::before { left: 0; transform: translateY(-50%); }
    .reb-ribbon-wrap::after { right: 0; transform: translateY(-50%); }
    .reb-ribbon { white-space: nowrap; }
    .reb-ribbon-track {
      display: inline-block; animation: reb-marquee 30s linear infinite;
      font-family: 'Cinzel', serif; font-size: 0.85rem; letter-spacing: 2px;
      text-transform: uppercase; color: var(--gold); opacity: 0.6;
    }
    @keyframes reb-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    .reb-ribbon-sep { margin: 0 32px; display: inline-block; animation: reb-sep-pulse 2s ease-in-out infinite; }
    @keyframes reb-sep-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }

    /* ── LINKS ── */
    .reb-section-label { padding: 0 40px 16px; }
    .reb-section-label h2 { font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); }
    .reb-links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding: 0 40px 24px; }
    .reb-link-card {
      position: relative; text-decoration: none; color: var(--text);
      background: linear-gradient(145deg, var(--card-elevated), var(--card));
      border: 1.5px solid var(--border); border-radius: 20px;
      padding: 24px 24px 20px; display: flex; flex-direction: column; gap: 14px;
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); transform-style: preserve-3d;
    }
    .reb-link-card:hover {
      border-color: rgba(var(--gold-rgb), 0.5); transform: translateY(-6px) scale(1.015);
      box-shadow: 0 20px 40px -10px rgba(var(--crimson-rgb), 0.3), 0 0 0 1px rgba(var(--gold-rgb), 0.2) inset;
      z-index: 10;
    }
    .reb-link-icon-wrap { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(145deg, rgba(var(--crimson-rgb), 0.15), rgba(var(--gold-rgb), 0.1)); display: flex; align-items: center; justify-content: center; color: var(--gold); transition: all 0.3s; }
    .reb-link-card:hover .reb-link-icon-wrap { background: linear-gradient(135deg, var(--crimson), var(--gold)); color: #fff; }
    .reb-link-title { font-family: 'Cinzel', serif; font-size: 1.05rem; font-weight: 600; letter-spacing: 1px; }
    .reb-link-sub { font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; color: var(--text-3); }
    .reb-link-arrow { align-self: flex-end; font-size: 1.4rem; color: var(--gold); transition: transform 0.3s; }
    .reb-link-card:hover .reb-link-arrow { transform: translateX(6px); }

    /* ── BIO SECTION ── */
    .reb-bio-section { padding: 32px 40px; margin: 0 40px 24px; border-radius: 22px; background: linear-gradient(145deg, rgba(255,252,246,0.95), rgba(248,240,226,0.9)); border: 1.5px solid rgba(var(--gold-rgb), 0.2); font-family: 'Uncial Antiqua', cursive; font-style: italic; font-size: 1.15rem; line-height: 1.9; color: var(--text-2); max-width: 640px; }

    /* ── RECENT ACTIVITY ── */
    .reb-activity { padding: 0 40px 32px; }

    /* ── CTA SECTION ── */
    .reb-cta-section {
      margin: 16px 40px 32px; padding: 48px; border-radius: 28px;
      background: linear-gradient(145deg, var(--card-elevated), var(--card));
      border: 1.5px solid rgba(var(--gold-rgb), 0.3); position: relative; overflow: hidden; text-align: center;
    }
    .reb-cta-crest { position: absolute; font-size: 5rem; line-height: 1; opacity: 0.04; pointer-events: none; font-family: 'Uncial Antiqua', cursive; color: var(--crimson); }
    .reb-cta-crest-tl { top: -10px; left: 20px; }
    .reb-cta-crest-br { bottom: -10px; right: 20px; transform: rotate(180deg); }
    .reb-cta-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 32px; position: relative; z-index: 1; }
    .reb-cta-left h2 { font-family: 'Cinzel', serif; font-weight: 900; font-style: italic; font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.1; background: linear-gradient(135deg, var(--crimson), var(--gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; }
    .reb-cta-left p { color: var(--text-2); font-size: 1rem; max-width: 380px; }
    .reb-cta-btn {
      display: inline-flex; align-items: center; gap: 14px; padding: 18px 40px; border-radius: 50px;
      background: linear-gradient(135deg, var(--crimson) 0%, #A00020 50%, #8A001A 100%);
      color: #fff; font-family: 'Cinzel', serif; font-weight: 600; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;
      box-shadow: 0 8px 32px rgba(var(--crimson-rgb), 0.3), 0 2px 8px rgba(var(--crimson-rgb), 0.2), inset 0 1px 0 rgba(255,255,255,0.15);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s; position: relative; overflow: hidden;
    }
    .reb-cta-btn::before { content: ""; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%); background-size: 200% 100%; background-position: -100% 0; transition: background-position 0.5s; }
    .reb-cta-btn:hover::before { background-position: 150% 0; }
    .reb-cta-btn:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 16px 48px rgba(var(--crimson-rgb), 0.38), 0 4px 16px rgba(var(--crimson-rgb), 0.2); }
    .reb-cta-btn-icon { font-size: 1.1rem; transition: transform 0.3s; }
    .reb-cta-btn:hover .reb-cta-btn-icon { transform: translateX(4px); }
    .reb-cta-btn-sec {
      display: inline-flex; align-items: center; gap: 12px; padding: 18px 36px; border-radius: 50px;
      background: transparent; color: var(--gold); font-family: 'Cinzel', serif; font-weight: 600; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;
      border: 1.5px solid rgba(var(--gold-rgb), 0.45); transition: all 0.3s;
    }
    .reb-cta-btn-sec:hover { background: rgba(var(--gold-rgb), 0.08); border-color: var(--gold); transform: translateY(-3px); }
    .reb-cta-buttons { display: flex; flex-wrap: wrap; gap: 14px; }

    /* ── FOOTER LINE ── */
    .reb-footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(var(--gold-rgb), 0.2); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 24px 40px 32px; }
    .reb-footer-brand { font-family: 'Cinzel', serif; font-size: 0.72rem; letter-spacing: 3px; text-transform: uppercase; color: var(--text-3); }
    .reb-footer-dots { display: flex; gap: 8px; align-items: center; }
    .reb-dot { width: 6px; height: 6px; border-radius: 50%; background: linear-gradient(135deg, var(--crimson), var(--gold)); animation: reb-dot-pulse 2.5s ease-in-out infinite; }
    .reb-dot:nth-child(2) { animation-delay: 0.4s; opacity: 0.6; }
    .reb-dot:nth-child(3) { animation-delay: 0.8s; opacity: 0.35; }
    @keyframes reb-dot-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }

    /* ── RESPONSIVE ── */
    @media (max-width: 1024px) {
      .reb-hero { flex-direction: column; gap: 40px; text-align: center; }
      .reb-hero-left { padding-right: 0; margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; order: 2; transform: none; }
      .reb-bio { text-align: center; margin: 0 auto; }
      .reb-card-3d-wrap { max-width: 380px; margin: 0 auto; width: 100%; order: 1; }
      .reb-float-crown, .reb-sparkle, .reb-float-orb { display: none; }
    }
    @media (max-width: 640px) {
      .reb-wrap { padding: 36px 16px; }
      .reb-frame { padding: 24px 20px; border-radius: 24px; }
      .reb-header { flex-direction: column; gap: 20px; margin-bottom: 40px; }
      .reb-nav-right { gap: 10px; width: 100%; justify-content: center; }
      .reb-year { display: none; }
      .reb-name { font-size: clamp(3.2rem, 12vw, 4.5rem); line-height: 0.95; }
      .reb-role-row { flex-wrap: wrap; justify-content: center; margin: 8px 0 20px; }
      .reb-role { font-size: 1.2rem; text-align: center; }
      .reb-card-3d { aspect-ratio: auto; min-height: 400px; }
      .reb-card-face { padding: 32px 20px; }
      .reb-stat-row { gap: 8px; }
      .reb-links-grid { grid-template-columns: 1fr; }
      .reb-link-card { padding: 24px 20px 20px; }
      .reb-cta-section { padding: 40px 24px; text-align: center; }
      .reb-cta-inner { flex-direction: column; align-items: center; gap: 24px; }
      .reb-cta-left p { text-align: center; margin: 0 auto; }
      .reb-cta-buttons { justify-content: center; width: 100%; flex-direction: column; }
      .reb-cta-btn, .reb-cta-btn-sec { width: 100%; justify-content: center; }
      .reb-footer { flex-direction: column; text-align: center; gap: 20px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .reb-orb-3, .reb-float-crown, .reb-sparkle, .reb-float-orb, .reb-ribbon-track, .reb-ring-spin, .reb-gem-pulse, .reb-crown-float, .reb-crown-orbit, .reb-sep-pulse, .reb-dot-pulse, .reb-orb-drift { animation: none !important; transition: none !important; }
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

  const getLinkSubtitle = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('github')) return 'Code & Repos';
    if (lower.includes('linkedin')) return 'Professional';
    if (lower.includes('instagram')) return 'Visual Stories';
    if (lower.includes('twitter') || lower.includes('x.com')) return 'Thoughts';
    return 'External Link';
  };

  return (
    <div className="reb-wrap">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="reb-bg-layer" />
      <div className="reb-bg-noise" />
      <div className="reb-orb reb-orb-1" />
      <div className="reb-orb reb-orb-2" />
      <div className="reb-orb reb-orb-3" />

      <div className="reb-frame" ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

        {/* Ambient background orbs */}
        <div className="reb-orb reb-orb-1" />
        <div className="reb-orb reb-orb-2" />
        <div className="reb-orb reb-orb-3" />

        {/* ── HEADER ── */}
        <header className="reb-header">
          <a className="reb-logo" href="#top">
            <span className="reb-crown-icon">♛</span>
            The Rebellion
          </a>
          <div className="reb-nav-right">
            <span className="reb-tagline">We challenge the industry.</span>
            <span className="reb-year">Est. 2026</span>
          </div>
        </header>

        {/* ── HERO ── */}
        <section id="top" className="reb-hero" style={{ position: 'relative' }}>
          <div className="reb-deco-container" aria-hidden="true">
            <div className="reb-float-crown">♛</div>
            <span className="reb-sparkle reb-sparkle-1">✦</span>
            <span className="reb-sparkle reb-sparkle-2">✦</span>
            <div className="reb-float-orb reb-float-orb-a" />
            <div className="reb-float-orb reb-float-orb-b" />
          </div>

          <div className="reb-hero-left">
            <div className="reb-eyebrow">Disruptive · Royal · Rebellion</div>
            <h1 className="reb-name">{profile.name}</h1>
            <div className="reb-role-row">
              <div className="reb-role-gem" />
              <span className="reb-role">{profile.headline}</span>
            </div>
            <p className="reb-bio">{profile.bio}</p>
          </div>

          <div className="reb-card-3d-wrap" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} ref={cardRef}>
            <div className="reb-card-3d" style={{ transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}>
              <div className="reb-card-face">
                <div className="reb-avatar-ring">
                  {profile.avatarUrl ? (
                    <img className="reb-avatar-img" src={profile.avatarUrl} alt={profile.name} />
                  ) : (
                    <div className="reb-avatar-placeholder">{profile.name?.[0] || 'R'}</div>
                  )}
                </div>
                <div className="reb-card-name">{profile.name}</div>
                <div className="reb-card-title">{profile.headline}</div>

                {profile.proofs && profile.proofs.length > 0 ? (
                  <div className="reb-stat-row">
                    {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                      <div key={i} className="reb-stat">
                        <strong>{proof.value}</strong>
                        <span>{proof.title || proof.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reb-stat-row">
                    {profile.role && (
                      <div className="reb-stat">
                        <strong>{profile.role}</strong>
                        <span>Role</span>
                      </div>
                    )}
                    {profile.company && (
                      <div className="reb-stat">
                        <strong>{profile.company}</strong>
                        <span>Company</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE RIBBON ── */}
        <div className="reb-ribbon-wrap">
          <div className="reb-ribbon">
            <div className="reb-ribbon-track">
              <span>Crowned in Defiance</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Architects of the New Reign</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Forging Empires from Echoes</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Sovereignty in Motion</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>The Throne of Innovation</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Crowned in Defiance</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Architects of the New Reign</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Forging Empires from Echoes</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Sovereignty in Motion</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>The Throne of Innovation</span><span className="reb-ribbon-sep"> ✦ </span>
            </div>
          </div>
        </div>

        {/* ── LINKS ── */}
        {profile.links && profile.links.length > 0 && (
          <>
            <div className="reb-section-label">
              <h2>Connect & Explore</h2>
            </div>
            <nav className="reb-links-grid">
              {profile.links.map((link: any, i: number) => (
                <a key={i} className="reb-link-card" href={link.url} target="_blank" rel="noopener noreferrer" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                  <div className="reb-link-icon-wrap">{getLinkIcon(link.label || link.platform, link.url)}</div>
                  <div className="reb-link-title">{link.label || link.platform}</div>
                  <div className="reb-link-sub">{getLinkSubtitle(link.label || link.platform)}</div>
                  <div className="reb-link-arrow">↗</div>
                </a>
              ))}
            </nav>
          </>
        )}

        {/* ── BIO SECTION ── */}
        {(!profile.links || profile.links.length === 0) && profile.bio && (
          <>
            <div className="reb-section-label"><h2>About</h2></div>
            <div style={{ padding: '32px', borderRadius: '22px', background: 'linear-gradient(145deg, rgba(255,252,246,0.95), rgba(248,240,226,0.9))', border: '1.5px solid rgba(201,153,58,0.2)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1.15rem', lineHeight: '1.9', color: 'var(--text-2)', maxWidth: '640px' }}>"{profile.bio}"</div>
          </>
        )}

        <div className="reb-activity">
          <RecentActivitySection activity={profile.recentActivity} variant="rebellion" accentColor={accent} autoScroll={profile.autoScroll} />
        </div>

        {/* ── CTA SECTION ── */}
        {(profile.links?.length > 0 || profile.email) && (
          <section className="reb-cta-section">
            <span className="reb-cta-crest reb-cta-crest-tl">♛</span>
            <span className="reb-cta-crest reb-cta-crest-br">♛</span>
            <div className="reb-cta-inner">
              <div className="reb-cta-left">
                <h2>Start Something Extraordinary.</h2>
                <p>Join the rebellion — challenge convention, redefine the rules, and build something that matters.</p>
              </div>
              <div className="reb-cta-buttons">
                <a className="reb-cta-btn" href={profile.email ? `mailto:${profile.email}` : (profile.links?.[0]?.url || '#')}>Get in Touch — Work with {profile.name?.split(' ')[0] || 'Us'}<span className="reb-cta-btn-icon">→</span></a>
                {profile.links?.[0] && profile.email && (
                  <a className="reb-cta-btn-sec" href={profile.links[0].url} target="_blank" rel="noopener noreferrer">♛ &nbsp;Follow</a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="reb-footer">
          <span className="reb-footer-brand">The Rebellion · {profile.name} · 2026</span>
          <div className="reb-footer-dots"><div className="reb-dot" /><div className="reb-dot" /><div className="reb-dot" /></div>
        </footer>

      </div>
    </div>
  );
}