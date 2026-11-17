/**
 * Safe relative redirect / returnUrl helpers.
 * Prevents Open Redirect vulnerabilities across OAuth connect/callback and auth flows.
 */

export function sanitizeRelativeReturnUrl(
  rawUrl: string | null | undefined,
  fallback = '/dashboard/settings?tab=channels'
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallback;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 512) {
    return fallback;
  }

  // Reject backslashes, control characters, protocol-relative URLs, or explicit schemes
  if (
    trimmed.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(trimmed) ||
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//')
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, 'https://unool.local');
    if (parsed.origin !== 'https://unool.local') {
      return fallback;
    }
    if (!parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function buildSafeRedirectUrl(
  requestUrl: string | URL,
  returnUrl: string | null | undefined,
  params: Record<string, string> = {},
  fallback = '/dashboard/settings?tab=channels'
): string {
  const safePath = sanitizeRelativeReturnUrl(returnUrl, fallback);
  const url = new URL(safePath, requestUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

