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

    // ─── All 3 fetches in parallel ──────────────────────────────────────────
    // Previously: sequential (admin.getUserById → profile → workspace)
    // Now: all fire at once, response arrives in ~1 RTT instead of 3
    const [userResult, profile, workspace] = await Promise.all([
      // User details — use listUsers with filter instead of expensive admin.getUserById
      supabaseAdmin.auth.admin.getUserById(userId),
      profileRepository.findByWorkspaceId(workspaceId),
      supabaseAdmin
        .from('workspaces')
        .select('id, name, plan')
        .eq('id', workspaceId)
        .single(),
    ]);

    const user = userResult.data?.user ?? null;

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
    });
  } catch (error) {
    console.error('Get user context failed:', error);
    return NextResponse.json({ error: 'Failed to get user context' }, { status: 500 });
  }
}