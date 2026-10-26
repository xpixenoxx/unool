import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const profileRepository = new SupabaseProfileRepository();
const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, workspaceId } = auth;

    // ─── Parallel fetches for user context + pending posts count ───────────
    const [userResult, profile, workspace, pendingPostsResult] = await Promise.all([
      // User details
      supabaseAdmin.auth.admin.getUserById(userId),
      profileRepository.findByWorkspaceId(workspaceId),
      supabaseAdmin
        .from('workspaces')
        .select('id, name, plan')
        .eq('id', workspaceId)
        .single(),
      (async () => {
        try {
          const { count, error } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .in('status', ['draft', 'scheduled', 'publishing']);
          return (!error && typeof count === 'number') ? count : 0;
        } catch {
          return 0;
        }
      })(),
    ]);

    const user = userResult.data?.user ?? null;
    const pendingPostsCount = typeof pendingPostsResult === 'number' ? pendingPostsResult : 0;

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name,
            avatarUrl: user.user_metadata?.avatar_url,
          }
        : null,
      profile: profile
        ? {
            id: profile.id,
            name: profile.name,
            headline: profile.headline,
            subdomain: profile.subdomain,
            status: (profile.subdomain ? 'published' : 'draft') as 'published' | 'draft',
            theme: profile.theme,
          }
        : null,
      workspace: workspace.data
        ? {
            id: workspace.data.id,
            name: workspace.data.name,
            planTier: workspace.data.plan,
          }
        : null,
      pendingPostsCount,
    });
  } catch (error) {
    console.error('Get user context failed:', error);
    return NextResponse.json({ error: 'Failed to get user context' }, { status: 500 });
  }
}