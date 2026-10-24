'use client';

import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
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
  activity: RecentActivityData | RecentActivityData[] | null | undefined;
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

// ─── Import Config ────────────────────────────────────────────────────────────

import {
  VARIANT_CONFIGS,
  PLATFORM_CONFIG,
  DEFAULT_PLATFORM_CFG,
  VariantKey,
  VariantConfig,
  renderPulseIndicator,
  renderPlatformButtons,
  renderFooter,
} from '@/components/profile/templates/activityVariants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function excerpt(text: string, max = 150): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).trimEnd() + '…';
}

function getPlatformCfg(platform: string) {
  return PLATFORM_CONFIG[platform.toLowerCase()] ?? DEFAULT_PLATFORM_CFG;
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

    const performScroll = () => {
      const target =
        sectionRef.current ||
        document.getElementById('recent-activity') ||
        document.getElementById('recent-transmissions-section') ||
        document.getElementById('recent-activity-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.remove('ra-highlight');
        void (target as HTMLElement).offsetWidth;
        target.classList.add('ra-highlight');
      }
    };

    // Multi-phase attempts to ensure scroll occurs reliably across lazy imports and dynamic fonts
    const t1 = setTimeout(performScroll, 200);
    const t2 = setTimeout(performScroll, 600);
    const t3 = setTimeout(performScroll, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [autoScroll, activity]);

  if (!activity) return null;

  // Handle both single activity object and array of activities
  const activityItem = Array.isArray(activity) ? activity[0] : activity;
  if (!activityItem) return null;

  const rawPlatforms = activityItem.platforms || [];
  const published = rawPlatforms.length > 0
    ? rawPlatforms.map(p => ({
        ...p,
        url: p.url && (p.url.startsWith('http://') || p.url.startsWith('https://'))
          ? p.url
          : p.platform && p.platform !== 'network'
          ? `https://${p.platform}.com`
          : '#',
      }))
    : [{ platform: 'network', url: '#', adaptedContent: activityItem.content }];

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

  // Get variant config
  const config = VARIANT_CONFIGS[variant as VariantKey] ?? VARIANT_CONFIGS.default;
  const isDefaultVariant = variant === 'default';

  // ── DEFAULT VARIANT (Universal Adaptive Glassmorphism) ──
  if (isDefaultVariant) {
    const sectionBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';
    const borderCol = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    const labelCol = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)';
    const textCol = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';

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
            {renderPulseIndicator(config, true)}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: labelCol,
              }}
            >
              New Post Shared With You
            </span>
          </div>
          {activityItem.publishedAt && (
            <span style={{ fontSize: 11, color: labelCol }} className="font-mono">
              {timeAgo(activityItem.publishedAt)}
            </span>
          )}
        </div>

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: textCol,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          "{excerpt(activityItem.content, 140)}"
        </p>

        {renderPlatformButtons(published, config, true, isDark, accent)}

        {renderFooter(published, config, true, isDark)}
      </div>
    );
  }

  // ── CONFIG-DRIVEN VARIANTS ──
  const containerStyle = typeof config.containerStyle === 'function'
    ? config.containerStyle(isDark, accent)
    : config.containerStyle;
  const contentStyle = typeof config.contentStyle === 'function'
    ? config.contentStyle(isDark)
    : config.contentStyle;
  const titleStyle = config.titleStyle?.(isDark);
  const timestampStyle = config.timestampStyle?.(isDark);
  const platformContainerStyle = config.platformContainerStyle?.(isDark);
  const footerStyle = config.footerStyle?.(isDark);

  // Custom render overrides
  const customContainer = config.customRender?.container;
  const customContent = config.customRender?.content;
  const customPlatformButton = config.customRender?.platformButton;

  // Build content
  const contentExcerpt = excerpt(activityItem.content, config.excerptMaxLength ?? 140);
  const contentNode = customContent
    ? customContent(contentExcerpt)
    : (
        <p
          className={config.contentClassName}
          style={contentStyle}
        >
          "{contentExcerpt}"
        </p>
      );

  // Build platform buttons with custom render if provided
  const platformButtons = customPlatformButton
    ? (
        <div className={config.platformContainerClassName}>
          {published.map(({ platform, url }) =>
            customPlatformButton!({
              cfg: getPlatformCfg(platform),
              url,
              platform,
            })
          )}
        </div>
      )
    : renderPlatformButtons(published, config, false, isDark, accent);

  // Build footer
  const footer = renderFooter(published, config, false, isDark);

  // Build header
  const header = (
    <div className={config.headerClassName}>
      <div className="flex items-center gap-2">
        {renderPulseIndicator(config)}
        <span
          className={config.titleClassName}
          style={titleStyle}
        >
          {config.title}
        </span>
      </div>
      {activityItem.publishedAt && (
        <span
          className={`${config.timestampClassName} font-mono`}
          style={timestampStyle}
        >
          {timeAgo(activityItem.publishedAt)}
        </span>
      )}
    </div>
  );

  // Build the variant component
  const variantElement = (
    <div
      id="recent-activity"
      ref={sectionRef}
      className={config.containerClassName}
      style={containerStyle}
    >
      {pulseStyle}
      {header}
      <div className={config.contentClassName} style={contentStyle}>
        {contentNode}
        {platformButtons}
        {footer}
      </div>
    </div>
  );

  // Apply custom container wrapper if provided (e.g., for energy variant's skew)
  if (customContainer) {
    return customContainer(variantElement);
  }

  return variantElement;
}