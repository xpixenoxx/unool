import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

const ALLOWED_EVENT_TYPES = ['posts', 'profile', 'variants', 'engagement'] as const;
type AllowedEventType = typeof ALLOWED_EVENT_TYPES[number];

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function validateAndFilterEventTypes(eventTypes: string[]): AllowedEventType[] {
  return eventTypes.filter((t): t is AllowedEventType => ALLOWED_EVENT_TYPES.includes(t as AllowedEventType));
}

/**
 * Verifies Supabase JWT token from Authorization header
 * Returns userId if valid, null if invalid
 */
async function verifyAuthToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      logger.warn('JWT verification failed', { error: error?.message });
      return null;
    }
    return data.user.id;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('JWT verification error', { error: err });
    return null;
  }
}

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId');
  const profileId = searchParams.get('profileId');
  const rawEventTypes = searchParams.get('events')?.split(',') || ['posts', 'profile', 'variants', 'engagement'];

  if (!workspaceId && !profileId) {
    return NextResponse.json({ error: 'workspaceId or profileId required' }, { status: 400 });
  }

  // Validate IDs are UUIDs to prevent filter injection
  if (workspaceId && !isValidUUID(workspaceId)) {
    return NextResponse.json({ error: 'Invalid workspaceId format' }, { status: 400 });
  }
  if (profileId && !isValidUUID(profileId)) {
    return NextResponse.json({ error: 'Invalid profileId format' }, { status: 400 });
  }

  const eventTypes = validateAndFilterEventTypes(rawEventTypes);
  if (eventTypes.length === 0) {
    return NextResponse.json({ error: 'No valid event types specified' }, { status: 400 });
  }

  // Verify JWT authentication
  const authHeader = request.headers.get('authorization');
  const userId = await verifyAuthToken(authHeader);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional: Verify user has access to the requested workspace/profile
  // This would require a DB query to check membership

  const traceId = request.headers.get('x-trace-id') || crypto.randomUUID();

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection event
      sendEvent('connected', { traceId, timestamp: new Date().toISOString(), userId });

      // Heartbeat with jitter (45-55s) to avoid proxy timeout boundary
      const getHeartbeatInterval = () => 45_000 + Math.random() * 10_000;
      let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleHeartbeat = () => {
        heartbeatTimer = setTimeout(() => {
          sendEvent('heartbeat', { timestamp: new Date().toISOString() });
          scheduleHeartbeat();
        }, getHeartbeatInterval());
      };
      scheduleHeartbeat();

      // Track subscriptions
      const subscriptions: ReturnType<typeof supabase.channel>[] = [];

      try {
        // Subscribe to profile changes
        if (eventTypes.includes('profile') && profileId) {
          const channel = supabase
            .channel(`profile:${profileId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${profileId}`,
              },
              (payload) => {
                logger.debug('Profile change received', { traceId, payload });
                sendEvent('profile:updated', { payload, traceId, timestamp: new Date().toISOString() });
              }
            )
            .subscribe();

          subscriptions.push(channel);
        }

        // Subscribe to post changes
        if (eventTypes.includes('posts') && workspaceId) {
          const channel = supabase
            .channel(`posts:${workspaceId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'posts',
                filter: `workspace_id=eq.${workspaceId}`,
              },
              (payload) => {
                sendEvent('post:updated', { payload, traceId, timestamp: new Date().toISOString() });
              }
            )
            .subscribe();

          subscriptions.push(channel);
        }

        // Subscribe to post variant changes
        if (eventTypes.includes('variants') && workspaceId) {
          const channel = supabase
            .channel(`variants:${workspaceId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'post_variants',
                filter: `post_id=in.(select id from posts where workspace_id=eq.${workspaceId})`,
              },
              (payload) => {
                sendEvent('variant:updated', { payload, traceId, timestamp: new Date().toISOString() });
              }
            )
            .subscribe();

          subscriptions.push(channel);
        }

        // Subscribe to platform post (engagement) changes
        if (eventTypes.includes('engagement') && workspaceId) {
          const channel = supabase
            .channel(`engagement:${workspaceId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'platform_posts',
                filter: `platform_connection_id=in.(select id from platform_connections where workspace_id=eq.${workspaceId})`,
              },
              (payload) => {
                sendEvent('engagement:updated', { payload, traceId, timestamp: new Date().toISOString() });
              }
            )
            .subscribe();

          subscriptions.push(channel);
        }

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          if (heartbeatTimer) clearTimeout(heartbeatTimer);
          subscriptions.forEach((s) => s.unsubscribe());
          controller.close();
          logger.debug('SSE connection closed', { traceId, userId });
        });

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('SSE stream error', { traceId, error: err });
        sendEvent('error', { message: err.message, traceId, timestamp: new Date().toISOString() });
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        subscriptions.forEach((s) => s.unsubscribe());
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}