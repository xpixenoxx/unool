import { canonicalPlatformId } from '@/lib/analytics/platformCapabilities';

/**
 * Platforms whose adapters implement real remote post deletion via official APIs.
 * Excludes platforms that forbid or lack public post deletion (e.g., Instagram) and
 * webhook-only/no-op adapters.
 */
const REMOTE_DELETE_SUPPORTED_PLATFORMS = new Set<string>([
  'threads',
  'facebook',
  'x',
  'linkedin',
  'bluesky',
  'youtube',
  'pinterest',
  'reddit',
  'dribbble',
  'discord',
  'hashnode',
  'lemmy',
  'listmonk',
  'mastodon',
  'mewe',
  'slack',
  'telegram',
  'devto',
]);

/**
 * Returns true when Unool supports deleting a published post remotely on the given platform.
 */
export function supportsRemotePostDeletion(platform: string): boolean {
  return REMOTE_DELETE_SUPPORTED_PLATFORMS.has(canonicalPlatformId(platform));
}
