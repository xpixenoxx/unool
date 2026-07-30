export * from './adapter';
export { linkedInAdapter, LinkedInAdapter } from './LinkedInAdapter';
export { threadsAdapter, ThreadsAdapter } from './ThreadsAdapter';
export { xAdapter, XAdapter } from './XAdapter';
export { manualAdapter, ManualAdapter } from './ManualAdapter';
export { facebookAdapter, FacebookAdapter } from './FacebookAdapter';
export { whatsAppAdapter, WhatsAppAdapter } from './WhatsAppAdapter';

import { linkedInAdapter } from './LinkedInAdapter';
import { threadsAdapter } from './ThreadsAdapter';
import { xAdapter } from './XAdapter';
import { manualAdapter } from './ManualAdapter';
import { facebookAdapter } from './FacebookAdapter';
import { whatsAppAdapter } from './WhatsAppAdapter';
import type { PlatformAdapter } from './adapter';

export const platformAdapters: Record<string, PlatformAdapter> = {
  linkedin: linkedInAdapter,
  x: xAdapter,
  twitter: xAdapter,
  threads: threadsAdapter,
  manual: manualAdapter,
  facebook: facebookAdapter,
  whatsapp: whatsAppAdapter,
};

export function getPlatformAdapter(platform: string): PlatformAdapter | null {
  return platformAdapters[platform.toLowerCase()] ?? null;
}

export const SUPPORTED_PLATFORMS = ['linkedin', 'x', 'threads', 'manual', 'facebook', 'whatsapp'] as const;
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];