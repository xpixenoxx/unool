/**
 * Server-side Analytics Tracking
 * Use in API routes and server components
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import {
  AnalyticsEventInput,
  AnalyticsEventType,
  AnalyticsEventData,
  hashIp,
  getClientIp,
  isValidEventType,
} from './events';

// Re-export types for consumers
export type {
  AnalyticsEventInput,
  AnalyticsEventType,
  AnalyticsEventData,
};

export { isValidEventType, hashIp, getClientIp };

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Track an analytics event (server-side)
 * Fire-and-forget - doesn't block response
 */
export async function trackEvent(input: AnalyticsEventInput): Promise<void> {
  // Validate event type
  if (!isValidEventType(input.eventType)) {
    console.warn('[Analytics] Invalid event type:', input.eventType);
    return;
  }

  try {
    const { error } = await adminClient.from('analytics_events').insert({
      workspace_id: input.workspaceId,
      user_id: input.userId || null,
      profile_id: input.profileId || null,
      event_type: input.eventType,
      event_data: input.eventData || {},
      referrer: input.referrer || null,
      user_agent: input.userAgent || null,
      ip_hash: input.ipHash || null,
      session_id: input.sessionId || null,
    });

    if (error) {
      console.error('[Analytics] Insert failed:', error);
    }
  } catch (error) {
    console.error('[Analytics] Track error:', error);
  }
}

/**
 * Track multiple events in batch
 */
export async function trackEvents(inputs: AnalyticsEventInput[]): Promise<void> {
  if (inputs.length === 0) return;

  // Validate all event types
  const validInputs = inputs.filter(i => isValidEventType(i.eventType));
  if (validInputs.length !== inputs.length) {
    console.warn('[Analytics] Some events had invalid types, skipping');
  }

  try {
    const { error } = await adminClient.from('analytics_events').insert(
      validInputs.map(input => ({
        workspace_id: input.workspaceId,
        user_id: input.userId || null,
        profile_id: input.profileId || null,
        event_type: input.eventType,
        event_data: input.eventData || {},
        referrer: input.referrer || null,
        user_agent: input.userAgent || null,
        ip_hash: input.ipHash || null,
        session_id: input.sessionId || null,
      }))
    );

    if (error) {
      console.error('[Analytics] Batch insert failed:', error);
    }
  } catch (error) {
    console.error('[Analytics] Batch track error:', error);
  }
}

/**
 * Convenience helpers for common events
 */
export const analytics = {
  profileView: (input: {
    workspaceId: string;
    profileId: string;
    userId?: string;
    sessionId?: string;
    referrer?: string;
    userAgent?: string;
    ipHash?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) => trackEvent({
    eventType: 'profile_view',
    workspaceId: input.workspaceId,
    profileId: input.profileId,
    userId: input.userId,
    sessionId: input.sessionId,
    referrer: input.referrer,
    userAgent: input.userAgent,
    ipHash: input.ipHash,
    eventData: {
      utm_source: input.utmSource,
      utm_medium: input.utmMedium,
      utm_campaign: input.utmCampaign,
    },
  }),

  linkClick: (input: {
    workspaceId: string;
    profileId: string;
    linkType: string;      // 'social' | 'cta' | 'website' | 'email' | 'phone'
    linkUrl: string;
    linkText?: string;
    userId?: string;
    sessionId?: string;
    referrer?: string;
    userAgent?: string;
    ipHash?: string;
    ctaType?: string;
  }) => trackEvent({
    eventType: 'link_click',
    workspaceId: input.workspaceId,
    profileId: input.profileId,
    userId: input.userId,
    sessionId: input.sessionId,
    referrer: input.referrer,
    userAgent: input.userAgent,
    ipHash: input.ipHash,
    eventData: {
      link_type: input.linkType,
      link_url: input.linkUrl,
      link_text: input.linkText,
      cta_type: input.ctaType,
    },
  }),

  postPublish: (input: {
    workspaceId: string;
    postId: string;
    platform: string;      // 'linkedin' | 'x' | 'threads'
    postUrl?: string;
    userId?: string;
  }) => trackEvent({
    eventType: 'post_publish',
    workspaceId: input.workspaceId,
    userId: input.userId,
    eventData: {
      post_id: input.postId,
      platform: input.platform,
      post_url: input.postUrl,
    },
  }),

  postView: (input: {
    workspaceId: string;
    postId: string;
    platform: string;
    profileId?: string;
    userId?: string;
    sessionId?: string;
    referrer?: string;
  }) => trackEvent({
    eventType: 'post_view',
    workspaceId: input.workspaceId,
    profileId: input.profileId,
    userId: input.userId,
    sessionId: input.sessionId,
    referrer: input.referrer,
    eventData: {
      post_id: input.postId,
      platform: input.platform,
    },
  }),

  profileCtaClick: (input: {
    workspaceId: string;
    profileId: string;
    ctaType: string;       // 'connect' | 'message' | 'schedule' | 'website'
    linkUrl?: string;
    userId?: string;
    sessionId?: string;
  }) => trackEvent({
    eventType: 'profile_cta_click',
    workspaceId: input.workspaceId,
    profileId: input.profileId,
    userId: input.userId,
    sessionId: input.sessionId,
    eventData: {
      cta_type: input.ctaType,
      link_url: input.linkUrl,
    },
  }),

  subdomainClaim: (input: {
    workspaceId: string;
    profileId: string;
    subdomain: string;
    userId?: string;
  }) => trackEvent({
    eventType: 'subdomain_claim',
    workspaceId: input.workspaceId,
    profileId: input.profileId,
    userId: input.userId,
    eventData: {
      subdomain: input.subdomain,
    },
  }),
};

/**
 * Extract tracking info from request
 */
export function extractTrackingFromRequest(request: Request): {
  ipHash: Promise<string | null>;
  referrer: string | null;
  userAgent: string | null;
} {
  const ip = getClientIp(request);
  return {
    ipHash: ip ? hashIp(ip) : Promise.resolve(null),
    referrer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
  };
}