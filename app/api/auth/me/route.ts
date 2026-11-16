/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's public profile.
 * 401 if not authenticated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    // Try fetching from public.users first
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('id', auth.userId)
      .limit(1)
      .maybeSingle();

    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          id:          user.id,
          email:       user.email,
          name:        user.full_name,
          workspaceId: auth.workspaceId,
          createdAt:   user.created_at,
        },
      }, { status: 200, headers: NO_STORE_HEADERS });
    }

    // Fallback: read directly from Supabase Auth admin API if public.users is missing/delayed
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
    
    if (authError || !authUser.user) {
      return NextResponse.json({ success: false, message: 'User not found in Auth system.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({
      success: true,
      user: {
        id:          authUser.user.id,
        email:       authUser.user.email,
        name:        authUser.user.user_metadata?.full_name || 'User',
        workspaceId: auth.workspaceId,
        createdAt:   authUser.user.created_at,
      },
    }, { status: 200, headers: NO_STORE_HEADERS });

  } catch (err) {
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
