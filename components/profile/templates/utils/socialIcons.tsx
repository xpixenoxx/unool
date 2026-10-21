'use client';

import * as React from 'react';
import {
  BRAND_SVGS,
  normalizeSocialPlatform,
  getSocialSvgPath,
  SocialIcon,
  renderSocialOrIcon
} from '@/components/profile/SocialBrandIcons';

/**
 * Shared Social Icons Utility
 *
 * Consolidates duplicate social icon logic from all template files.
 * Provides a unified API for rendering social platform icons across all 15 personas.
 *
 * @module components/profile/templates/utils/socialIcons
 */

/**
 * Get the SVG path element for a social platform.
 * Use this when rendering inside an existing <svg viewBox="0 0 24 24"> element.
 *
 * @param label - Link label (e.g., "GitHub", "LinkedIn")
 * @param url - Link URL (used for domain detection)
 * @param explicitIcon - Explicit icon key (e.g., "github", "x")
 * @returns React.ReactNode - SVG path element(s)
 *
 * @example
 * <svg viewBox="0 0 24 24" className="w-5 h-5">
 *   {getSocialSvgPath(link.label, link.url, link.icon)}
 * </svg>
 */
export const getSocialSvgPathShared = getSocialSvgPath;

/**
 * Complete standalone SVG Icon component.
 * Renders a full <svg> with viewBox, fill, and accessibility attributes.
 *
 * @param label - Link label (e.g., "GitHub", "LinkedIn")
 * @param url - Link URL (used for domain detection)
 * @param icon - Explicit icon key (e.g., "github", "x")
 * @param className - CSS classes (default: 'w-5 h-5')
 * @param style - Inline styles
 * @returns React.ReactElement - Complete SVG icon
 *
 * @example
 * <SocialIconShared label={link.label} url={link.url} icon={link.icon} className="w-6 h-6" />
 */
export const SocialIconShared = SocialIcon;

/**
 * Smart helper: renders emoji if icon is an emoji, otherwise renders authentic brand SVG.
 *
 * @param link - Link object with label, url, and optional icon
 * @param fallbackClassName - CSS classes for the SVG (default: 'w-5 h-5 fill-current')
 * @returns React.ReactNode - Emoji span or SocialIcon component
 *
 * @example
 * {renderSocialOrIconShared(link, 'w-5 h-5')}
 */
export const renderSocialOrIconShared = renderSocialOrIcon;

/**
 * Get the platform key for a link (useful for conditional logic).
 *
 * @param label - Link label
 * @param url - Link URL
 * @param explicitIcon - Explicit icon key
 * @returns string - Normalized platform key (e.g., 'github', 'linkedin', 'generic')
 */
export const getPlatformKey = normalizeSocialPlatform;

/**
 * Check if a link's icon is an emoji character.
 *
 * @param icon - Icon string to check
 * @returns boolean - True if icon is an emoji
 */
export function isEmojiIcon(icon?: string | null): boolean {
  if (!icon) return false;
  return /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(icon);
}

/**
 * Get the brand SVG path directly by platform key.
 * Useful when you already know the platform.
 *
 * @param platformKey - Normalized platform key (e.g., 'github', 'x', 'linkedin')
 * @returns React.ReactNode - SVG path element(s) or generic fallback
 */
export function getBrandSvgPath(platformKey: string): React.ReactNode {
  return BRAND_SVGS[platformKey] || BRAND_SVGS.generic;
}

/**
 * Get a simple icon component for links that works with lucide-react style icons.
 * This provides a unified interface for templates that want simple icon components.
 *
 * @param label - Link label
 * @param url - Link URL
 * @param icon - Explicit icon key
 * @param className - CSS classes (default: 'w-5 h-5')
 * @returns React.ReactElement - SocialIcon component
 *
 * @example
 * <div className="flex items-center gap-2">
 *   {getLinkIcon(link.label, link.url, link.icon, 'w-4 h-4')}
 *   <span>{link.label}</span>
 * </div>
 */
export function getLinkIcon(
  label?: string,
  url?: string,
  icon?: string,
  className: string = 'w-5 h-5'
): React.ReactElement {
  return (
    <SocialIcon
      label={label}
      url={url}
      icon={icon}
      className={className}
    />
  );
}

/**
 * Get a platform icon component for templates that need a wrapped icon.
 * Renders the SocialIcon inside a container div with consistent sizing.
 *
 * @param label - Link label
 * @param url - Link URL
 * @param icon - Explicit icon key
 * @param size - Icon size in pixels (default: 20)
 * @param containerClassName - Container CSS classes
 * @returns React.ReactElement - Wrapped icon component
 *
 * @example
 * <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
 *   {getPlatformIcon(link.label, link.url, link.icon, 18)}
 * </div>
 */
export function getPlatformIcon(
  label?: string,
  url?: string,
  icon?: string,
  size: number = 20,
  containerClassName: string = ''
): React.ReactElement {
  return (
    <div className={`flex items-center justify-center ${containerClassName}`}>
      <SocialIcon
        label={label}
        url={url}
        icon={icon}
        className={`w-[${size}px] h-[${size}px] block fill-current`}
      />
    </div>
  );
}

/**
 * Specialized function for Aesthete template style icons.
 * Renders the SVG path inside an existing SVG element.
 *
 * @param label - Link label
 * @param url - Link URL
 * @param icon - Explicit icon key
 * @returns React.ReactNode - SVG path for embedding
 *
 * @example
 * <svg className="w-4 h-4" viewBox="0 0 24 24">
 *   {getAestheteSocialIcon(link.label, link.url, link.icon)}
 * </svg>
 */
export function getAestheteSocialIcon(
  label?: string,
  url?: string,
  icon?: string
): React.ReactNode {
  return getSocialSvgPath(label, url, icon);
}

/**
 * Get all available platform keys.
 * Useful for debugging or building platform selectors.
 *
 * @returns string[] - Array of all platform keys
 */
export function getAllPlatformKeys(): string[] {
  return Object.keys(BRAND_SVGS);
}

/**
 * Check if a platform key is supported (has a custom brand SVG).
 *
 * @param platformKey - Platform key to check
 * @returns boolean - True if platform has custom SVG (not generic)
 */
export function isKnownPlatform(platformKey: string): boolean {
  return platformKey !== 'generic' && platformKey in BRAND_SVGS;
}

// Re-export types and constants for convenience
export { BRAND_SVGS } from '@/components/profile/SocialBrandIcons';
export type { } from '@/components/profile/SocialBrandIcons';