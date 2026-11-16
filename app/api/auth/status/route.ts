import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/status
 * Verifies authentication strictly via getCurrentAuth (HMAC middleware headers,
 * Supabase JWT, or verified SSR cookies). Never trusts raw x-user-id or cookie substrings.
 */
export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json(
      { authenticated: false },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
