const DEFAULT_PRODUCTION_ORIGINS = [
  'https://unool.co',
  'https://www.unool.co',
  'https://app.unool.co',
];

function getAllowedOriginsSet(): Set<string> {
  const allowed = new Set<string>();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin.toLowerCase());
    } catch {
      // Ignore malformed APP_URL
    }
  }

  const rawList = process.env.ALLOWED_ORIGINS || '';
  for (const entry of rawList.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    try {
      allowed.add(new URL(trimmed).origin.toLowerCase());
    } catch {
      // Ignore malformed entry
    }
  }

  for (const origin of DEFAULT_PRODUCTION_ORIGINS) {
    allowed.add(origin);
  }

  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }

  return allowed;
}

export function isOriginAllowed(origin: string | null | undefined): string | null {
  if (!origin) return null;
  try {
    const parsed = new URL(origin);
    const normalized = parsed.origin.toLowerCase();
    const allowed = getAllowedOriginsSet();
    if (allowed.has(normalized)) {
      return parsed.origin;
    }
    if (parsed.protocol === 'https:' && parsed.hostname.toLowerCase().endsWith('.unool.co')) {
      return parsed.origin;
    }
    if (
      process.env.VERCEL_URL &&
      parsed.origin.toLowerCase() === `https://${process.env.VERCEL_URL.toLowerCase()}`
    ) {
      return parsed.origin;
    }
  } catch {
    return null;
  }
  return null;
}
