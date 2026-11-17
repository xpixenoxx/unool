export const SYSTEM_RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'dashboard', 'settings', 'profile', 'u', 's',
  'auth', 'signup', 'login', 'signin', 'logout', 'signout', 'pricing', 'features',
  'about', 'contact', 'help', 'docs', 'blog', 'status', 'support', 'legal',
  'privacy', 'terms', 'security', 'enterprise', 'pro', 'free', 'trial', 'demo',
  'test', 'staging', 'dev', 'local', 'cdn', 'static', 'assets', 'media',
  'images', 'mail', 'email', 'smtp', 'ftp', 'ssh', 'vpn', 'billing', 'pay',
  'checkout', 'unool', 'pixenox', 'overview', 'analytics', 'presence', 'composer',
  'studio', 'flightplan', 'signal', 'channels', 'automation', 'publish',
  'roadmap', 'careers', 'jobs', 'robots', 'sitemap', 'favicon',
] as const;

export const TRADEMARK_RESERVED_SUBDOMAINS = [
  // Meta / Social Media
  'meta', 'facebook', 'instagram', 'whatsapp', 'threads', 'messenger',
  // Google
  'google', 'gmail', 'youtube', 'android', 'googlepay', 'gpay',
  // Apple
  'apple', 'iphone', 'icloud', 'appstore', 'itunes',
  // Microsoft
  'microsoft', 'windows', 'xbox', 'outlook', 'bing', 'azure', 'linkedin',
  // Amazon / AWS
  'amazon', 'aws', 'alexa', 'kindle', 'prime',
  // Twitter / X
  'twitter', 'x', 'xcom',
  // Other major tech
  'netflix', 'spotify', 'airbnb', 'uber', 'ola', 'zomato', 'swiggy',
  'paytm', 'phonepe', 'razorpay', 'cashfree', 'stripe', 'paypal',
  'shopify', 'notion', 'slack', 'discord', 'telegram', 'snapchat',
  'tiktok', 'bytedance', 'pinterest', 'reddit', 'quora', 'medium',
  'github', 'gitlab', 'openai', 'chatgpt', 'anthropic', 'gemini',
  // Indian brands
  'reliance', 'tata', 'jio', 'hdfc', 'icici', 'sbi', 'axis', 'kotak',
  'flipkart', 'myntra', 'nykaa', 'meesho', 'zepto', 'blinkit',
  'byju', 'unacademy', 'vedantu',
  // Creator economy platforms
  'linktree', 'beacons', 'later', 'buffer', 'hootsuite', 'manychat',
  'zorcha', 'taplio', 'stan',
] as const;

export const RESERVED_SUBDOMAINS = new Set<string>([
  ...SYSTEM_RESERVED_SUBDOMAINS,
  ...TRADEMARK_RESERVED_SUBDOMAINS,
]);

export interface SubdomainValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
  code?: 'LENGTH' | 'FORMAT' | 'RESERVED';
}

export function normalizeSubdomain(raw: string): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function validateSubdomain(raw: string): SubdomainValidationResult {
  const normalized = normalizeSubdomain(raw);

  if (normalized.length < 2 || normalized.length > 32) {
    return {
      valid: false,
      normalized,
      error: 'Subdomain must be between 2 and 32 characters',
      code: 'LENGTH',
    };
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
      code: 'FORMAT',
    };
  }

  if (normalized.startsWith('-') || normalized.endsWith('-') || normalized.includes('--')) {
    return {
      valid: false,
      normalized,
      error: 'Subdomain cannot start or end with a hyphen or contain consecutive hyphens',
      code: 'FORMAT',
    };
  }

  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'This name is reserved and cannot be claimed',
      code: 'RESERVED',
    };
  }

  return { valid: true, normalized };
}

export function isTempSubdomain(subdomain: string | null | undefined): boolean {
  if (!subdomain) return true;
  return subdomain.startsWith('user-');
}

