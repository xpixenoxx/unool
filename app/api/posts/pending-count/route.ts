import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { config } from '@/lib/config/schema';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ count: 0, drafts: 0, scheduled: 0, publishing: 0 });
    }

    const { workspaceId } = auth;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch unpublished drafts (past 24h), scheduled (past 24h), and publishing counts
    const [drafts, scheduled, publishing] = await Promise.all([
      (async () => {
        try {
          const { count, error } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('status', 'draft')
            .gte('created_at', since24h);
          return (!error && typeof count === 'number') ? count : 0;
        } catch {
          return 0;
        }
      })(),
      (async () => {
        try {
          const { count, error } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('status', 'scheduled')
            .gte('created_at', since24h);
          return (!error && typeof count === 'number') ? count : 0;
        } catch {
          return 0;
        }
      })(),
      (async () => {
        try {
          const { count, error } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('status', 'publishing')
            .gte('created_at', since24h);
          return (!error && typeof count === 'number') ? count : 0;
        } catch {
          return 0;
        }
      })(),
    ]);

    const totalPending = drafts + scheduled + publishing;

    return NextResponse.json({
      count: drafts,
      drafts,
      scheduled,
      publishing,
    });
  } catch {
    return NextResponse.json({ count: 0, drafts: 0, scheduled: 0, publishing: 0 });
  }
}

