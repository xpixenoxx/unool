import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId');
  const profileId = searchParams.get('profileId');
  const eventTypes = searchParams.get('events')?.split(',') || ['posts', 'profile', 'variants', 'engagement'];

  if (!workspaceId && !profileId) {
    return NextResponse.json({ error: 'workspaceId or profileId required' }, { status: 400 });
  }

  const traceId = request.headers.get('x-trace-id') || crypto.randomUUID();

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection event
      sendEvent('connected', { traceId, timestamp: new Date().toISOString() });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        sendEvent('heartbeat', { timestamp: new Date().toISOString() });
      }, 30_000);

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
                sendEvent('profile:updated', { ...payload, traceId });
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
                sendEvent('post:updated', { ...payload, traceId });
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
                sendEvent('variant:updated', { ...payload, traceId });
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
                sendEvent('engagement:updated', { ...payload, traceId });
              }
            )
            .subscribe();

          subscriptions.push(channel);
        }

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          subscriptions.forEach(s => s.unsubscribe());
          controller.close();
          logger.debug('SSE connection closed', { traceId });
        });

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('SSE stream error', { traceId, error: err });
        sendEvent('error', { message: err.message, traceId });
        clearInterval(heartbeat);
        subscriptions.forEach(s => s.unsubscribe());
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