'use client';

import React, { useEffect, useRef } from 'react';
import {
  Linkedin, Twitter, MessageSquare, Send, Hash, Cloud, ExternalLink,
  Dribbble, Zap, FileText, GraduationCap, Store, Gamepad2, Video,
  Instagram, Youtube, Image as ImageIcon, Facebook, Twitch,
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

interface RecentActivitySectionProps {
  activity: RecentActivityData;
  /** Whether the parent template has a dark background */
  isDark?: boolean;
  /** Accent colour from the profile theme */
  accentColor?: string;
  /** When true, auto-scroll to this section on mount */
  autoScroll?: boolean;
}

// ─── Platform Config ─────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
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

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function excerpt(text: string, max = 260): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).trimEnd() + '…';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecentActivitySection({
  activity,
  isDark = false,
  accentColor,
  autoScroll = false,
}: RecentActivitySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Trigger highlight pulse after scroll settles
      setTimeout(() => {
        const el = document.getElementById('recent-activity');
        if (el) {
          el.classList.remove('ra-highlight');
          void (el as HTMLElement).offsetWidth; // force reflow
          el.classList.add('ra-highlight');
        }
      }, 600);
    }, 350);
    return () => clearTimeout(timer);
  }, [autoScroll]);

  // Only render platforms that actually have a live URL
  const published = activity.platforms.filter(p => p.url?.startsWith('http'));
  if (published.length === 0) return null;

  const accent = accentColor || (isDark ? '#FFFFFF' : '#222222');

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
      {/* Keyframe for highlight pulse – inline so no external CSS dependency */}
      <style>{`
        @keyframes ra-pulse {
          0%   { box-shadow: 0 0 0 0 ${accent}44; }
          60%  { box-shadow: 0 0 0 16px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        #recent-activity.ra-highlight {
          animation: ra-pulse 1.4s ease-out 2;
        }
      `}</style>

      {/* ── Header ── */}
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

      {/* ── Content excerpt ── */}
      <p style={{
        fontSize: 14, lineHeight: 1.65, color: textCol, marginBottom: 20,
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {excerpt(activity.content)}
      </p>

      {/* ── Platform CTA buttons ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {published.map(({ platform, url }) => {
          const cfg = PLATFORM_CONFIG[platform] ?? {
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

      {/* ── Footer label ── */}
      <p style={{ marginTop: 14, fontSize: 11, color: labelCol }}>
        Published simultaneously on {published.length} platform{published.length !== 1 ? 's' : ''} via Unool
      </p>
    </div>
  );
}
