export * from './adapter';
export { linkedInAdapter, LinkedInAdapter } from './LinkedInAdapter';
export { threadsAdapter, ThreadsAdapter } from './ThreadsAdapter';
export { xAdapter, XAdapter } from './XAdapter';
export { manualAdapter, ManualAdapter } from './ManualAdapter';

import { linkedInAdapter } from './LinkedInAdapter';
import { threadsAdapter } from './ThreadsAdapter';
import { xAdapter } from './XAdapter';
import { manualAdapter } from './ManualAdapter';
import type { PlatformAdapter } from './adapter';

export const platformAdapters: Record<string, PlatformAdapter> = {
  linkedin: linkedInAdapter,
  x: xAdapter,
  twitter: xAdapter,
  threads: threadsAdapter,
  manual: manualAdapter,
};

export function getPlatformAdapter(platform: string): PlatformAdapter | null {
  return platformAdapters[platform.toLowerCase()] ?? null;
}

export const SUPPORTED_PLATFORMS = ['linkedin', 'x', 'threads', 'manual'] as const;
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];