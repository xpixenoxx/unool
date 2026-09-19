/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's public profile.
 * 401 if not authenticated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user record from public.users
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('id', auth.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id:          user.id,
        email:       user.email,
        name:        user.full_name,
        workspaceId: auth.workspaceId,
        createdAt:   user.created_at,
      },
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
