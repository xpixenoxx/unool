'use client';

import React, { useEffect, useRef } from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { PlatformSVGs } from '@/components/dashboard/PlatformLogos';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentActivityPlatform {
  platform: string;
  url: string;
  adaptedContent: string;
}

export interface RecentActivityData {
  id: string;
  content: string;
  publishedAt: string | null;
  platforms: RecentActivityPlatform[];
}

export interface RecentActivitySectionProps {
  activity: RecentActivityData | null;
  /** Template style variant */
  variant?:
    | 'lover'
    | 'lone'
    | 'rebellion'
    | 'builder'
    | 'visionary'
    | 'hustler'
    | 'creator'
    | 'studio'
    | 'machine'
    | 'club'
    | 'energy'
    | 'vision'
    | 'human'
    | 'aesthete'
    | 'voice'
    | 'default';
  /** Whether the parent template has a dark background */
  isDark?: boolean;
  /** Accent colour from the profile theme */
  accentColor?: string;
  /** When true, auto-scroll to this section on mount */
  autoScroll?: boolean;
}

// ─── Platform Config with Authentic Brand Colors ──────────────────────────────

export const PLATFORM_CONFIG: Record<
  string,
  { icon: React.ElementType; name: string; cta: string; color: string; bg: string }
> = {
  linkedin:  { icon: PlatformSVGs.linkedin,  name: 'LinkedIn',    cta: 'View Post',     color: '#FFFFFF', bg: '#0A66C2' },
  x:         { icon: PlatformSVGs.x,         name: 'X',           cta: 'View Post',     color: '#FFFFFF', bg: '#000000' },
  twitter:   { icon: PlatformSVGs.x,         name: 'X',           cta: 'View Post',     color: '#FFFFFF', bg: '#000000' },
  threads:   { icon: PlatformSVGs.threads,   name: 'Threads',     cta: 'View Thread',   color: '#FFFFFF', bg: '#101010' },
  facebook:  { icon: PlatformSVGs.facebook,  name: 'Facebook',    cta: 'View Post',     color: '#FFFFFF', bg: '#1877F2' },
  instagram: { icon: PlatformSVGs.instagram, name: 'Instagram',   cta: 'View Post',     color: '#FFFFFF', bg: '#E1306C' },
  youtube:   { icon: PlatformSVGs.youtube,   name: 'YouTube',     cta: 'Watch Video',   color: '#FFFFFF', bg: '#FF0000' },
  bluesky:   { icon: PlatformSVGs.bluesky,   name: 'Bluesky',     cta: 'View Post',     color: '#FFFFFF', bg: '#0085FF' },
  mastodon:  { icon: PlatformSVGs.mastodon,  name: 'Mastodon',    cta: 'View Post',     color: '#FFFFFF', bg: '#6364FF' },
  telegram:  { icon: PlatformSVGs.telegram,  name: 'Telegram',    cta: 'View Channel',  color: '#FFFFFF', bg: '#229ED9' },
  discord:   { icon: PlatformSVGs.discord,   name: 'Discord',     cta: 'Join Server',   color: '#FFFFFF', bg: '#5865F2' },
  pinterest: { icon: PlatformSVGs.pinterest, name: 'Pinterest',   cta: 'View Pin',      color: '#FFFFFF', bg: '#E60023' },
  twitch:    { icon: PlatformSVGs.twitch,    name: 'Twitch',      cta: 'Watch Stream',  color: '#FFFFFF', bg: '#9146FF' },
  dribbble:  { icon: PlatformSVGs.dribbble,  name: 'Dribbble',    cta: 'View Shot',     color: '#FFFFFF', bg: '#EA4C89' },
  skool:     { icon: PlatformSVGs.skool,     name: 'Skool',       cta: 'View Post',     color: '#FFFFFF', bg: '#E2AD44' },
  whop:      { icon: PlatformSVGs.whop,      name: 'Whop',        cta: 'View Post',     color: '#FFFFFF', bg: '#FF5A00' },
  kick:      { icon: PlatformSVGs.kick,      name: 'Kick',        cta: 'Watch Stream',  color: '#0A0A0A', bg: '#53FC18' },
  vk:        { icon: PlatformSVGs.vk,        name: 'VK',          cta: 'View Post',     color: '#FFFFFF', bg: '#0077FF' },
  warpcast:  { icon: PlatformSVGs.warpcast,  name: 'Farcaster',   cta: 'View Cast',     color: '#FFFFFF', bg: '#8A63D2' },
  farcaster: { icon: PlatformSVGs.warpcast,  name: 'Farcaster',   cta: 'View Cast',     color: '#FFFFFF', bg: '#8A63D2' },
  mewe:      { icon: PlatformSVGs.mewe,      name: 'MeWe',        cta: 'View Post',     color: '#FFFFFF', bg: '#2F435E' },
  nostr:     { icon: PlatformSVGs.nostr,     name: 'Nostr',       cta: 'View Note',     color: '#FFFFFF', bg: '#9B51E0' },
  medium:    { icon: PlatformSVGs.medium,    name: 'Medium',      cta: 'Read Story',    color: '#FFFFFF', bg: '#12100E' },
  tiktok:    { icon: PlatformSVGs.tiktok,    name: 'TikTok',      cta: 'Watch Video',   color: '#FFFFFF', bg: '#000000' },
  hashnode:  { icon: PlatformSVGs.hashnode,  name: 'Hashnode',    cta: 'Read Article',  color: '#FFFFFF', bg: '#2962FF' },
  listmonk:  { icon: PlatformSVGs.listmonk,  name: 'Listmonk',    cta: 'Read Update',   color: '#FFFFFF', bg: '#0045FF' },
  lemmy:     { icon: PlatformSVGs.lemmy,     name: 'Lemmy',       cta: 'View on Lemmy', color: '#FFFFFF', bg: '#00BC8C' },
  devto:     { icon: PlatformSVGs.devto,     name: 'DEV.to',      cta: 'Read Article',  color: '#FFFFFF', bg: '#0A0A0A' },
  reddit:    { icon: PlatformSVGs.reddit,    name: 'Reddit',      cta: 'View Post',     color: '#FFFFFF', bg: '#FF4500' },
  slack:     { icon: PlatformSVGs.slack,     name: 'Slack',       cta: 'Open Channel',  color: '#FFFFFF', bg: '#4A154B' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function excerpt(text: string, max = 150): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).trimEnd() + '…';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecentActivitySection({
  activity,
  variant = 'default',
  isDark = false,
  accentColor,
  autoScroll = false,
}: RecentActivitySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const el = document.getElementById('recent-activity');
        if (el) {
          el.classList.remove('ra-highlight');
          void (el as HTMLElement).offsetWidth;
          el.classList.add('ra-highlight');
        }
      }, 500);
    }, 350);
    return () => clearTimeout(timer);
  }, [autoScroll]);

  if (!activity) return null;

  const published = (activity.platforms || []).filter(p => p && p.url?.startsWith('http'));
  if (published.length === 0) return null;

  const accent = accentColor || (isDark ? '#FFFFFF' : '#222222');

  // Pulse animation CSS for autoScroll highlight
  const pulseStyle = (
    <style>{`
      @keyframes ra-pulse {
        0%   { box-shadow: 0 0 0 0 ${accent}77; }
        60%  { box-shadow: 0 0 0 16px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
      #recent-activity.ra-highlight {
        animation: ra-pulse 1.4s ease-out 2;
      }
    `}</style>
  );

  // ── 01. LOVER VARIANT (Warm Claymorphism) ──
  if (variant === 'lover') {
    return (
      <div id="recent-activity" ref={sectionRef} className="space-y-2 mb-6">
        {pulseStyle}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CF5628] animate-pulse" />
            <span className="text-[11px] font-bold text-[#2A1710] uppercase tracking-wider font-mono-tag">
              New Post Shared With You
            </span>
          </div>
          <span className="text-[10px] text-[#CF5628] font-mono-tag font-semibold">
            {timeAgo(activity.publishedAt)}
          </span>
        </div>
        <div className="clay-card p-4 space-y-3">
          <p className="text-xs text-[#2A1710]/85 font-medium leading-relaxed line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-[#CF5628]/10">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#CF5628' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all text-white no-underline"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Open on ${cfg.name}`}
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="opacity-80 text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-stone-500 font-mono-tag flex items-center justify-between pt-0.5">
            <span>Tap your preferred platform to view &amp; engage</span>
            <span>Live on {published.length} feed{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── 02. LONE VARIANT (Dark Skewed Glassmorphism) ──
  if (variant === 'lone') {
    return (
      <section id="recent-activity" ref={sectionRef} className="flex flex-col gap-2.5 my-6">
        {pulseStyle}
        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-[#9296A0] px-2 font-medium">
          <div className="flex items-center gap-1.5 text-[#123DFF]">
            <div className="w-2 h-2 rounded-full bg-[#123DFF] animate-pulse" />
            <span className="font-bold">New Post Shared With You</span>
          </div>
          <span className="text-[10px] text-[#9296A0]">{timeAgo(activity.publishedAt)}</span>
        </div>
        <div
          className="w-full rounded-2xl overflow-hidden p-4 relative shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 19, 24, 0.85), rgba(12, 14, 18, 0.95))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <p className="text-xs text-[#F4EFE7]/90 leading-relaxed font-normal mb-3 line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#123DFF' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md hover:scale-105 active:scale-95 transition-all text-white no-underline"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Open on ${cfg.name}`}
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="opacity-80 text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
          <div className="mt-2 text-[10px] text-[#9296A0] flex items-center justify-between">
            <span>Tap any platform above to view &amp; support</span>
            <span>Live on {published.length} platform{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── 03. REBELLION VARIANT (Dark Gothic Crest / Crimson Frosted Glass) ──
  if (variant === 'rebellion') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="flex items-center justify-between mb-2 border-b border-[#C8102E]/30 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#C8102E]">♛</span>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#C8102E]">
              New Transmission // Shared With You
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#C8102E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] animate-pulse" />
            {timeAgo(activity.publishedAt)}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-[#C8102E]/30 bg-[#161413]/90 backdrop-blur-md shadow-lg space-y-3">
          <p className="text-xs font-serif italic text-[#EAE8E3]/90 leading-relaxed line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#C8102E]/20">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Engage', color: '#FFFFFF', bg: '#C8102E' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-transform hover:scale-105 active:scale-95 shadow-sm no-underline"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Engage on ${cfg.name}`}
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="opacity-80 text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#EAE8E3]/50 flex items-center justify-between">
            <span>Direct access to full post — pick your venue</span>
            <span>Live on {published.length} platform{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── 04. BUILDER VARIANT (Technical Blueprint / Modular Card) ──
  if (variant === 'builder') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-2 font-bold border-l-2 border-[#C5A86A] pl-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#C5A86A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A86A] animate-pulse" />
            <span>SYS.TRANSMISSION // SHARED WITH YOU</span>
          </div>
          <span className="text-[#87958A] font-mono text-[9px]">{timeAgo(activity.publishedAt)}</span>
        </div>
        <div className="w-full bg-[#2B232A] text-[#F3EEE6] p-4 relative overflow-hidden border border-[#C5A86A]/30 space-y-3">
          <p className="text-xs text-[#F3EEE6]/90 leading-relaxed font-medium line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#C5A86A]/20">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Access', color: '#FFFFFF', bg: '#C5A86A' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:scale-105 active:scale-95 transition-all no-underline"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Access on ${cfg.name}`}
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="opacity-80 text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#F3EEE6]/50 font-mono flex items-center justify-between">
            <span>Direct endpoint access — select to inspect &amp; engage</span>
            <span>Live on {published.length} feed{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── 05. VISIONARY VARIANT (Orbital / Cosmic Editorial) ──
  if (variant === 'visionary') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[#704E59] uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-[#704E59] animate-pulse" />
            <span>New Dispatch // Shared With You</span>
          </div>
          <span className="text-[10px] text-[#8B958A] font-mono">{timeAgo(activity.publishedAt)}</span>
        </div>
        <div className="metric-card p-4 sm:p-5 rounded-2xl border border-[#704E59]/20 bg-[#FDFBF7] shadow-sm space-y-3">
          <p className="text-xs sm:text-sm text-[#2C2825]/85 leading-relaxed font-serif italic line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#704E59]/15">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Visit', color: '#FFFFFF', bg: '#704E59' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:scale-105 active:scale-95 transition-all no-underline"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Open on ${cfg.name}`}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="opacity-80 text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#2C2825]/55 flex items-center justify-between">
            <span>Tap your preferred venue to view &amp; interact</span>
            <span>Live on {published.length} network{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── 06. HUSTLER VARIANT (Neo-Brutalist / Blaze Orange) ──
  if (variant === 'hustler') {
    return (
      <div id="recent-activity" ref={sectionRef} className="my-6 p-4 sm:p-5 border-2 border-[#292724] bg-white shadow-[4px_4px_0px_#292724] space-y-3">
        {pulseStyle}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D64924] animate-pulse" />
            <span className="text-[11px] text-[#D64924] uppercase tracking-wider font-extrabold">
              NEW POST // SHARED WITH YOU
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#7A756D]">{timeAgo(activity.publishedAt)}</span>
        </div>
        <p className="text-xs uppercase tracking-wide font-bold text-[#292724] leading-relaxed line-clamp-2">
          "{excerpt(activity.content, 130)}"
        </p>
        <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-[#292724]/20">
          {published.map(({ platform, url }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Open', color: '#FFFFFF', bg: '#D64924' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 border-2 border-[#292724] text-xs font-extrabold uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-[2px_2px_0px_#292724] inline-flex items-center gap-1.5 no-underline"
                style={{ background: cfg.bg, color: cfg.color }}
                title={`Open on ${cfg.name}`}
              >
                <Icon size={12} />
                <span>{cfg.name}</span>
                <span>→</span>
              </a>
            );
          })}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A756D] flex items-center justify-between">
          <span>Tap to view &amp; engage instantly</span>
          <span>Synced on {published.length} platform{published.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  // ── 07. CREATOR VARIANT (Chamfered Geometric / Tech Contrast) ──
  if (variant === 'creator') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] tracking-widest uppercase font-bold">
              Latest Post // Shared With You
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-slate-400">{timeAgo(activity.publishedAt)}</span>
        </div>
        <div
          className="relative w-full bg-white/85 backdrop-blur-md p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3"
          style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
        >
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#0F172A' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-sm no-underline text-white"
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  title={`View on ${cfg.name}`}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-80">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Tap your preferred network to view full post</span>
            <span>Live on {published.length} feed{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── 08. STUDIO VARIANT (Swiss Minimalist Editorial) ──
  if (variant === 'studio') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-[#2C2E2A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CA290] animate-pulse" />
            <span className="text-[10px] tracking-widest uppercase font-bold">New Post Shared With You</span>
          </div>
          <span className="text-[10px] tracking-widest uppercase text-[#8CA290] font-mono">{timeAgo(activity.publishedAt)}</span>
        </div>
        <div className="border border-[#2C2E2A]/15 p-4 sm:p-5 bg-white/70 backdrop-blur-sm rounded-sm space-y-3">
          <p className="font-serif text-sm text-[#2C2E2A] leading-relaxed italic line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2C2E2A]/10">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#2C2E2A' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all rounded-sm no-underline text-white"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Read on ${cfg.name}`}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-80">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#2C2E2A]/60 flex items-center justify-between">
            <span>Direct reading links — select your preferred outlet</span>
            <span>Live on {published.length} network{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── 09. MACHINE VARIANT (Cyber HUD Terminal) ──
  if (variant === 'machine') {
    return (
      <div id="recent-activity" ref={sectionRef} className="my-6 p-4 rounded-xl border border-[#00FF66]/30 bg-[#0C0F0D]/90 backdrop-blur-md space-y-3">
        {pulseStyle}
        <div className="flex justify-between items-center text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-[#00FF66]">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="font-bold tracking-widest">SYS.FEED // SHARED TRANSMISSION</span>
          </div>
          <span className="opacity-60">{timeAgo(activity.publishedAt)}</span>
        </div>
        <p className="text-xs font-mono text-white/90 leading-relaxed line-clamp-2">
          "{excerpt(activity.content, 140)}"
        </p>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#00FF66]/20">
          {published.map(({ platform, url }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Connect', color: '#FFFFFF', bg: '#222' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-white no-underline"
                style={{ background: cfg.bg, color: cfg.color }}
                title={`Connect via ${cfg.name}`}
              >
                <Icon size={12} />
                <span>{cfg.name}</span>
                <span className="opacity-80 text-[10px]">↗</span>
              </a>
            );
          })}
        </div>
        <div className="text-[10px] font-mono text-white/50 flex items-center justify-between">
          <span>Multi-uplink active — tap node to view full payload</span>
          <span>{published.length} active node{published.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  // ── 10. CLUB VARIANT (Luxury Dark Plum Porcelain) ──
  if (variant === 'club') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="flex items-center justify-between mb-2 border-b border-[#2C2825]/10 pb-1.5">
          <div className="flex items-center gap-1.5 text-[#704E59]">
            <span className="w-2 h-2 rounded-full bg-[#704E59] animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
              Shared Dispatch // Just Published
            </span>
          </div>
          <span className="text-[10px] tracking-widest uppercase text-stone-400 font-mono">
            {timeAgo(activity.publishedAt)}
          </span>
        </div>
        <div className="p-4 sm:p-5 border border-[#2C2825]/15 bg-white/75 backdrop-blur-md rounded-2xl shadow-sm space-y-3">
          <p className="font-serif text-sm text-[#2C2825] leading-relaxed italic line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2C2825]/10">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Read', color: '#FFFFFF', bg: '#2C2825' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Open on ${cfg.name}`}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-80">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#2C2825]/60 flex items-center justify-between">
            <span>Direct reading links — tap your preferred circle</span>
            <span>Live on {published.length} network{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── 11. ENERGY VARIANT (High Contrast Kinetic Slant) ──
  if (variant === 'energy') {
    return (
      <div id="recent-activity" ref={sectionRef} className="my-6 p-4 sm:p-5 bg-[#111] border-l-4 border-[#CCFF00] space-y-3">
        {pulseStyle}
        <div className="flex items-center justify-between uppercase">
          <div className="flex items-center gap-2 text-[#CCFF00]">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="text-xs font-extrabold tracking-widest">
              LATEST DROP // SHARED WITH YOU
            </span>
          </div>
          <span className="text-xs font-mono opacity-60 text-white">{timeAgo(activity.publishedAt)}</span>
        </div>
        <p className="text-xs font-bold tracking-wide text-white/90 leading-relaxed line-clamp-2">
          "{excerpt(activity.content, 140)}"
        </p>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          {published.map(({ platform, url }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Open', color: '#FFFFFF', bg: '#222' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold uppercase text-xs hover:scale-105 active:scale-95 transition-transform no-underline text-white"
                style={{ background: cfg.bg, color: cfg.color, transform: 'skewX(-6deg)' }}
                title={`Open on ${cfg.name}`}
              >
                <span style={{ transform: 'skewX(6deg)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Icon size={12} />
                  {cfg.name} ↗
                </span>
              </a>
            );
          })}
        </div>
        <div className="text-[10px] font-mono text-white/50 flex items-center justify-between">
          <span>Tap your venue to view full drop</span>
          <span>Live on {published.length} feed{published.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  // ── 12. VISION VARIANT (Holographic Cyan Glass) ──
  if (variant === 'vision') {
    return (
      <div id="recent-activity" ref={sectionRef} className="my-6 p-4 sm:p-5 rounded-xl border border-cyan-500/30 bg-black/50 backdrop-blur-md space-y-3">
        {pulseStyle}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              SYS.FEED // SHARED BROADCAST
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-500/70">{timeAgo(activity.publishedAt)}</span>
        </div>
        <p className="text-xs text-white/90 leading-relaxed line-clamp-2">
          "{excerpt(activity.content, 140)}"
        </p>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-cyan-500/20">
          {published.map(({ platform, url }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#06b6d4' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm"
                style={{ background: cfg.bg, color: cfg.color }}
                title={`View on ${cfg.name}`}
              >
                <Icon size={12} />
                <span>{cfg.name}</span>
                <span className="opacity-80 text-[10px]">↗</span>
              </a>
            );
          })}
        </div>
        <div className="text-[10px] font-mono text-cyan-400/60 flex items-center justify-between">
          <span>Multi-stream uplink — tap node to view full post</span>
          <span>{published.length} platform{published.length !== 1 ? 's' : ''} connected</span>
        </div>
      </div>
    );
  }

  // ── 13. HUMAN VARIANT (Warm Organic Sand / Editorial) ──
  if (variant === 'human') {
    return (
      <div id="recent-activity" ref={sectionRef} className="my-6 relative z-10">
        {pulseStyle}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#EFE4CC]/90 border border-[#1B1D1B]/15 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#123040]">
              <span className="w-2 h-2 rounded-full bg-[#BE5B42] animate-pulse" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]">
                Community Dispatch // Shared With You
              </span>
            </div>
            <span className="text-[10px] text-[#BE5B42] font-mono font-bold">
              {timeAgo(activity.publishedAt)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#1B1D1B]/90 font-serif leading-relaxed line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1B1D1B]/10">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Connect', color: '#FFFFFF', bg: '#123040' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-sans hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Connect on ${cfg.name}`}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-80">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#1B1D1B]/60 flex items-center justify-between">
            <span>Tap your preferred platform to join the conversation</span>
            <span>Live on {published.length} network{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── 14. AESTHETE VARIANT (Quiet Luxury Travertine) ──
  if (variant === 'aesthete') {
    return (
      <div id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="flex justify-between items-center text-[#292826]/70 font-inter text-[9px] tracking-[0.2em] uppercase mb-2">
          <div className="flex items-center gap-1.5 text-[#292826]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A39686] animate-pulse" />
            <span className="font-bold">New Post Shared With You</span>
          </div>
          <span className="text-[#A39686] font-mono">{timeAgo(activity.publishedAt)}</span>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white/75 border border-[#292826]/10 space-y-3 shadow-sm">
          <p className="font-serif italic text-xs sm:text-sm text-[#292826]/85 leading-relaxed line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#292826]/10">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#292826' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter font-semibold hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`View on ${cfg.name}`}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-80">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#292826]/50 flex items-center justify-between">
            <span>Direct access to full story — tap any venue</span>
            <span>Live on {published.length} platform{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── 15. VOICE VARIANT (Botanical Coral & Moss) ──
  if (variant === 'voice') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-6">
        {pulseStyle}
        <div className="flex items-center justify-between mb-2 border-b border-[#8DA396]/30 pb-1.5">
          <div className="flex items-center gap-1.5 text-[#1C2B21]">
            <span className="w-2 h-2 rounded-full bg-[#DF5B4C] animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase">
              Fresh Post // Shared With You
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#DF5B4C]">{timeAgo(activity.publishedAt)}</span>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-[#8DA396]/30 shadow-sm space-y-3">
          <p className="text-xs sm:text-sm text-[#1C2B21] font-medium leading-relaxed line-clamp-2">
            "{excerpt(activity.content, 140)}"
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#8DA396]/20">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#1C2B21' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm"
                  style={{ background: cfg.bg, color: cfg.color }}
                  title={`Open on ${cfg.name}`}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-80">↗</span>
                </a>
              );
            })}
          </div>
          <div className="text-[10px] text-[#1C2B21]/60 flex items-center justify-between">
            <span>Tap your preferred platform to read &amp; engage</span>
            <span>Live on {published.length} channel{published.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>
    );
  }

  // ── DEFAULT VARIANT (Universal Adaptive Glassmorphism) ──
  const sectionBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';
  const borderCol = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const labelCol  = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)';
  const textCol   = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';

  return (
    <div
      id="recent-activity"
      ref={sectionRef}
      className="my-6 shadow-sm space-y-3"
      style={{
        background: sectionBg,
        border: `1px solid ${borderCol}`,
        borderRadius: 20,
        padding: '18px 20px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        scrollMarginTop: 80,
      }}
    >
      {pulseStyle}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
              display: 'inline-block', flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: labelCol }}>
            New Post Shared With You
          </span>
        </div>
        {activity.publishedAt && (
          <span style={{ fontSize: 11, color: labelCol }} className="font-mono">{timeAgo(activity.publishedAt)}</span>
        )}
      </div>

      <p style={{
        fontSize: 13, lineHeight: 1.6, color: textCol,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        "{excerpt(activity.content, 140)}"
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 6, borderTop: `1px solid ${borderCol}` }}>
        {published.map(({ platform, url }) => {
          const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? {
            icon: ExternalLink, name: platform, cta: 'View Post', color: '#FFFFFF', bg: '#555555',
          };
          const Icon = cfg.icon;
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${cfg.cta} on ${cfg.name}`}
              className="hover:scale-105 active:scale-95 transition-transform"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: cfg.bg, color: cfg.color,
                fontSize: 12, fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              }}
            >
              <Icon size={12} />
              <span>{cfg.name}</span>
              <span style={{ opacity: 0.8, fontSize: 10 }}>↗</span>
            </a>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: labelCol, paddingTop: 2 }}>
        <span>Tap any platform above to view &amp; engage with the full post</span>
        <span>Live on {published.length} platform{published.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
