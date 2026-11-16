import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { bumpUserSecurityVersion } from '@/lib/auth/security-version';
import { logger } from '@/lib/logger';

export const STATIC_AUTH_COOKIES_TO_CLEAR = [
  'sb-access-token',
  'sb-refresh-token',
  'dev-auth-bypass',
  'admin_session',
  'active_workspace_id',
  'impersonating',
  'impersonated_as',
] as const;

export const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

/**
 * Clears all Supabase SSR cookies (`sb-*`) and Unool auth/workspace/impersonation cookies
 * on the response and attaches `Cache-Control: no-store`.
 */
export function clearSessionCookies(request: NextRequest, response: NextResponse): NextResponse {
  const cookieNames = new Set<string>(STATIC_AUTH_COOKIES_TO_CLEAR);
  for (const cookie of request.cookies.getAll()) {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.includes('auth-token') ||
      cookie.name.includes('supabase')
    ) {
      cookieNames.add(cookie.name);
    }
  }

  for (const name of cookieNames) {
    response.cookies.delete(name);
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }

  for (const [header, value] of Object.entries(NO_STORE_HEADERS)) {
    response.headers.set(header, value);
  }

  return response;
}

/**
 * Unified sign-out helper shared by `/api/auth/logout` and `/api/auth/signout`.
 * Supports `local` (default) or `global` (all sessions + security_version bump).
 */
export async function performSignOut(
  request: NextRequest,
  scope: 'local' | 'global' = 'local'
): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(bearerToken || undefined);

    if (bearerToken) {
      try {
        await supabaseAdmin.auth.admin.signOut(bearerToken, scope);
      } catch (err) {
        logger.warn('Bearer admin.signOut failed (continuing cookie clear)', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    try {
      await supabase.auth.signOut({ scope });
    } catch (err) {
      logger.warn('Supabase SSR signOut failed (continuing cookie clear)', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (scope === 'global' && user?.id) {
      await bumpUserSecurityVersion(user.id);
    }
  } catch (err) {
    logger.warn('Session sign-out encountered an error while invalidating tokens', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const response = NextResponse.json(
    { success: true, scope },
    { status: 200, headers: NO_STORE_HEADERS }
  );
  return clearSessionCookies(request, response);
}

