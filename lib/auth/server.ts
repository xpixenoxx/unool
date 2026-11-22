import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import {
  verifyInternalAuthHeaders,
  INTERNAL_AUTH_SIGNATURE_HEADER,
} from '@/lib/auth/internal-header';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

export interface AuthContext {
  userId: string;
  workspaceId: string;
  email?: string;
  isImpersonated: boolean;
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function resolveWorkspaceForUser(
  userId: string,
  preferredWorkspaceId: string | null | undefined,
  metadataWorkspaceId?: string | null
): Promise<string> {
  const candidates = [preferredWorkspaceId, metadataWorkspaceId]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim());

  for (const candidate of candidates) {
    const allowed = await verifyWorkspaceAccess(userId, candidate);
    if (allowed) {
      return candidate;
    }
  }

  // Deterministic oldest active membership -> oldest owned workspace -> userId fallback
  try {
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, status')
      .eq('user_id', userId)
      .or('status.eq.active,status.is.null')
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (member?.workspace_id) {
      return member.workspace_id;
    }
  } catch (err) {
    logger.warn('Failed to resolve workspace from workspace_members', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const { data: owned } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (owned?.id) {
      return owned.id;
    }
  } catch {
    // Non-fatal fallback
  }

  return userId;
}

/**
 * Resolves the authenticated user and active workspace from:
 * 1. HMAC-verified internal headers injected by middleware.ts (never unsigned client headers)
 * 2. Authorization: Bearer <jwt>
 * 3. Supabase SSR auth cookies
 *
 * Returns null gracefully when unauthenticated or when verification fails (never throws 500).
 */
export async function getCurrentAuth(request?: NextRequest): Promise<AuthContext | null> {
  try {
    const isImpersonated = Boolean(
      request?.cookies.get('impersonating')?.value === 'true' ||
      request?.cookies.get('impersonated_as')?.value
    );
    const preferredWorkspaceId = request?.cookies.get('active_workspace_id')?.value;

    // 1. Check HMAC-signed middleware headers (rejects spoofed x-user-id/x-workspace-id)
    if (request) {
      const headerUserId = request.headers.get('x-user-id');
      const headerWorkspaceId = request.headers.get('x-workspace-id');
      const sig = request.headers.get(INTERNAL_AUTH_SIGNATURE_HEADER);

      if (headerUserId && headerWorkspaceId && sig) {
        const validSig = await verifyInternalAuthHeaders(headerUserId, headerWorkspaceId, sig);
        if (validSig) {
          return {
            userId: headerUserId,
            workspaceId: headerWorkspaceId,
            isImpersonated,
          };
        }
      }
    }

    // 2. Check Authorization: Bearer <token>
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        if (token) {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser(token);
          if (!error && user && user.user_metadata?.is_deleted !== true) {
            const workspaceId = await resolveWorkspaceForUser(
              user.id,
              preferredWorkspaceId,
              user.user_metadata?.workspace_id
            );
            return {
              userId: user.id,
              workspaceId,
              email: user.email ?? undefined,
              isImpersonated,
            };
          }
          return null;
        }
      }
    }

    // 3. Check SSR session cookies. Prefer reading cookies directly off the request
    // (works for public /api/auth/* routes on Workers where next/headers cookies() may be unavailable).
    let serverClient: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    if (request) {
      const { createServerClient } = await import('@supabase/ssr');
      serverClient = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() { },
        },
      }) as unknown as typeof serverClient;
    } else {
      serverClient = await createSupabaseServerClient();
    }
    let { data: { user: cookieUser }, error: cookieErr } = await serverClient.auth.getUser();
    if ((cookieErr || !cookieUser) && request) {
      // Fallback to next/headers cookies
      const fallbackClient = await createSupabaseServerClient();
      const fb = await fallbackClient.auth.getUser();
      cookieUser = fb.data.user;
      cookieErr = fb.error;
    }

    if (cookieErr || !cookieUser || cookieUser.user_metadata?.is_deleted === true) {
      return null;
    }

    const workspaceId = await resolveWorkspaceForUser(
      cookieUser.id,
      preferredWorkspaceId,
      cookieUser.user_metadata?.workspace_id
    );

    return {
      userId: cookieUser.id,
      workspaceId,
      email: cookieUser.email ?? undefined,
      isImpersonated,
    };
  } catch (err) {
    logger.warn('Auth resolution returned null safely', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function requireAuth(request?: NextRequest): Promise<AuthContext> {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    throw new Error('Unauthorized: Authentication required');
  }
  return auth;
}

export function getAuthHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    workspaceId: request.headers.get('x-workspace-id'),
    planTier: request.headers.get('x-plan-tier'),
  };
}
