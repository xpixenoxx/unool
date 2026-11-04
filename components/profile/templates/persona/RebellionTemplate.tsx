'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { getTemplateById } from '@/components/profile/templates/registry';
import { motion } from 'framer-motion';
import { Menu, BadgeCheck, ArrowRight, Bookmark, Send, Quote, Github, Linkedin, Instagram, ExternalLink, Users, Link as LinkIcon, Eye } from 'lucide-react';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { ClubTemplate } from './ClubTemplate';
import { ClubTemplateV2 } from './ClubTemplateV2';
import { StudioTemplate } from './StudioTemplate';
import { SocialIcon, getSocialSvgPath, renderSocialOrIcon, normalizeSocialPlatform } from '@/components/profile/SocialBrandIcons';

export function RebellionTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#C8102E';
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;
    setTilt({ x, y });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const getLinkSubtitle = (label: string) => {
    const l = label?.toLowerCase() || '';
    if (l.includes('youtube')) return 'Watch';
    if (l.includes('hackerrank') || l.includes('leetcode')) return 'Solve';
    if (l.includes('github') || l.includes('gitlab')) return 'Build';
    if (l.includes('instagram')) return 'Follow';
    if (l.includes('twitter') || l.includes('x.com')) return 'Follow';
    if (l.includes('linkedin')) return 'Connect';
    if (l.includes('discord')) return 'Join';
    if (l.includes('twitch')) return 'Stream';
    if (l.includes('telegram')) return 'Join';
    if (l.includes('tiktok')) return 'Watch';
    return 'Visit';
  };

  const getLinkIcon = (label: string, url?: string) => {
    return <SocialIcon label={label} url={url} className="w-5 h-5 fill-current" />;
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700;900&display=swap');

    /* ── RESET & ROOT ── */
    .reb-wrap *, .reb-wrap *::before, .reb-wrap *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .reb-wrap a { text-decoration: none; }

    .reb-wrap {
      --crimson:   ${accent};
      --crimson-l: color-mix(in srgb, ${accent} 70%, #fff);
      --gold:      #C9993A;
      --gold-l:    #E8C97A;
      --gold-pale: rgba(201, 153, 58, 0.18);
      --ivory:     #FEFAF3;
      --parchment: #F8F1E4;
      --parchment2:#F2E8D6;
      --blush:     #FAF0EE;
      --text:      #2C1810;
      --text-2:    #6B4C3B;
      --text-3:    #9E7B68;
      --serif:     'Playfair Display', Georgia, serif;
      --royal:     'Cinzel', 'Times New Roman', serif;
      --sans:      'Inter', -apple-system, sans-serif;
      --radius:    20px;
      --shadow-gold: 0 8px 40px rgba(201, 153, 58, 0.18);
      --shadow-crim: 0 8px 40px rgba(200, 16, 46, 0.12);

      font-family: var(--sans);
      background: #E8E0D5;
      padding: clamp(20px, 4vw, 48px);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* ── AMBIENT BACKGROUND ORBS ── */
    .reb-orb {
      position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
      filter: blur(60px); opacity: 0.55;
    }
    .reb-orb-1 {
      width: 500px; height: 500px; top: -100px; right: -100px;
      background: radial-gradient(circle, rgba(200,16,46,0.12), transparent 70%);
      animation: reb-drift1 18s ease-in-out infinite;
    }
    .reb-orb-2 {
      width: 600px; height: 600px; bottom: -150px; left: -100px;
      background: radial-gradient(circle, rgba(201,153,58,0.1), transparent 70%);
      animation: reb-drift2 22s ease-in-out infinite;
    }
    .reb-orb-3 {
      width: 300px; height: 300px; top: 40%; left: 30%;
      background: radial-gradient(circle, rgba(255, 220, 180, 0.2), transparent 70%);
      animation: reb-drift1 14s ease-in-out infinite reverse;
    }
    @keyframes reb-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.05)} }
    @keyframes reb-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }

    /* ── MAIN FRAME ── */
    .reb-frame {
      max-width: 1280px; margin: 0 auto;
      padding: clamp(24px, 5vw, 48px);
      position: relative; z-index: 1;
      background: radial-gradient(ellipse 120% 80% at 50% 0%, #FFF8EE 0%, #FBF3E3 35%, #F6EAD5 65%, #F0E0C5 100%);
      border-radius: 32px;
      box-shadow: 0 24px 80px rgba(110, 70, 50, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(201,153,58,0.25);
      overflow: hidden;
    }

    /* ── HEADER ── */
    .reb-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 40px;
    }
    .reb-logo {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--royal); font-size: 0.85rem; font-weight: 600;
      letter-spacing: 3px; text-transform: uppercase;
      color: var(--gold);
      padding: 10px 22px; border: 1.5px solid rgba(201,153,58,0.4);
      border-radius: 50px;
      background: linear-gradient(135deg, rgba(255,248,235,0.9), rgba(242,232,214,0.9));
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 16px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .reb-logo:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(201,153,58,0.2); }
    .reb-crown-icon {
      font-size: 1rem; line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(201,153,58,0.5));
    }
    .reb-nav-right {
      display: flex; align-items: center; gap: 20px;
    }
    .reb-tagline {
      font-family: var(--serif); font-style: italic;
      font-size: 0.95rem; color: var(--text-3); letter-spacing: 0.3px;
    }
    .reb-year {
      font-family: var(--royal); font-size: 0.72rem; letter-spacing: 2px;
      text-transform: uppercase; color: var(--text-3);
      padding: 6px 14px; border: 1px solid rgba(110,70,50,0.15);
      border-radius: 30px;
    }

    /* ── HERO ── */
    .reb-hero {
      display: flex; flex-wrap: wrap; justify-content: center;
      gap: 20px; align-items: center; min-height: 480px;
      margin-bottom: 40px;
    }
    .reb-hero-left { 
      flex: 0 1 500px; min-width: 300px;
      padding-right: 0; 
      transform: translateY(-90px); /* Moved even further up per user request */
    }

    /* Giant Name */
    .reb-name {
      font-family: var(--serif); font-weight: 900;
      font-size: clamp(4.5rem, 11vw, 9.5rem); line-height: 0.88;
      letter-spacing: -3px; text-transform: lowercase;
      background: linear-gradient(145deg, var(--crimson) 0%, #A00020 25%, var(--gold) 55%, #E8C97A 75%, var(--crimson) 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: reb-shimmer-name 6s ease-in-out infinite;
      position: relative;
    }
    @keyframes reb-shimmer-name {
      0%,100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    /* Role */
    .reb-role-row {
      display: flex; align-items: center; gap: 16px; margin: 4px 0 24px;
    }
    .reb-role-gem {
      width: 10px; height: 10px; border-radius: 50%;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      box-shadow: 0 0 10px rgba(200,16,46,0.35);
      flex-shrink: 0;
    }
    .reb-role {
      font-family: var(--serif); font-style: italic; font-weight: 500;
      font-size: clamp(1.3rem, 2.5vw, 1.8rem);
      color: var(--crimson);
    }
    .reb-bio {
      font-size: 1.05rem; line-height: 1.75; color: var(--text-2);
      max-width: 440px; font-weight: 400;
    }

    /* ── HERO RIGHT — 3D TILT CARD ── */
    .reb-card-3d-wrap {
      flex: 0 0 420px; max-width: 100%;
      perspective: 1200px; cursor: pointer; position: relative;
    }
    .reb-card-3d {
      width: 100%; aspect-ratio: 0.72;
      border-radius: 28px; position: relative; overflow: visible;
      transition: transform 0.12s ease-out;
      will-change: transform;
    }

    /* Card inner face */
    .reb-card-face {
      width: 100%; height: 100%; border-radius: 28px; overflow: hidden;
      background: linear-gradient(160deg, rgba(255,248,235,0.95) 0%, rgba(242,232,214,0.9) 60%, rgba(248,240,228,0.85) 100%);
      border: 1.5px solid rgba(201,153,58,0.3);
      box-shadow: 0 20px 80px rgba(200,16,46,0.1), 0 8px 30px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
      backdrop-filter: blur(20px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0; padding: 40px 32px;
      position: relative;
    }

    /* Shimmer sweep on card */
    .reb-card-face::before {
      content: ""; position: absolute; inset: 0; border-radius: 28px;
      background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
      background-size: 200% 100%; background-position: -100% 0;
      animation: reb-card-shimmer 4s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes reb-card-shimmer {
      0% { background-position: -100% 0; }
      60%, 100% { background-position: 200% 0; }
    }

    /* Gold border frame accent */
    .reb-card-face::after {
      content: ""; position: absolute; inset: 10px; border-radius: 20px;
      border: 1px solid rgba(201,153,58,0.2);
      pointer-events: none;
    }

    /* Avatar ring */
    .reb-avatar-ring {
      width: 140px; height: 140px; border-radius: 50%; position: relative;
      margin-bottom: 24px; flex-shrink: 0;
    }
    .reb-avatar-ring::before {
      content: ""; position: absolute; inset: -5px; border-radius: 50%;
      background: conic-gradient(from 0deg, var(--crimson), var(--gold), #fff, var(--crimson));
      animation: reb-ring-spin 8s linear infinite;
      z-index: -1;
    }
    @keyframes reb-ring-spin { to { transform: rotate(360deg); } }
    .reb-avatar-ring::after {
      content: ""; position: absolute; inset: -8px; border-radius: 50%;
      background: conic-gradient(from 180deg, rgba(200,16,46,0.15), rgba(201,153,58,0.15), transparent, rgba(200,16,46,0.15));
      animation: reb-ring-spin 12s linear infinite reverse;
      z-index: -2;
    }
    .reb-avatar-img {
      width: 140px; height: 140px; border-radius: 50%; object-fit: cover;
      border: 3px solid rgba(255,255,255,0.8);
      box-shadow: 0 8px 24px rgba(200,16,46,0.15);
    }
    .reb-avatar-placeholder {
      width: 140px; height: 140px; border-radius: 50%;
      background: linear-gradient(145deg, rgba(200,16,46,0.08) 0%, rgba(201,153,58,0.12) 100%);
      border: 3px solid rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--serif); font-size: 3.5rem; font-weight: 700;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    .reb-card-name {
      font-family: var(--royal); font-size: 1.35rem; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase; color: var(--text);
      text-align: center; margin-bottom: 6px;
    }
    .reb-card-title {
      font-family: var(--serif); font-style: italic;
      font-size: 1rem; color: var(--crimson); text-align: center;
      margin-bottom: 24px;
    }

    /* Floating stat pills on the card */
    .reb-stat-row {
      display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
    }
    .reb-stat {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 18px; border-radius: 14px;
      background: rgba(255,248,235,0.8);
      border: 1px solid rgba(201,153,58,0.25);
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 12px rgba(201,153,58,0.08);
      min-width: 72px;
      transition: transform 0.2s;
    }
    .reb-stat:hover { transform: translateY(-3px); }
    .reb-stat strong {
      font-family: var(--royal); font-size: 1.1rem; font-weight: 700;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .reb-stat span {
      font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;
      color: var(--text-3); margin-top: 2px;
    }

    /* ── 3D FLOATING DECORATIVE ELEMENTS ── */
    /* These are positioned RELATIVE to the hero section, not the viewport */
    .reb-deco-container {
      position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 0;
    }


    /* Floating crown — above hero card */
    .reb-float-crown {
      position: absolute; top: -36px; right: 168px;
      font-size: 2.2rem; line-height: 1;
      animation: reb-float-crown 6s ease-in-out infinite;
      filter: drop-shadow(0 4px 12px rgba(201,153,58,0.45));
    }
    @keyframes reb-float-crown { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.05)} }

    /* Floating sparkle star — left mid */
    .reb-sparkle {
      position: absolute;
      animation: reb-twinkle 2.5s ease-in-out infinite;
      font-style: normal;
    }
    .reb-sparkle-1 { top: 15%; left: 46%; font-size: 1.1rem; color: var(--gold); animation-delay: 0s; }
    .reb-sparkle-2 { bottom: 18%; left: 48%; font-size: 0.75rem; color: var(--crimson); opacity: 0.6; animation-delay: 1.2s; }
    @keyframes reb-twinkle { 0%,100%{opacity:0.3; transform:scale(0.7) rotate(0deg)} 50%{opacity:1; transform:scale(1.2) rotate(15deg)} }

    /* Floating orb small — top left corner */
    .reb-float-orb {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle, var(--gold-pale) 0%, transparent 70%);
      animation: reb-pulse-orb 5s ease-in-out infinite;
    }
    .reb-float-orb-a { width: 80px; height: 80px; top: 5%; left: 2%; animation-delay: 0s; }
    .reb-float-orb-b { width: 48px; height: 48px; bottom: 12%; right: 36%; animation-delay: 2s; }
    @keyframes reb-pulse-orb { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.25);opacity:1} }



    /* ── MARQUEE RIBBON ── */
    .reb-ribbon-wrap {
      margin: 52px 0; overflow: hidden; position: relative;
    }
    .reb-ribbon {
      padding: 20px 0;
      background: linear-gradient(90deg,
        rgba(200,16,46,0.04) 0%,
        rgba(201,153,58,0.1) 25%,
        rgba(200,16,46,0.07) 50%,
        rgba(201,153,58,0.1) 75%,
        rgba(200,16,46,0.04) 100%);
      border-top: 1px solid rgba(201,153,58,0.2);
      border-bottom: 1px solid rgba(201,153,58,0.2);
      white-space: nowrap; overflow: hidden;
    }
    .reb-ribbon-track {
      display: inline-block;
      animation: reb-marquee 28s linear infinite;
      font-family: var(--royal); font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
      font-size: clamp(0.9rem, 1.5vw, 1.15rem); color: var(--crimson);
    }
    .reb-ribbon-track span { padding: 0 24px; }
    .reb-ribbon-sep { color: var(--gold); font-style: normal; opacity: 0.7; }
    @keyframes reb-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

    /* ── LINK CARDS ── */
    .reb-section-label {
      display: flex; align-items: center; gap: 16px; margin-bottom: 28px;
    }
    .reb-section-label h2 {
      font-family: var(--royal); font-size: 0.8rem; letter-spacing: 4px;
      text-transform: uppercase; color: var(--text-3); font-weight: 400;
    }
    .reb-section-label::after {
      content: ""; flex: 1; height: 1px;
      background: linear-gradient(90deg, rgba(201,153,58,0.3), transparent);
    }

    .reb-links-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 18px;
      perspective: 1200px;
    }
    .reb-link-card {
      display: block; position: relative; overflow: hidden;
      padding: 28px 24px 24px;
      border-radius: 22px;
      background: linear-gradient(145deg, rgba(255,252,246,0.95) 0%, rgba(248,240,226,0.9) 100%);
      border: 1.5px solid rgba(201,153,58,0.2);
      color: var(--text); text-decoration: none;
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s, border-color 0.4s;
      box-shadow: 0 4px 20px rgba(201,153,58,0.06);
      transform-style: preserve-3d;
    }
    .reb-link-card::before {
      /* shimmer sweep */
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%);
      background-size: 200% 100%; background-position: -100% 0;
      transition: background-position 0.6s;
    }
    .reb-link-card:hover::before { background-position: 150% 0; }
    .reb-link-card:hover {
      transform: translateY(-8px) scale(1.03) rotateX(8deg) rotateY(-4deg);
      box-shadow: 0 24px 48px rgba(200,16,46,0.15), 0 12px 24px rgba(201,153,58,0.2);
      border-color: rgba(201,153,58,0.45);
    }
    /* Colored top accent line */
    .reb-link-card::after {
      content: ""; position: absolute; top: 0; left: 20px; right: 20px; height: 2px;
      background: linear-gradient(90deg, var(--crimson), var(--gold));
      border-radius: 0 0 4px 4px;
      opacity: 0; transition: opacity 0.3s;
    }
    .reb-link-card:hover::after { opacity: 1; }

    .reb-link-icon-wrap {
      width: 44px; height: 44px; border-radius: 14px; margin-bottom: 16px;
      background: linear-gradient(135deg, rgba(200,16,46,0.08), rgba(201,153,58,0.1));
      border: 1px solid rgba(201,153,58,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; color: var(--crimson);
      font-family: var(--royal);
      transition: background 0.3s, transform 0.3s;
      transform: translateZ(25px);
    }
    .reb-link-card:hover .reb-link-icon-wrap {
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      color: #fff; transform: scale(1.1) rotate(-4deg) translateZ(30px);
    }
    .reb-link-title {
      font-family: var(--serif); font-size: 1.45rem; font-weight: 700;
      color: var(--text); margin-bottom: 4px; line-height: 1.2;
      transform: translateZ(20px);
    }
    .reb-link-sub {
      font-size: 0.82rem; color: var(--text-3); font-weight: 500;
      text-transform: uppercase; letter-spacing: 1px;
      transform: translateZ(15px);
    }
    .reb-link-arrow {
      position: absolute; bottom: 22px; right: 22px;
      width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid rgba(201,153,58,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; color: var(--text-3);
      transition: all 0.3s;
      transform: translateZ(20px);
    }
    .reb-link-card:hover .reb-link-arrow {
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      border-color: transparent; color: #fff;
      transform: rotate(45deg) translateZ(25px);
    }

    /* ── CTA SECTION ── */
    .reb-cta-section {
      margin-top: 64px; padding: 60px;
      border-radius: 32px; position: relative; overflow: hidden;
      background: linear-gradient(135deg,
        rgba(200,16,46,0.06) 0%,
        rgba(248,240,226,0.8) 30%,
        rgba(201,153,58,0.08) 60%,
        rgba(248,240,226,0.9) 100%);
      border: 1.5px solid rgba(201,153,58,0.25);
      box-shadow: 0 8px 60px rgba(200,16,46,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
    }
    /* Decorative corner crests */
    .reb-cta-crest {
      position: absolute; font-size: 5rem; line-height: 1; opacity: 0.04;
      pointer-events: none; font-family: var(--serif); color: var(--crimson);
    }
    .reb-cta-crest-tl { top: -10px; left: 20px; }
    .reb-cta-crest-br { bottom: -10px; right: 20px; transform: rotate(180deg); }

    .reb-cta-inner {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 32px; position: relative; z-index: 1;
    }
    .reb-cta-left h2 {
      font-family: var(--serif); font-weight: 900; font-style: italic;
      font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.1;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 12px;
    }
    .reb-cta-left p {
      color: var(--text-2); font-size: 1rem; max-width: 380px;
    }
    .reb-cta-btn {
      display: inline-flex; align-items: center; gap: 14px;
      padding: 18px 40px; border-radius: 50px;
      background: linear-gradient(135deg, var(--crimson) 0%, #A00020 50%, #8A001A 100%);
      color: #fff; font-family: var(--royal); font-weight: 600;
      font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;
      box-shadow: 0 8px 32px rgba(200,16,46,0.3), 0 2px 8px rgba(200,16,46,0.2), inset 0 1px 0 rgba(255,255,255,0.15);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
      position: relative; overflow: hidden;
    }
    .reb-cta-btn::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
      background-size: 200% 100%; background-position: -100% 0;
      transition: background-position 0.5s;
    }
    .reb-cta-btn:hover::before { background-position: 150% 0; }
    .reb-cta-btn:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 16px 48px rgba(200,16,46,0.38), 0 4px 16px rgba(200,16,46,0.2);
    }
    .reb-cta-btn-icon { font-size: 1.1rem; transition: transform 0.3s; }
    .reb-cta-btn:hover .reb-cta-btn-icon { transform: translateX(4px); }

    /* Gold secondary button */
    .reb-cta-btn-sec {
      display: inline-flex; align-items: center; gap: 12px;
      padding: 18px 36px; border-radius: 50px;
      background: transparent; color: var(--gold);
      font-family: var(--royal); font-weight: 600; font-size: 0.9rem;
      letter-spacing: 2px; text-transform: uppercase;
      border: 1.5px solid rgba(201,153,58,0.45);
      transition: all 0.3s;
    }
    .reb-cta-btn-sec:hover {
      background: rgba(201,153,58,0.08);
      border-color: var(--gold); transform: translateY(-3px);
    }
    .reb-cta-buttons { display: flex; flex-wrap: wrap; gap: 14px; }

    /* ── FOOTER LINE ── */
    .reb-footer {
      margin-top: 48px; padding-top: 24px;
      border-top: 1px solid rgba(201,153,58,0.2);
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px;
    }
    .reb-footer-brand {
      font-family: var(--royal); font-size: 0.72rem; letter-spacing: 3px;
      text-transform: uppercase; color: var(--text-3);
    }
    .reb-footer-dots {
      display: flex; gap: 8px; align-items: center;
    }
    .reb-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      animation: reb-dot-pulse 2.5s ease-in-out infinite;
    }
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
      .reb-links-grid { grid-template-columns: 1fr; } /* Stack links fully on mobile */
      .reb-link-card { padding: 24px 20px 20px; }
      .reb-cta-section { padding: 40px 24px; text-align: center; }
      .reb-cta-inner { flex-direction: column; align-items: center; gap: 24px; }
      .reb-cta-left p { text-align: center; margin: 0 auto; }
      .reb-cta-buttons { justify-content: center; width: 100%; flex-direction: column; }
      .reb-cta-btn, .reb-cta-btn-sec { width: 100%; justify-content: center; }
      .reb-footer { flex-direction: column; text-align: center; gap: 20px; }
    }
  `;

  return (
    <div className="reb-wrap">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="reb-frame">

        {/* Ambient background orbs (moved inside frame so they are contained) */}
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
        <section
          id="top"
          className="reb-hero"
          style={{ position: 'relative' }}
        >
          {/* Decorative floating elements — absolutely positioned within hero */}
          <div className="reb-deco-container" aria-hidden="true">
            {/* Floating crown above arch */}
            <div className="reb-float-crown">♛</div>
            {/* Sparkle stars */}
            <span className="reb-sparkle reb-sparkle-1">✦</span>
            <span className="reb-sparkle reb-sparkle-2">✦</span>
            {/* Ambient orbs */}
            <div className="reb-float-orb reb-float-orb-a" />
            <div className="reb-float-orb reb-float-orb-b" />

          </div>

          {/* LEFT — Text content */}
          <div className="reb-hero-left">
            <h1 className="reb-name">{profile.name}</h1>
            <div className="reb-role-row">
              <div className="reb-role-gem" />
              <span className="reb-role">{profile.headline}</span>
            </div>
            <p className="reb-bio">{profile.bio}</p>
          </div>

          {/* RIGHT — 3D Tilt Card */}
          <div
            className="reb-card-3d-wrap"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={cardRef}
          >
            <div
              className="reb-card-3d"
              style={{ transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
            >
              <div className="reb-card-face">
                {/* Avatar */}
                <div className="reb-avatar-ring">
                  {profile.avatarUrl ? (
                    <img className="reb-avatar-img" src={profile.avatarUrl} alt={profile.name} />
                  ) : (
                    <div className="reb-avatar-placeholder">{profile.name?.[0] || 'R'}</div>
                  )}
                </div>

                <div className="reb-card-name">{profile.name}</div>
                <div className="reb-card-title">{profile.headline}</div>

                {/* Stat bubbles — uses user's actual proof points */}
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
              <h2>Connect &amp; Explore</h2>
            </div>

            <nav className="reb-links-grid">
              {profile.links.map((link: any, i: number) => (
                <a
                  key={i}
                  className="reb-link-card"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="reb-link-icon-wrap">
                    {getLinkIcon(link.label || link.platform, link.url)}
                  </div>
                  <div className="reb-link-title">{link.label || link.platform}</div>
                  <div className="reb-link-sub">{getLinkSubtitle(link.label || link.platform)}</div>
                  <div className="reb-link-arrow">↗</div>
                </a>
              ))}
            </nav>
          </>
        )}

        {/* ── BIO SECTION (when no links, fill space with bio) ── */}
        {(!profile.links || profile.links.length === 0) && profile.bio && (
          <>
            <div className="reb-section-label">
              <h2>About</h2>
            </div>
            <div style={{
              padding: '32px',
              borderRadius: '22px',
              background: 'linear-gradient(145deg, rgba(255,252,246,0.95), rgba(248,240,226,0.9))',
              border: '1.5px solid rgba(201,153,58,0.2)',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: '1.15rem',
              lineHeight: '1.9',
              color: 'var(--text-2)',
              maxWidth: '640px',
            }}>
              "{profile.bio}"
            </div>
          </>
        )}

        <RecentActivitySection
          activity={profile.recentActivity}
          variant="rebellion"
          accentColor={accent}
          autoScroll={profile.autoScroll}
        />

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
                <a
                  className="reb-cta-btn"
                  href={profile.email ? `mailto:${profile.email}` : (profile.links?.[0]?.url || '#')}
                >
                  Get in Touch — Work with {profile.name?.split(' ')[0] || 'Us'}
                  <span className="reb-cta-btn-icon">→</span>
                </a>
                {profile.links?.[0] && profile.email && (
                  <a className="reb-cta-btn-sec" href={profile.links[0].url} target="_blank" rel="noopener noreferrer">
                    ♛ &nbsp;Follow
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="reb-footer">
          <span className="reb-footer-brand">The Rebellion · {profile.name} · 2026</span>
          <div className="reb-footer-dots">
            <div className="reb-dot" />
            <div className="reb-dot" />
            <div className="reb-dot" />
          </div>
        </footer>

      </div>
    </div>
  );
}
