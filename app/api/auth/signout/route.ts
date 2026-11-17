import { NextRequest } from 'next/server';
import { performSignOut } from '@/lib/auth/session-cookies';

/**
 * POST /api/auth/signout
 * Clears active Supabase SSR session and Unool cookies.
 */
export async function POST(request: NextRequest) {
  let scope: 'local' | 'global' = 'local';
  try {
    const body = (await request.json().catch(() => null)) as { scope?: string } | null;
    if (body?.scope === 'global') {
      scope = 'global';
    }
  } catch {
    // Empty body defaults to local sign-out
  }
  return performSignOut(request, scope);
}
