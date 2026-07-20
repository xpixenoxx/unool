import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const profileRepository = new SupabaseProfileRepository();
const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, workspaceId } = auth;

    // Get user details from auth
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Get profile for workspace
    const profile = await profileRepository.findByWorkspaceId(workspaceId);

    // Get workspace details
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id, name, plan')
      .eq('id', workspaceId)
      .single();

    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name,
        avatarUrl: user.user_metadata?.avatar_url,
      } : null,
      profile: profile ? {
        id: profile.id,
        name: profile.name,
        headline: profile.headline,
        subdomain: profile.subdomain,
        status: profile.subdomain ? 'published' : 'draft' as const,
        theme: profile.theme,
      } : null,
      workspace: workspace ? {
        id: workspace.id,
        name: workspace.name,
        planTier: workspace.plan,
      } : null,
    });
  } catch (error) {
    console.error('Get user context failed:', error);
    return NextResponse.json({ error: 'Failed to get user context' }, { status: 500 });
  }
}