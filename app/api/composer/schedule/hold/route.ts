import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

/**
 * POST /api/composer/schedule/hold
 * Pauses all scheduled posts within the next N hours (default 3h).
 * Marks them with a hold flag in the DB — the QStash webhook checks this before publishing.
 *
 * Body: { holdHours?: number } — defaults to 3
 */
export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { workspaceId } = auth;

  const body = await request.json().catch(() => ({}));
  const holdHours = Math.min(Math.max(Number(body.holdHours ?? 3), 1), 24);

  const holdUntil = new Date(Date.now() + holdHours * 60 * 60 * 1000);
  const now = new Date();

  // Find posts scheduled within the hold window
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', holdUntil.toISOString());

  if (error) {
    logger.error('Hold queue: DB query failed', { workspaceId, error });
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Fetch existing settings to preserve other keys
  const { data: wsData } = await supabase
    .from('workspaces')
    .select('settings')
    .eq('id', workspaceId)
    .single();

  const currentSettings = (wsData?.settings as Record<string, unknown>) || {};

  const { error: wsError } = await supabase
    .from('workspaces')
    .update({
      settings: { ...currentSettings, queue_held_until: holdUntil.toISOString() },
    })
    .eq('id', workspaceId);

  if (wsError) {
    logger.error('Hold queue: workspace update failed', { workspaceId, error: wsError });
    return NextResponse.json({ error: 'Failed to hold queue' }, { status: 500 });
  }

  logger.info('Queue held', { workspaceId, holdUntil: holdUntil.toISOString(), affectedPosts: posts?.length ?? 0 });

  return NextResponse.json({
    success: true,
    heldUntil: holdUntil.toISOString(),
    holdHours,
    affectedPostCount: posts?.length ?? 0,
  });
}

/**
 * DELETE /api/composer/schedule/hold
 * Releases the queue hold.
 */
export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { workspaceId } = auth;

  const { data: wsData } = await supabase
    .from('workspaces')
    .select('settings')
    .eq('id', workspaceId)
    .single();

  const currentSettings = (wsData?.settings as Record<string, unknown>) || {};

  const { error } = await supabase
    .from('workspaces')
    .update({ settings: { ...currentSettings, queue_held_until: null } })
    .eq('id', workspaceId);

  if (error) {
    return NextResponse.json({ error: 'Failed to release hold' }, { status: 500 });
  }

  logger.info('Queue hold released', { workspaceId });
  return NextResponse.json({ success: true });
}
