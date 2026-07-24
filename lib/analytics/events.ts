/**
 * Analytics Event Types & Validation
 * Matches the analytics_events table CHECK constraint
 */

export type AnalyticsEventType =
  | 'profile_view'
  | 'link_click'
  | 'post_publish'
  | 'post_view'
  | 'profile_cta_click'
  | 'subdomain_claim';

export const ANALYTICS_EVENT_TYPES: AnalyticsEventType[] = [
  'profile_view',
  'link_click',
  'post_publish',
  'post_view',
  'profile_cta_click',
  'subdomain_claim',
] as const;

export function isValidEventType(type: string): type is AnalyticsEventType {
  return ANALYTICS_EVENT_TYPES.includes(type as AnalyticsEventType);
}

export interface AnalyticsEventData {
  // Link click data
  link_type?: string;       // 'social', 'cta', 'website', 'email', 'phone'
  link_url?: string;        // destination URL
  link_text?: string;       // link text/label

  // Post data
  post_id?: string;         // post UUID
  platform?: string;        // 'linkedin' | 'x' | 'threads'
  post_url?: string;        // published post URL

  // Profile/CNA data
  profile_id?: string;      // profile UUID
  cta_type?: string;        // 'connect', 'message', 'schedule', 'website'

  // Subdomain
  subdomain?: string;       // claimed subdomain

  // Attribution
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;

  // Custom data
  [key: string]: unknown;
}

export interface AnalyticsEventInput {
  eventType: AnalyticsEventType;
  workspaceId: string;
  userId?: string;           // nullable for anonymous events
  profileId?: string;        // nullable
  eventData?: AnalyticsEventData;
  referrer?: string;
  userAgent?: string;
  ipHash?: string;           // hashed IP
  sessionId?: string;        // anonymous session ID
}

export interface AnalyticsEventRecord extends AnalyticsEventInput {
  id: string;
  createdAt: string;
}

// Privacy: Hash IP for geo without storing raw IP
export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.IP_HASH_SALT || 'unool-analytics-salt'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

// Client IP extraction from request
export function getClientIp(request: Request): string | null {
  // Check headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback - not available in edge runtime
  return null;
}