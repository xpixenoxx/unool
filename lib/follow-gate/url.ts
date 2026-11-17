/**
 * Shared safe URL validator & sanitizer for legacy follow-gate external targets.
 * Blocks javascript:, data:, vbscript:, and non-HTTP(S) schemes to prevent stored XSS.
 */
export function isSafeHttpUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function sanitizeHttpHref(rawUrl: unknown): string | null {
  if (!isSafeHttpUrl(rawUrl)) return null;
  return new URL(rawUrl.trim()).toString();
}
