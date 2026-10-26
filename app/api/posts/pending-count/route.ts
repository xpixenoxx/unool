import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ count: 0, drafts: 0, scheduled: 0, publishing: 0 });
    }

    const { workspaceId } = auth;

    // Fetch draft, scheduled, and publishing counts in parallel with safe error boundaries
    const [drafts, scheduled, publishing] = await Promise.all([
      (async () => {
        try {
          const { count, error } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('status', 'draft');
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
            .eq('status', 'scheduled');
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
            .eq('status', 'publishing');
          return (!error && typeof count === 'number') ? count : 0;
        } catch {
          return 0;
        }
      })(),
    ]);

    const totalPending = drafts + scheduled + publishing;

    return NextResponse.json({
      count: totalPending,
      drafts,
      scheduled,
      publishing,
    });
  } catch {
    return NextResponse.json({ count: 0, drafts: 0, scheduled: 0, publishing: 0 });
  }
}

