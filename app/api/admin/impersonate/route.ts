import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { config } from '@/lib/config/schema';

// POST /api/admin/impersonate - Generate impersonation magic link
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'impersonate');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { userId, redirectTo } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Get the target user
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId);
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate magic link for impersonation
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: redirectTo || `${config.NEXT_PUBLIC_APP_URL}/auth/callback?impersonate=true`,
      },
    });

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Failed to generate impersonation link' }, { status: 500 });
    }

    const properties = linkData.properties as Record<string, unknown> | undefined;
    const accessToken = properties?.access_token as string | undefined;
    const actionLink = properties?.action_link as string | undefined;

    if (!accessToken && !actionLink) {
      return NextResponse.json({ error: 'Failed to generate impersonation link' }, { status: 500 });
    }

    // Log audit
    await adminRepository.logAdminAction(
      auth.admin.userId,
      'impersonate',
      'user',
      userId,
      { targetEmail: user.email, redirectTo }
    );

    return NextResponse.json({
      accessToken: accessToken,
      actionLink: actionLink,
      redirectTo: redirectTo || `${config.NEXT_PUBLIC_APP_URL}/auth/callback?impersonate=true`,
    });
  } catch (error) {
    console.error('Failed to generate impersonation link:', error);
    return NextResponse.json({ error: 'Failed to generate impersonation link' }, { status: 500 });
  }
}