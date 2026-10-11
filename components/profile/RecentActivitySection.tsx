'use client';

import React, { useEffect, useRef } from 'react';
import {
  Linkedin, Twitter, MessageSquare, Send, Hash, Cloud, ExternalLink,
  Dribbble, Zap, FileText, GraduationCap, Store, Gamepad2, Video,
  Instagram, Youtube, Image as ImageIcon, Facebook, Twitch, ArrowRight,
} from 'lucide-react';

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

// ─── Platform Config ─────────────────────────────────────────────────────────

export const PLATFORM_CONFIG: Record<
  string,
  { icon: React.ElementType; name: string; cta: string; color: string; bg: string }
> = {
  linkedin:  { icon: Linkedin,      name: 'LinkedIn',    cta: 'Engage & Connect', color: '#FFFFFF', bg: '#0077B5' },
  x:         { icon: Twitter,       name: 'X',           cta: 'Like & Repost',    color: '#FFFFFF', bg: '#000000' },
  threads:   { icon: MessageSquare, name: 'Threads',     cta: 'Join the Thread',  color: '#FFFFFF', bg: '#101010' },
  facebook:  { icon: Facebook,      name: 'Facebook',    cta: 'React & Share',    color: '#FFFFFF', bg: '#1877F2' },
  instagram: { icon: Instagram,     name: 'Instagram',   cta: 'View & Like',      color: '#FFFFFF', bg: '#E1306C' },
  youtube:   { icon: Youtube,       name: 'YouTube',     cta: 'Watch & Sub',      color: '#FFFFFF', bg: '#FF0000' },
  bluesky:   { icon: Cloud,         name: 'Bluesky',     cta: 'Like & Repost',    color: '#FFFFFF', bg: '#0085FF' },
  mastodon:  { icon: Cloud,         name: 'Mastodon',    cta: 'Boost & Reply',    color: '#FFFFFF', bg: '#6364FF' },
  telegram:  { icon: Send,          name: 'Telegram',    cta: 'Join & Discuss',   color: '#FFFFFF', bg: '#229ED9' },
  discord:   { icon: Hash,          name: 'Discord',     cta: 'Join & Chat',      color: '#FFFFFF', bg: '#5865F2' },
  pinterest: { icon: ImageIcon,     name: 'Pinterest',   cta: 'Pin & Save',       color: '#FFFFFF', bg: '#E60023' },
  twitch:    { icon: Twitch,        name: 'Twitch',      cta: 'Watch & Follow',   color: '#FFFFFF', bg: '#9146FF' },
  dribbble:  { icon: Dribbble,      name: 'Dribbble',    cta: 'Like & Save',      color: '#FFFFFF', bg: '#EA4C89' },
  skool:     { icon: GraduationCap, name: 'Skool',       cta: 'Read & Engage',    color: '#FFFFFF', bg: '#E2AD44' },
  whop:      { icon: Store,         name: 'Whop',        cta: 'View & React',     color: '#FFFFFF', bg: '#FF5A00' },
  kick:      { icon: Gamepad2,      name: 'Kick',        cta: 'Watch & Follow',   color: '#1A1A1A', bg: '#53FC18' },
  vk:        { icon: Video,         name: 'VK',          cta: 'View & Like',      color: '#FFFFFF', bg: '#0077FF' },
  warpcast:  { icon: Hash,          name: 'Warpcast',    cta: 'Cast & Engage',    color: '#FFFFFF', bg: '#8A63D2' },
  mewe:      { icon: MessageSquare, name: 'MeWe',        cta: 'React & Share',    color: '#FFFFFF', bg: '#2F435E' },
  nostr:     { icon: Zap,           name: 'Nostr',       cta: 'Zap & Reply',      color: '#FFFFFF', bg: '#9B51E0' },
  medium:    { icon: FileText,      name: 'Medium',      cta: 'Read & Clap',      color: '#FFFFFF', bg: '#000000' },
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

export function excerpt(text: string, max = 240): string {
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
        0%   { box-shadow: 0 0 0 0 ${accent}66; }
        60%  { box-shadow: 0 0 0 16px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
      #recent-activity.ra-highlight {
        animation: ra-pulse 1.4s ease-out 2;
      }
    `}</style>
  );

  // ── 01. LOVER VARIANT (Claymorphic) ──
  if (variant === 'lover') {
    return (
      <div id="recent-activity" ref={sectionRef} className="space-y-2 mb-5">
        {pulseStyle}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#2A1710] uppercase tracking-wider font-mono-tag">
            Recent Activity
          </span>
          <span className="text-[10px] text-[#CF5628] font-mono-tag font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CF5628] animate-pulse" /> Live Feeds
          </span>
        </div>
        <div className="space-y-2">
          {published.map(({ platform, url, adaptedContent }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View Post', color: '#FFFFFF', bg: '#2A1710' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="clay-card p-3 flex items-start gap-3 no-underline block active:scale-95 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-[#FCECE9] flex items-center justify-center text-[#CF5628] shrink-0 mt-0.5">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#2A1710]">{cfg.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono-tag">{timeAgo(activity.publishedAt)}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-snug mt-0.5 line-clamp-2">
                    {adaptedContent || excerpt(activity.content, 110)}
                  </p>
                </div>
                <span className="text-stone-400 text-xs mt-1">↗</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 02. LONE VARIANT (Dark Skewed Glass Timeline) ──
  if (variant === 'lone') {
    return (
      <section id="recent-activity" ref={sectionRef} className="flex flex-col gap-4 mt-2 mb-6">
        {pulseStyle}
        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-[#9296A0] px-2 mb-2 font-medium">
          <span>Recent Activity</span>
          <div className="flex items-center gap-1.5 capitalize tracking-normal text-[#123DFF] text-[11px]">
            Live Feeds
            <div className="w-2 h-2 rounded-full bg-[#123DFF] animate-pulse" />
          </div>
        </div>
        <div className="relative pl-3">
          <div className="absolute left-4 top-4 bottom-4 w-[1px] bg-white/10" />
          <div className="flex flex-col gap-4">
            {published.map(({ platform, url, adaptedContent }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View Post', color: '#FFFFFF', bg: '#123DFF' };
              const Icon = cfg.icon;
              return (
                <div key={platform} className="relative flex items-center pl-8">
                  <div className="absolute left-[-2px] w-[9px] h-[9px] rounded-full bg-[#F4EFE7] border-2 border-[#08090C] shadow-[0_0_8px_rgba(255,255,255,0.3)] z-10" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-[18px] overflow-hidden relative shadow-[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform hover:scale-[1.01] no-underline block"
                    style={{
                      transform: 'skewX(-20deg)',
                      background: 'linear-gradient(rgba(17, 19, 24, 0.75), rgba(17, 19, 24, 0.9))',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="p-3 pr-4 flex items-center gap-3 relative z-10" style={{ transform: 'skewX(20deg)' }}>
                      <div className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm bg-[#123DFF] text-white">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-medium text-[13px] text-[#F4EFE7]">{cfg.name}</span>
                          <span className="text-[9px] text-[#9296A0]">{timeAgo(activity.publishedAt)}</span>
                        </div>
                        <p className="text-[10px] leading-snug line-clamp-2 text-[#9296A0]">
                          {adaptedContent || excerpt(activity.content, 110)}
                        </p>
                      </div>
                      <div className="h-[28px] w-[28px] rounded-full flex items-center justify-center shrink-0 ml-1 bg-white/5 text-white opacity-60 hover:opacity-100 transition-opacity">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── 03. REBELLION VARIANT (Disruptive / Gothic Crimson / Crests) ──
  if (variant === 'rebellion') {
    return (
      <section id="recent-activity" ref={sectionRef} className="my-10">
        {pulseStyle}
        <div className="flex items-center justify-between mb-4 border-b border-[#C8102E]/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#C8102E]">♛</span>
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#C8102E]">
              Recent Transmission
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#C8102E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] animate-pulse" /> Live
          </span>
        </div>
        <div className="p-6 rounded-xl border border-[#C8102E]/30 bg-[#161413]/90 backdrop-blur-md shadow-lg mb-4">
          <p className="text-sm font-serif italic text-[#EAE8E3]/90 leading-relaxed mb-5 line-clamp-3">
            "{excerpt(activity.content, 220)}"
          </p>
          <div className="flex flex-wrap gap-2.5 pt-3 border-t border-[#C8102E]/20">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Engage', color: '#FFFFFF', bg: '#C8102E' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-transform hover:scale-105 active:scale-95 shadow-sm"
                  style={{ background: cfg.bg }}
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="opacity-70 text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── 04. BUILDER VARIANT (Technical Blueprint / Modules) ──
  if (variant === 'builder') {
    return (
      <section id="recent-activity" ref={sectionRef} className="mb-20">
        {pulseStyle}
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-6 font-bold border-l-2 border-[#C5A86A] pl-3 flex items-center justify-between">
          <span>SYSTEM LOG // RECENT BROADCAST</span>
          <span className="text-[#A85C4A] font-mono text-[9px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A85C4A] animate-pulse" /> ONLINE
          </span>
        </h3>
        <div className="w-full bg-[#342632] text-[#F3EEE6] p-6 md:p-8 relative overflow-hidden builder-module-shadow border border-[#292226]">
          <div className="absolute inset-0 builder-blueprint-grid opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#C5A86A] font-bold mb-3 flex items-center justify-between">
              <span>TRANSMISSION SNAPSHOT</span>
              <span>{timeAgo(activity.publishedAt)}</span>
            </div>
            <p className="text-base text-[#F3EEE6]/90 leading-relaxed mb-6 font-medium line-clamp-3">
              {excerpt(activity.content, 220)}
            </p>
            <div className="flex flex-wrap gap-3">
              {published.map(({ platform, url }) => {
                const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Access', color: '#FFFFFF', bg: '#C5A86A' };
                const Icon = cfg.icon;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#292226] border border-[#C5A86A]/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F3EEE6] hover:border-[#C5A86A] hover:text-[#C5A86A] transition-all"
                  >
                    <Icon size={14} className="text-[#C5A86A]" />
                    <span>{cfg.name}</span>
                    <span className="text-[10px] text-[#C5A86A]">↗</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── 05. VISIONARY VARIANT (Orbital / Cosmic Editorial) ──
  if (variant === 'visionary') {
    return (
      <section id="recent-activity" ref={sectionRef} className="relative px-8 sm:px-12 py-12 border-b border-[#2C2825]/10">
        {pulseStyle}
        <div className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold mb-4 text-center md:text-left flex items-center gap-2 justify-center md:justify-start">
          <span>ORBITAL SIGNAL // RECENT BROADCAST</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#704E59] animate-pulse" />
        </div>
        <h3 className="visionary-serif text-3xl sm:text-4xl text-[#2C2825] mb-6 text-center md:text-left">
          Recent <span className="text-[#704E59] italic">dispatches.</span>
        </h3>
        <div className="metric-card relative p-6 sm:p-8 rounded-tr-3xl rounded-bl-3xl border border-[#704E59]/20 bg-[#FDFBF7] shadow-sm mb-4">
          <p className="text-sm sm:text-base leading-[1.8] text-[#2C2825]/85 max-w-2xl font-medium mb-6 line-clamp-3">
            {excerpt(activity.content, 220)}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Visit', color: '#FFFFFF', bg: '#704E59' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2C2825]/20 bg-white hover:bg-[#FDF8F6] text-xs font-bold text-[#2C2825] transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-[#704E59] text-white flex items-center justify-center">
                    <Icon size={11} />
                  </div>
                  <span>{cfg.name}</span>
                  <span className="text-[#8B958A] text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── 06. HUSTLER VARIANT (Industrial Brutalist / Blaze Orange) ──
  if (variant === 'hustler') {
    return (
      <div id="recent-activity" ref={sectionRef} className="p-8 border-b-2 border-[#292724] bg-white">
        {pulseStyle}
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] text-[#D64924] uppercase tracking-widest font-bold">
            LIVE FEED // RECENT DISPATCH
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#7A756D] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D64924] animate-pulse" /> SYNCED
          </span>
        </div>
        <div className="p-6 border-2 border-[#292724] bg-[#EAE8E3]/30 shadow-[4px_4px_0px_#292724] mb-4">
          <p className="text-xs uppercase tracking-wider font-bold text-[#292724] leading-relaxed mb-6 line-clamp-3">
            {excerpt(activity.content, 200)}
          </p>
          <div className="flex flex-wrap gap-3">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Open', color: '#FFFFFF', bg: '#D64924' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border-2 border-[#292724] bg-white text-[#292724] text-xs font-bold uppercase tracking-widest hover:bg-[#D64924] hover:text-white transition-colors shadow-[3px_3px_0px_#292724] flex items-center gap-2"
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span>→</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── 07. CREATOR VARIANT (Chamfered Geometric / Tech High-contrast) ──
  if (variant === 'creator') {
    return (
      <section id="recent-activity" ref={sectionRef} className="mb-12">
        {pulseStyle}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] tracking-widest uppercase font-bold text-slate-500">
            Latest Activity // Synchronized
          </span>
          <span className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </div>
        <div
          className="relative w-full bg-gradient-to-r from-white/70 to-white/95 backdrop-blur-md p-6 shadow-sm border border-slate-200"
          style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
        >
          <p className="text-sm text-slate-700 leading-relaxed font-medium mb-6 line-clamp-3">
            {excerpt(activity.content, 220)}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#0F172A' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-70">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── 08. STUDIO VARIANT (Swiss Editorial Minimalist) ──
  if (variant === 'studio') {
    return (
      <section id="recent-activity" ref={sectionRef} className="max-w-6xl mx-auto px-6 mb-20">
        {pulseStyle}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4 text-[#2C2E2A]/70">
            <div className="w-6 h-[1px] bg-[#2C2E2A]/70" />
            <span className="text-[10px] tracking-widest uppercase font-bold">Recent Activity</span>
          </div>
          <span className="text-[10px] tracking-widest uppercase text-[#8CA290] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CA290] animate-pulse" /> Live
          </span>
        </div>
        <div className="border border-[#2C2E2A]/15 p-8 bg-white/60 backdrop-blur-sm rounded-sm">
          <p className="font-serif text-lg md:text-xl text-[#2C2E2A] leading-relaxed mb-6 italic line-clamp-3">
            "{excerpt(activity.content, 220)}"
          </p>
          <div className="flex flex-wrap gap-3">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#2C2E2A' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2E2A] text-[#F5F4F0] text-xs font-bold uppercase tracking-widest hover:bg-[#8CA290] transition-colors rounded-sm"
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── 09. MACHINE VARIANT (Access Modules / Cyber Terminal) ──
  if (variant === 'machine') {
    return (
      <div id="recent-activity" ref={sectionRef} className="m-metric-item" style={{ marginTop: '24px', padding: '20px' }}>
        {pulseStyle}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="m-metric-lbl" style={{ color: accent || '#00FF66' }}>SYS.FEED // RECENT BROADCAST</span>
          <span style={{ fontSize: '10px', opacity: 0.6 }}>{timeAgo(activity.publishedAt)}</span>
        </div>
        <p style={{ fontSize: '12px', lineHeight: 1.6, opacity: 0.85, marginBottom: '16px' }}>
          {excerpt(activity.content, 180)}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {published.map(({ platform, url }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Connect', color: '#FFFFFF', bg: '#222' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="m-link-card"
                style={{ padding: '8px 14px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon size={12} />
                <span>{cfg.name}</span>
                <span>↗</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 10. CLUB VARIANT (Luxury Editorial / Plum Porcelain) ──
  if (variant === 'club') {
    return (
      <section id="recent-activity" ref={sectionRef} className="mb-16">
        {pulseStyle}
        <div className="flex items-center justify-between mb-4 border-b border-[#2C2825]/10 pb-2">
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#704E59]">
            03.5 // RECENT BROADCAST
          </span>
          <span className="text-[10px] tracking-widest uppercase text-stone-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#704E59] animate-pulse" /> LIVE
          </span>
        </div>
        <div className="p-8 border border-[#2C2825]/15 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm">
          <p className="font-serif text-lg md:text-xl text-[#2C2825] leading-relaxed mb-6 italic line-clamp-3">
            "{excerpt(activity.content, 220)}"
          </p>
          <div className="flex flex-wrap gap-2.5">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Read', color: '#FFFFFF', bg: '#2C2825' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2C2825] text-white text-xs font-medium tracking-wide hover:bg-[#704E59] transition-colors"
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-70">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── 11. ENERGY VARIANT (High Contrast Impact) ──
  if (variant === 'energy') {
    return (
      <div id="recent-activity" ref={sectionRef} className="mt-8 p-6 bg-[#111] border-l-4" style={{ borderColor: accentColor || '#CCFF00' }}>
        {pulseStyle}
        <div className="flex items-center justify-between mb-4 uppercase">
          <span className="text-sm font-bold tracking-widest" style={{ color: accentColor || '#CCFF00' }}>
            LATEST TRANSMISSION
          </span>
          <span className="text-xs font-mono opacity-60">{timeAgo(activity.publishedAt)}</span>
        </div>
        <p className="text-sm font-bold tracking-wide opacity-90 leading-relaxed mb-4">
          {excerpt(activity.content, 180)}
        </p>
        <div className="flex flex-wrap gap-2">
          {published.map(({ platform, url }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Open', color: '#FFFFFF', bg: '#222' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-bold uppercase text-xs hover:bg-[#CCFF00] transition-colors"
                style={{ transform: 'skewX(-10deg)' }}
              >
                <span style={{ transform: 'skewX(10deg)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={13} />
                  {cfg.name} ↗
                </span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 12. VISION VARIANT (Holographic Cyber) ──
  if (variant === 'vision') {
    return (
      <div id="recent-activity" ref={sectionRef} className="my-6 p-6 rounded-xl border border-cyan-500/30 bg-black/40 backdrop-blur-md">
        {pulseStyle}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            SYSTEM.FEED // BROADCAST
          </span>
          <span className="text-[10px] font-mono text-cyan-500/70">{timeAgo(activity.publishedAt)}</span>
        </div>
        <p className="text-xs text-white/90 leading-relaxed mb-4 line-clamp-3">
          {excerpt(activity.content, 200)}
        </p>
        <div className="flex flex-wrap gap-2">
          {published.map(({ platform, url }) => {
            const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#06b6d4' };
            const Icon = cfg.icon;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-xs font-mono hover:bg-cyan-900/60 transition-colors"
              >
                <Icon size={12} />
                <span>{cfg.name}</span>
                <span>↗</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 13. HUMAN VARIANT (Warm Organic Curves) ──
  if (variant === 'human') {
    return (
      <div id="recent-activity" ref={sectionRef} className="max-w-[1300px] mx-auto px-6 md:px-12 mb-12 relative z-10">
        {pulseStyle}
        <div className="p-8 rounded-3xl bg-[#EFE4CC]/90 border border-[#1B1D1B]/15 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#123040]">
              Community Dispatch // Recent Activity
            </span>
            <span className="text-[10px] text-[#BE5B42] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#BE5B42] animate-pulse" /> Live
            </span>
          </div>
          <p className="text-base text-[#1B1D1B]/90 font-serif leading-relaxed mb-6 line-clamp-3">
            {excerpt(activity.content, 220)}
          </p>
          <div className="flex flex-wrap gap-3">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'Connect', color: '#FFFFFF', bg: '#123040' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#123040] text-[#F4EDDC] text-xs font-bold font-sans hover:bg-[#BE5B42] transition-colors"
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── 14. AESTHETE VARIANT (Quiet Luxury / Warm Stone) ──
  if (variant === 'aesthete') {
    return (
      <div id="recent-activity" ref={sectionRef} className="p-8 md:p-10 lg:p-14 pt-0 mb-6">
        {pulseStyle}
        <div className="w-full h-px bg-[#292826]/10 mb-8" />
        <div className="flex justify-between items-center text-[#292826]/50 font-inter text-[9px] tracking-[0.2em] uppercase mb-4">
          <span>Recent Activity</span>
          <span className="flex items-center gap-1.5 text-[#A39686]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A39686] animate-pulse" /> Live
          </span>
        </div>
        <div className="p-6 rounded-2xl bg-white/70 border border-[#292826]/10">
          <p className="font-serif italic text-base text-[#292826]/85 leading-relaxed mb-5 line-clamp-3">
            "{excerpt(activity.content, 220)}"
          </p>
          <div className="flex flex-wrap gap-2.5">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#292826' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#292826]/15 bg-white text-[#292826] text-xs font-inter hover:bg-[#A39686] hover:text-white transition-colors"
                >
                  <Icon size={12} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px] opacity-60">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── 15. VOICE VARIANT (Botanical Coral & Moss) ──
  if (variant === 'voice') {
    return (
      <section id="recent-activity" ref={sectionRef} className="mb-12">
        {pulseStyle}
        <div className="flex items-center justify-between mb-4 border-b border-[#8DA396]/30 pb-2">
          <span className="text-[#8DA396] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase">
            Recent Activity // Broadcast
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#DF5B4C] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DF5B4C] animate-pulse" /> Live
          </span>
        </div>
        <div className="p-6 md:p-8 rounded-3xl bg-white/80 border border-[#8DA396]/30 shadow-sm">
          <p className="text-base text-[#1C2B21] font-medium leading-relaxed mb-6 line-clamp-3">
            {excerpt(activity.content, 220)}
          </p>
          <div className="flex flex-wrap gap-3">
            {published.map(({ platform, url }) => {
              const cfg = PLATFORM_CONFIG[platform.toLowerCase()] ?? { icon: ExternalLink, name: platform, cta: 'View', color: '#FFFFFF', bg: '#1C2B21' };
              const Icon = cfg.icon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C2B21] text-[#EBF0EC] text-xs font-semibold hover:bg-[#DF5B4C] transition-colors"
                >
                  <Icon size={13} />
                  <span>{cfg.name}</span>
                  <span className="text-[10px]">↗</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── DEFAULT VARIANT ──
  const sectionBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const borderCol = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const labelCol  = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.38)';
  const textCol   = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)';

  return (
    <div
      id="recent-activity"
      ref={sectionRef}
      style={{
        background: sectionBg,
        border: `1px solid ${borderCol}`,
        borderRadius: 20,
        padding: '28px 24px',
        scrollMarginTop: 80,
      }}
    >
      {pulseStyle}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#22C55E',
            boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
            display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: labelCol }}>
            Recent Broadcast
          </span>
        </div>
        {activity.publishedAt && (
          <span style={{ fontSize: 11, color: labelCol }}>{timeAgo(activity.publishedAt)}</span>
        )}
      </div>

      <p style={{
        fontSize: 14, lineHeight: 1.65, color: textCol, marginBottom: 20,
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {excerpt(activity.content)}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 15px', borderRadius: 999,
                background: cfg.bg, color: cfg.color,
                fontSize: 12, fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.15s, transform 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.opacity = '0.82';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <Icon size={13} />
              {cfg.cta}
            </a>
          );
        })}
      </div>

      <p style={{ marginTop: 14, fontSize: 11, color: labelCol }}>
        Published simultaneously on {published.length} platform{published.length !== 1 ? 's' : ''} via Unool
      </p>
    </div>
  );
}

