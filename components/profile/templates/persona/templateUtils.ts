/**
 * Shared utilities for persona templates.
 * Centralises helper functions used across multiple template files.
 */
import { getSocialSvgPath } from '@/components/profile/SocialBrandIcons';

/**
 * Returns the SVG path string for a social link icon.
 * Used by AestheteTemplate, BuilderTemplate, CreatorTemplate, HustlerTemplate.
 */
export const getAestheteSocialIcon = (label?: string, url?: string, icon?: string) => {
  return getSocialSvgPath(label, url, icon);
};

