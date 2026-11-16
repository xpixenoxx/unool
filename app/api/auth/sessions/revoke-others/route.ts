import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { bumpUserSecurityVersion } from '@/lib/auth/security-version';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/sessions/revoke-others
 * Revokes all sessions other than the caller's current session and bumps
 * security_version so saved account-switch tokens on other devices stop working.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    if (auth.isImpersonated) {
      return NextResponse.json(
        {
          error: 'Session revocation is blocked during admin impersonation sessions.',
          code: 'IMPERSONATION_BLOCKED',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const rate = await checkRateLimit(request, 'accountAction', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
      );
    }

    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (bearer) {
      await supabaseAdmin.auth.admin.signOut(bearer, 'others').catch(() => {});
    }

    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut({ scope: 'others' });
    } catch {
      // Non-fatal in Bearer-only callers
    }

    const securityVersion = await bumpUserSecurityVersion(auth.userId);

    try {
      await supabaseAdmin.from('workspace_security_events').insert({
        workspace_id: auth.workspaceId,
        actor_user_id: auth.userId,
        event_type: 'other_sessions_revoked',
        metadata: { security_version: securityVersion },
      });
    } catch {
      // Ignore if migration hasn't been applied yet
    }

    logger.info('Revoked all other sessions', { userId: auth.userId });

    return NextResponse.json(
      {
        success: true,
        securityVersion,
        message: 'All other sessions have been signed out.',
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('POST /api/auth/sessions/revoke-others failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to revoke other sessions.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

