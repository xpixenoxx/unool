import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackEvent, extractTrackingFromRequest, isValidEventType, AnalyticsEventType } from '@/lib/analytics/track';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const ClientEventSchema = z.object({
  eventType: z.string().refine(isValidEventType, 'Invalid event type'),
  workspaceId: z.string().uuid(),
  profileId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  eventData: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
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

    await Promise.all(
      events.map(event =>
        trackEvent({
          eventType: event.eventType as AnalyticsEventType,
          workspaceId: event.workspaceId,
          profileId: event.profileId,
          userId: event.userId,
          eventData: event.eventData,
          referrer: (event.eventData?.referrer as string) || referrer || undefined,
          userAgent: userAgent || undefined,
          ipHash: resolvedIpHash || undefined,
          sessionId: event.sessionId,
        })
      )
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