import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

/**
 * GET /api/cron/instagram-sync
 * Fallback comment polling path when Meta webhooks are delayed or dropped.
 * Triggered daily via Vercel Cron (compliant with Hobby plan restrictions),
 * or sub-daily via external cron (cron-job.org / QStash) using CRON_SECRET.
 * Finds all workspaces with Instagram automation enabled and calls the sync
 * route for each.
 */
export async function GET(request: NextRequest) {
  // Vercel Cron sets the Authorization header with CRON_SECRET when configured.
  // If not set, allow through (Vercel only calls this from its own infrastructure).
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all workspaces that have Instagram automation enabled
    const { data: configs, error } = await supabase
      .from('instagram_automation_config')
      .select('workspace_id')
      .eq('enabled', true);

    if (error) {
      logger.error('instagram-sync cron: failed to fetch enabled workspaces', { error });
      return NextResponse.json({ ok: false, error: 'DB error' }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      logger.info('instagram-sync cron: no workspaces with automation enabled');
      return NextResponse.json({ ok: true, synced: 0 });
    }

    const appUrl = config.NEXT_PUBLIC_APP_URL || 'https://unool.com';
    const results: Array<{ workspaceId: string; ok: boolean; message?: string }> = [];

    for (const row of configs) {
      const workspaceId = row.workspace_id as string;
      try {
        const res = await fetch(`${appUrl}/api/instagram/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId }),
        });
        const data = await res.json().catch(() => ({}));
        results.push({ workspaceId, ok: !!data.ok, message: data.message });
        logger.info('instagram-sync cron: synced workspace', {
          workspaceId,
          repliesPosted: data.repliesPosted,
          newComments: data.newCommentsProcessed,
        });
      } catch (err) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        logger.error('instagram-sync cron: sync failed for workspace', { workspaceId, error: errObj });
        results.push({ workspaceId, ok: false, message: errObj.message });
      }
    }

    return NextResponse.json({ ok: true, synced: results.length, results });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('instagram-sync cron: unexpected error', { error: err });
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
