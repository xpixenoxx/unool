/**
 * POST /api/auth/logout
 *
 * Signs the user out, invalidating the Supabase session.
 * Clears all auth cookies (server-side sign out via SSR client).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll()      { return cookieStore.getAll(); },
        setAll(toSet) { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    });

    await supabase.auth.signOut();

    logger.info('User signed out');
    return NextResponse.json({ success: true, message: 'Signed out successfully.' }, { status: 200 });

  } catch (err) {
    logger.error('Logout error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
