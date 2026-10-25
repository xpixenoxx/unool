import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackEvent, extractTrackingFromRequest, isValidEventType, AnalyticsEventType } from '@/lib/analytics/track';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

import { createClient } from '@supabase/supabase-js';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

const ClientEventSchema = z.object({
  eventType: z.string().refine(isValidEventType, 'Invalid event type'),
  workspaceId: z.string().uuid().optional(),
  profileId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  eventData: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
}).refine((data) => data.workspaceId || data.profileId, {
  message: 'Either workspaceId or profileId must be provided',
});

const BatchTrackSchema = z.object({
  events: z.array(ClientEventSchema).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = BatchTrackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { events } = parsed.data;

    const { ipHash, referrer, userAgent } = extractTrackingFromRequest(request);
    const resolvedIpHash = await ipHash;

    // Cache profileId -> workspaceId lookups within batch
    const profileWorkspaceMap: Record<string, string> = {};

    await Promise.all(
      events.map(async (event) => {
        let wsId = event.workspaceId;
        if (!wsId && event.profileId) {
          if (!profileWorkspaceMap[event.profileId]) {
            const { data: prof } = await admin
              .from('profiles')
              .select('workspace_id')
              .eq('id', event.profileId)
              .single();
            if (prof?.workspace_id) {
              profileWorkspaceMap[event.profileId] = prof.workspace_id;
            }
          }
          wsId = profileWorkspaceMap[event.profileId];
        }

        if (!wsId) {
          console.warn('[Analytics] Dropping event missing workspaceId:', event.eventType);
          return;
        }

        return trackEvent({
          eventType: event.eventType as AnalyticsEventType,
          workspaceId: wsId,
          profileId: event.profileId,
          userId: event.userId,
          eventData: event.eventData,
          referrer: (event.eventData?.referrer as string) || referrer || undefined,
          userAgent: userAgent || undefined,
          ipHash: resolvedIpHash || undefined,
          sessionId: event.sessionId,
        });
      })
    );

    return NextResponse.json({ success: true, tracked: events.length });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Analytics track API error', { error: err });
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'analytics' });
}