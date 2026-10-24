'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { PlatformSVGs } from '@/components/dashboard/PlatformLogos';
import type { RecentActivityPlatform } from '@/components/profile/RecentActivitySection';

/**
 * Activity Variants Configuration
 *
 * Centralized config for all 15 RecentActivitySection variants.
 * Each variant defines its visual styling through a structured config object.
 * This eliminates 900+ lines of duplicated render logic.
 */

// ─── Platform Config ────────────────────────────────────────────────────────────

export const PLATFORM_CONFIG: Record<
  string,
  { icon: any; name: string; cta: string; color: string; bg: string }
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
  warpcast:  { icon: PlatformSVGs.warpcast,  name: 'Farcaster',   cta: 'View Cast',     color: '#FFFFFF', bg: '#8A63D2' },
  farcaster: { icon: PlatformSVGs.warpcast,  name: 'Farcaster',   cta: 'View Cast',     color: '#FFFFFF', bg: '#8A63D2' },
  mewe:      { icon: PlatformSVGs.mewe,      name: 'MeWe',        cta: 'View Post',     color: '#FFFFFF', bg: '#2F435E' },
  nostr:     { icon: PlatformSVGs.nostr,      name: 'Nostr',       cta: 'View Note',     color: '#FFFFFF', bg: '#9B51E0' },
  medium:    { icon: PlatformSVGs.medium,    name: 'Medium',      cta: 'Read Story',    color: '#FFFFFF', bg: '#12100E' },
  tiktok:    { icon: PlatformSVGs.tiktok,    name: 'TikTok',      cta: 'Watch Video',   color: '#FFFFFF', bg: '#000000' },
  hashnode:  { icon: PlatformSVGs.hashnode,  name: 'Hashnode',    cta: 'Read Article',  color: '#FFFFFF', bg: '#2962FF' },
  listmonk:  { icon: PlatformSVGs.listmonk,  name: 'Listmonk',    cta: 'Read Update',   color: '#FFFFFF', bg: '#0045FF' },
  lemmy:     { icon: PlatformSVGs.lemmy,     name: 'Lemmy',       cta: 'View on Lemmy', color: '#FFFFFF', bg: '#00BC8C' },
  devto:     { icon: PlatformSVGs.devto,     name: 'DEV.to',      cta: 'Read Article',  color: '#FFFFFF', bg: '#0A0A0A' },
  reddit:    { icon: PlatformSVGs.reddit,    name: 'Reddit',      cta: 'View Post',     color: '#FFFFFF', bg: '#FF4500' },
  slack:     { icon: PlatformSVGs.slack,     name: 'Slack',       cta: 'Open Channel',  color: '#FFFFFF', bg: '#4A154B' },
};

export const DEFAULT_PLATFORM_CFG = { icon: ExternalLink, name: 'Link', cta: 'View', color: '#FFFFFF', bg: '#555555' };

// ─── Type Definitions ────────────────────────────────────────────────────────────

export interface PlatformConfigItem {
  icon: any;
  name: string;
  cta: string;
  color: string;
  bg: string;
}

// Use a broader type for platform button style config to allow variant-specific overrides
type PlatformButtonStyleConfig = PlatformConfigItem & { icon?: any };

export interface VariantConfig {
  // Container styling
  containerClassName: string;
  containerStyle?: React.CSSProperties | ((isDark: boolean, accent: string) => React.CSSProperties);

  // Header
  headerClassName: string;
  pulseColor: string;
  pulseSize?: string;
  title: string;
  titleClassName: string;
  titleStyle?: (isDark: boolean) => React.CSSProperties;
  timestampClassName: string;
  timestampStyle?: (isDark: boolean) => React.CSSProperties;

  // Content
  contentClassName: string;
  contentStyle?: React.CSSProperties | ((isDark: boolean) => React.CSSProperties);
  excerptMaxLength?: number;

  // Platform buttons
  platformContainerClassName: string;
  platformContainerStyle?: (isDark: boolean) => React.CSSProperties;
  platformButtonClassName: string;
  platformButtonStyle?: (cfg: PlatformButtonStyleConfig, isDark: boolean) => React.CSSProperties;
  platformIconSize?: number;
  platformIconWrapper?: (icon: React.ReactNode, name: string) => React.ReactNode;

  // Footer
  footerClassName: string;
  footerStyle?: (isDark: boolean) => React.CSSProperties;
  footerDescription: string;

  // Pulse animation
  pulseAnimationColor: string;

  // Custom render overrides (for complex variants like energy with skew)
  customRender?: {
    container?: (children: React.ReactNode) => React.ReactNode;
    content?: (excerpt: string) => React.ReactNode;
    platformButton?: (props: { cfg: PlatformButtonStyleConfig; url: string; platform: string }) => React.ReactNode;
  };
}

export type VariantKey =
  | 'lover' | 'lone' | 'rebellion' | 'builder' | 'visionary'
  | 'hustler' | 'creator' | 'studio' | 'machine' | 'club'
  | 'energy' | 'vision' | 'human' | 'aesthete' | 'voice' | 'default';

// ─── Helper Functions ────────────────────────────────────────────────────────────

const getPlatformCfg = (platform: string) =>
  PLATFORM_CONFIG[platform.toLowerCase()] ?? DEFAULT_PLATFORM_CFG;

const createPulseStyle = (accentColor: string) => (
  <style>{`
    @keyframes ra-pulse {
      0%   { box-shadow: 0 0 0 0 ${accentColor}77; }
      60%  { box-shadow: 0 0 0 16px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
    #recent-activity.ra-highlight {
      animation: ra-pulse 1.4s ease-out 2;
    }
  `}</style>
);

// ─── Variant Configurations ──────────────────────────────────────────────────────

export const VARIANT_CONFIGS: Record<VariantKey, VariantConfig> = {
  lover: {
    containerClassName: 'space-y-2 mb-6',
    headerClassName: 'flex items-center justify-between px-1',
    pulseColor: '#CF5628',
    pulseSize: 'w-2 h-2',
    title: 'New Post Shared With You',
    titleClassName: 'text-[11px] font-bold text-[#2A1710] uppercase tracking-wider font-mono-tag',
    timestampClassName: 'text-[10px] text-[#CF5628] font-mono-tag font-semibold',
    contentClassName: 'clay-card p-4 space-y-3',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-1 border-t border-[#CF5628]/10',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all text-white no-underline',
    platformIconSize: 13,
    footerClassName: 'text-[10px] text-stone-500 font-mono-tag flex items-center justify-between pt-0.5',
    footerDescription: 'Tap your preferred platform to view & engage',
    pulseAnimationColor: '#CF5628',
  },

  lone: {
    containerClassName: 'flex flex-col gap-2.5 my-6',
    headerClassName: 'flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-[#9296A0] px-2 font-medium',
    pulseColor: '#123DFF',
    pulseSize: 'w-2 h-2',
    title: 'New Post Shared With You',
    titleClassName: 'flex items-center gap-1.5 text-[#123DFF] font-bold',
    timestampClassName: 'text-[10px] text-[#9296A0]',
    contentClassName: 'w-full rounded-2xl overflow-hidden p-4 relative shadow-[0_4px_20px_rgba(0,0,0,0.35)]',
    contentStyle: {
      background: 'linear-gradient(135deg, rgba(17, 19, 24, 0.85), rgba(12, 14, 18, 0.95))',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
    },
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-white/10',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md hover:scale-105 active:scale-95 transition-all text-white no-underline',
    platformIconSize: 13,
    footerClassName: 'mt-2 text-[10px] text-[#9296A0] flex items-center justify-between',
    footerDescription: 'Tap any platform above to view & support',
    pulseAnimationColor: '#123DFF',
  },

  rebellion: {
    containerClassName: 'my-6',
    headerClassName: 'flex items-center justify-between mb-2 border-b border-[#C8102E]/30 pb-1.5',
    pulseColor: '#C8102E',
    pulseSize: 'w-1.5 h-1.5',
    title: 'New Transmission // Shared With You',
    titleClassName: 'text-[11px] font-bold tracking-[0.2em] uppercase text-[#C8102E]',
    timestampClassName: 'text-[10px] font-mono uppercase text-[#C8102E] flex items-center gap-1.5',
    contentClassName: 'p-4 rounded-xl border border-[#C8102E]/30 bg-[#161413]/90 backdrop-blur-md shadow-lg space-y-3',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#C8102E]/20',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-transform hover:scale-105 active:scale-95 shadow-sm no-underline',
    platformIconSize: 13,
    footerClassName: 'text-[10px] text-[#EAE8E3]/50 flex items-center justify-between',
    footerDescription: 'Direct access to full post — pick your venue',
    pulseAnimationColor: '#C8102E',
  },

  builder: {
    containerClassName: 'my-6',
    headerClassName: 'text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-2 font-bold border-l-2 border-[#C5A86A] pl-2.5 flex items-center justify-between',
    pulseColor: '#C5A86A',
    pulseSize: 'w-1.5 h-1.5',
    title: 'SYS.TRANSMISSION // SHARED WITH YOU',
    titleClassName: 'flex items-center gap-1.5 text-[#C5A86A]',
    timestampClassName: 'text-[#87958A] font-mono text-[9px]',
    contentClassName: 'w-full bg-[#2B232A] text-[#F3EEE6] p-4 relative overflow-hidden border border-[#C5A86A]/30 space-y-3',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#C5A86A]/20',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:scale-105 active:scale-95 transition-all no-underline',
    platformIconSize: 13,
    footerClassName: 'text-[10px] text-[#F3EEE6]/50 font-mono flex items-center justify-between',
    footerDescription: 'Direct endpoint access — select to inspect & engage',
    pulseAnimationColor: '#C5A86A',
  },

  visionary: {
    containerClassName: 'my-6',
    headerClassName: 'flex items-center justify-between mb-2',
    pulseColor: '#704E59',
    pulseSize: 'w-2 h-2',
    title: 'New Dispatch // Shared With You',
    titleClassName: 'text-[10px] tracking-[0.2em] text-[#704E59] uppercase font-bold',
    timestampClassName: 'text-[10px] text-[#8B958A] font-mono',
    contentClassName: 'metric-card p-4 sm:p-5 rounded-2xl border border-[#704E59]/20 bg-[#FDFBF7] shadow-sm space-y-3',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#704E59]/15',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:scale-105 active:scale-95 transition-all no-underline',
    platformIconSize: 12,
    footerClassName: 'text-[10px] text-[#2C2825]/55 flex items-center justify-between',
    footerDescription: 'Tap your preferred venue to view & interact',
    pulseAnimationColor: '#704E59',
  },

  hustler: {
    containerClassName: 'my-6 p-4 sm:p-5 border-2 border-[#292724] bg-white shadow-[4px_4px_0px_#292724] space-y-3',
    headerClassName: 'flex items-center justify-between',
    pulseColor: '#D64924',
    pulseSize: 'w-2.5 h-2.5',
    title: 'NEW POST // SHARED WITH YOU',
    titleClassName: 'text-[11px] text-[#D64924] uppercase tracking-wider font-extrabold',
    timestampClassName: 'text-[10px] font-mono uppercase text-[#7A756D]',
    contentClassName: '',
    excerptMaxLength: 130,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t-2 border-[#292724]/20',
    platformButtonClassName: 'px-3.5 py-1.5 border-2 border-[#292724] text-xs font-extrabold uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-[2px_2px_0px_#292724] inline-flex items-center gap-1.5 no-underline',
    platformIconSize: 12,
    footerClassName: 'text-[10px] font-bold uppercase tracking-wider text-[#7A756D] flex items-center justify-between',
    footerDescription: 'Tap to view & engage instantly',
    pulseAnimationColor: '#D64924',
    customRender: {
      content: (excerpt) => (
        <p className="text-xs uppercase tracking-wide font-bold text-[#292724] leading-relaxed line-clamp-2">
          "{excerpt}"
        </p>
      ),
    },
  },

  creator: {
    containerClassName: 'my-6',
    headerClassName: 'flex items-center justify-between mb-2',
    pulseColor: '#10B981',
    pulseSize: 'w-2 h-2',
    title: 'Latest Post // Shared With You',
    titleClassName: 'text-[10px] tracking-widest uppercase font-bold text-slate-700',
    timestampClassName: 'text-[10px] font-mono uppercase text-slate-400',
    contentClassName: 'relative w-full bg-white/85 backdrop-blur-md p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3',
    contentStyle: {
      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
    },
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-slate-200/80',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-sm no-underline text-white',
    platformButtonStyle: (cfg) => ({
      background: cfg.bg,
      color: cfg.color,
      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
    }),
    platformIconSize: 12,
    footerClassName: 'text-[10px] text-slate-500 flex items-center justify-between',
    footerDescription: 'Tap your preferred network to view full post',
    pulseAnimationColor: '#10B981',
  },

  studio: {
    containerClassName: 'my-6 transition-all duration-300',
    containerStyle: (isDark: boolean, accent: string) => ({
      background: isDark ? 'rgba(13, 30, 26, 0.75)' : 'rgba(255, 255, 255, 0.85)',
      border: isDark ? '1px solid rgba(180, 215, 200, 0.16)' : '1px solid rgba(44, 46, 42, 0.12)',
      borderRadius: '16px',
      padding: '20px 24px',
      boxShadow: isDark ? '0 12px 32px rgba(6, 16, 14, 0.4), inset 0 1px 0 rgba(180, 215, 200, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      scrollMarginTop: '96px',
    }),
    headerClassName: 'flex justify-between items-center mb-3',
    pulseColor: '#D4FF70',
    pulseSize: 'w-2 h-2',
    title: 'NEW POST SHARED WITH YOU',
    titleClassName: 'text-[11px] tracking-[0.2em] uppercase font-mono font-bold',
    titleStyle: (isDark: boolean) => ({
      color: isDark ? '#D4FF70' : '#2C2E2A',
    }),
    timestampClassName: 'text-[10px] tracking-widest uppercase font-mono',
    timestampStyle: (isDark: boolean) => ({
      color: isDark ? '#8BA89B' : '#6B7280',
    }),
    contentClassName: 'space-y-3.5',
    contentStyle: (isDark: boolean) => ({
      color: isDark ? '#F8FAF7' : '#1A1A1A',
      fontSize: '14.5px',
      lineHeight: '1.65',
    }),
    excerptMaxLength: 180,
    platformContainerClassName: 'flex flex-wrap gap-2.5 pt-3 border-t',
    platformContainerStyle: (isDark: boolean) => ({
      borderColor: isDark ? 'rgba(180, 215, 200, 0.12)' : 'rgba(44, 46, 42, 0.1)',
    }),
    platformButtonClassName: 'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold tracking-wide hover:scale-105 active:scale-95 transition-all rounded-lg no-underline text-white shadow-sm',
    platformIconSize: 13,
    footerClassName: 'text-[11px] flex items-center justify-between font-mono pt-1',
    footerStyle: (isDark: boolean) => ({
      color: isDark ? '#8BA89B' : '#6B7280',
    }),
    footerDescription: 'Direct multi-network link · Select outlet to view or engage',
    pulseAnimationColor: '#D4FF70',
  },

  machine: {
    containerClassName: 'my-6 p-4 rounded-xl border border-[#00FF66]/30 bg-[#0C0F0D]/90 backdrop-blur-md space-y-3',
    headerClassName: 'flex justify-between items-center text-[10px] font-mono',
    pulseColor: '#00FF66',
    pulseSize: 'w-2 h-2',
    title: 'SYS.FEED // SHARED TRANSMISSION',
    titleClassName: 'flex items-center gap-1.5 text-[#00FF66] font-bold tracking-widest',
    timestampClassName: 'opacity-60',
    contentClassName: '',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#00FF66]/20',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-white no-underline',
    platformIconSize: 12,
    footerClassName: 'text-[10px] font-mono text-white/50 flex items-center justify-between',
    footerDescription: 'Multi-uplink active — tap node to view full payload',
    pulseAnimationColor: '#00FF66',
  },

  club: {
    containerClassName: 'my-6',
    headerClassName: 'flex items-center justify-between mb-2 border-b border-[#2C2825]/10 pb-1.5',
    pulseColor: '#704E59',
    pulseSize: 'w-2 h-2',
    title: 'Shared Dispatch // Just Published',
    titleClassName: 'text-[10px] tracking-[0.25em] uppercase font-bold text-[#704E59]',
    timestampClassName: 'text-[10px] tracking-widest uppercase text-stone-400 font-mono',
    contentClassName: 'p-4 sm:p-5 border border-[#2C2825]/15 bg-white/75 backdrop-blur-md rounded-2xl shadow-sm space-y-3',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#2C2825]/10',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm',
    platformIconSize: 12,
    footerClassName: 'text-[10px] text-[#2C2825]/60 flex items-center justify-between',
    footerDescription: 'Direct reading links — tap your preferred circle',
    pulseAnimationColor: '#704E59',
  },

  energy: {
    containerClassName: 'my-6 p-4 sm:p-5 bg-[#111] border-l-4 border-[#CCFF00] space-y-3',
    headerClassName: 'flex items-center justify-between uppercase',
    pulseColor: '#CCFF00',
    pulseSize: 'w-2 h-2',
    title: 'LATEST DROP // SHARED WITH YOU',
    titleClassName: 'text-xs font-extrabold tracking-widest text-[#CCFF00]',
    timestampClassName: 'text-xs font-mono opacity-60 text-white',
    contentClassName: '',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-white/10',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 font-bold uppercase text-xs hover:scale-105 active:scale-95 transition-transform no-underline text-white',
    platformButtonStyle: (cfg) => ({
      background: cfg.bg,
      color: cfg.color,
      transform: 'skewX(-6deg)',
    }),
    platformIconSize: 12,
    platformIconWrapper: (icon, name) => (
      <span style={{ transform: 'skewX(6deg)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        {icon}
        {name} ↗
      </span>
    ),
    footerClassName: 'text-[10px] font-mono text-white/50 flex items-center justify-between',
    footerDescription: 'Tap your venue to view full drop',
    pulseAnimationColor: '#CCFF00',
  },

  vision: {
    containerClassName: 'my-6 p-4 sm:p-5 rounded-xl border border-cyan-500/30 bg-black/50 backdrop-blur-md space-y-3',
    headerClassName: 'flex items-center justify-between',
    pulseColor: '#06b6d4',
    pulseSize: 'w-2 h-2',
    title: 'SYS.FEED // SHARED BROADCAST',
    titleClassName: 'text-[10px] font-mono uppercase tracking-widest font-bold text-cyan-400',
    timestampClassName: 'text-[10px] font-mono text-cyan-500/70',
    contentClassName: '',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-cyan-500/20',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm',
    platformIconSize: 12,
    footerClassName: 'text-[10px] font-mono text-cyan-400/60 flex items-center justify-between',
    footerDescription: 'Multi-stream uplink — tap node to view full post',
    pulseAnimationColor: '#06b6d4',
  },

  human: {
    containerClassName: 'my-6 relative z-10',
    headerClassName: 'flex items-center justify-between',
    pulseColor: '#BE5B42',
    pulseSize: 'w-2 h-2',
    title: 'Community Dispatch // Shared With You',
    titleClassName: 'text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#123040]',
    timestampClassName: 'text-[10px] text-[#BE5B42] font-mono font-bold',
    contentClassName: 'p-4 sm:p-5 rounded-2xl bg-[#EFE4CC]/90 border border-[#1B1D1B]/15 shadow-sm space-y-3',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#1B1D1B]/10',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-sans hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm',
    platformIconSize: 12,
    footerClassName: 'text-[10px] text-[#1B1D1B]/60 flex items-center justify-between',
    footerDescription: 'Tap your preferred platform to join the conversation',
    pulseAnimationColor: '#BE5B42',
  },

  aesthete: {
    containerClassName: 'my-6',
    headerClassName: 'flex justify-between items-center text-[#292826]/70 font-inter text-[9px] tracking-[0.2em] uppercase mb-2',
    pulseColor: '#A39686',
    pulseSize: 'w-1.5 h-1.5',
    title: 'New Post Shared With You',
    titleClassName: 'flex items-center gap-1.5 text-[#292826] font-bold',
    timestampClassName: 'text-[#A39686] font-mono',
    contentClassName: 'p-4 sm:p-5 rounded-2xl bg-white/75 border border-[#292826]/10 space-y-3 shadow-sm',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#292826]/10',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter font-semibold hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm',
    platformIconSize: 12,
    footerClassName: 'text-[10px] text-[#292826]/50 flex items-center justify-between',
    footerDescription: 'Direct access to full story — tap any venue',
    pulseAnimationColor: '#A39686',
  },

  voice: {
    containerClassName: 'my-6',
    headerClassName: 'flex items-center justify-between mb-2 border-b border-[#8DA396]/30 pb-1.5',
    pulseColor: '#DF5B4C',
    pulseSize: 'w-2 h-2',
    title: 'Fresh Post // Shared With You',
    titleClassName: 'text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C2B21]',
    timestampClassName: 'text-[10px] font-mono uppercase text-[#DF5B4C]',
    contentClassName: 'p-4 sm:p-5 rounded-2xl bg-white/80 border border-[#8DA396]/30 shadow-sm space-y-3',
    excerptMaxLength: 140,
    platformContainerClassName: 'flex flex-wrap gap-2 pt-2 border-t border-[#8DA396]/20',
    platformButtonClassName: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all text-white no-underline shadow-sm',
    platformIconSize: 12,
    footerClassName: 'text-[10px] text-[#1C2B21]/60 flex items-center justify-between',
    footerDescription: 'Tap your preferred platform to read & engage',
    pulseAnimationColor: '#DF5B4C',
  },

  default: {
    containerClassName: 'my-6 shadow-sm space-y-3',
    containerStyle: (isDark: boolean, accent: string) => ({
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: 20,
      padding: '18px 20px',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      scrollMarginTop: 80,
    }),
    headerClassName: 'flex items-center justify-between flex-wrap gap-2',
    pulseColor: '#22C55E',
    pulseSize: 'w-[8px] h-[8px]',
    title: 'New Post Shared With You',
    titleClassName: 'font-mono',
    titleStyle: (isDark: boolean) => ({
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)',
    }),
    timestampClassName: 'font-mono',
    timestampStyle: (isDark: boolean) => ({
      fontSize: 11,
      color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)',
    }),
    contentClassName: '',
    contentStyle: (isDark: boolean) => ({
      fontSize: 13,
      lineHeight: 1.6,
      color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }),
    excerptMaxLength: 140,
    platformContainerClassName: '',
    platformContainerStyle: (isDark: boolean) => ({
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 6,
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
    }),
    platformButtonClassName: 'hover:scale-105 active:scale-95 transition-transform',
    platformButtonStyle: (cfg: typeof DEFAULT_PLATFORM_CFG, isDark: boolean) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 999,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 12,
      fontWeight: 600,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    }),
    platformIconSize: 12,
    footerClassName: '',
    footerStyle: (isDark: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 10,
      color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)',
      paddingTop: 2,
    }),
    footerDescription: 'Tap any platform above to view & engage with the full post',
    pulseAnimationColor: '#22C55E',
  },
};

// ─── Shared Render Helpers ──────────────────────────────────────────────────────

export function renderPulseIndicator(config: VariantConfig, isDefault = false) {
  if (isDefault) {
    return (
      <span
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#22C55E',
          boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
          display: 'inline-block', flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span className={`w-2 h-2 rounded-full animate-pulse ${config.pulseSize}`} style={{ background: config.pulseColor }} />
  );
}

export function renderPlatformButtons(
  published: RecentActivityPlatform[],
  config: VariantConfig,
  isDefault = false,
  isDark = false,
  accentColor?: string
) {
  if (isDefault) {
    const borderCol = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    return (
      <div style={config.platformContainerStyle?.(isDark)}>
        {published.map(({ platform, url }) => {
          const cfg = getPlatformCfg(platform);
          const Icon = cfg.icon;
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${cfg.cta} on ${cfg.name}`}
              className={config.platformButtonClassName}
              style={config.platformButtonStyle?.(cfg, isDark)}
            >
              <Icon size={config.platformIconSize ?? 12} />
              <span>{cfg.name}</span>
              <span style={{ opacity: 0.8, fontSize: 10 }}>↗</span>
            </a>
          );
        })}
      </div>
    );
  }

  if (config.customRender?.platformButton) {
    return (
      <div className={config.platformContainerClassName}>
        {published.map(({ platform, url }) =>
          config.customRender!.platformButton!({
            cfg: getPlatformCfg(platform),
            url,
            platform,
          })
        )}
      </div>
    );
  }

  return (
    <div className={config.platformContainerClassName}>
      {published.map(({ platform, url }) => {
        const cfg = getPlatformCfg(platform);
        const Icon = cfg.icon;
        const buttonStyle = config.platformButtonStyle?.(cfg, isDark);
        const iconWrapper = config.platformIconWrapper;

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={config.platformButtonClassName}
            style={buttonStyle}
            title={`Open on ${cfg.name}`}
          >
            {iconWrapper ? (
              iconWrapper(<Icon size={config.platformIconSize ?? 12} />, cfg.name)
            ) : (
              <>
                <Icon size={config.platformIconSize ?? 12} />
                <span>{cfg.name}</span>
                <span className="opacity-80 text-[10px]">↗</span>
              </>
            )}
          </a>
        );
      })}
    </div>
  );
}

export function renderFooter(
  published: RecentActivityPlatform[],
  config: VariantConfig,
  isDefault = false,
  isDark = false
) {
  if (isDefault) {
    return (
      <div style={config.footerStyle?.(isDark)}>
        <span>{config.footerDescription}</span>
        <span>Live on {published.length} platform{published.length !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  return (
    <div className={config.footerClassName}>
      <span dangerouslySetInnerHTML={{ __html: config.footerDescription }} />
      <span>Live on {published.length} {config.footerDescription.includes('network') ? 'network' : config.footerDescription.includes('feed') ? 'feed' : config.footerDescription.includes('channel') ? 'channel' : 'platform'}{published.length !== 1 ? 's' : ''}</span>
    </div>
  );
}