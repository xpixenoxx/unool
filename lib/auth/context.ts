import { cache } from 'react';
import { cookies, headers } from 'next/headers';
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
  email: string;
  userRole: string;
  isImpersonated: boolean;
}

/**
 * Resolves the active workspace for a user without using .single() (which fails
 * on multi-workspace accounts and previously triggered duplicate workspace creation).
 * Only provisions an initial 'spark' workspace when the user truly has 0 active
 * memberships AND 0 owned workspaces (or during legitimate first login).
 */
async function resolveOrProvisionWorkspace(
  userId: string,
  userEmail: string,
  userMetadata: Record<string, unknown> | undefined,
  preferredWorkspaceId?: string
): Promise<{ workspaceId: string; userRole: string }> {
  if (preferredWorkspaceId) {
    const { data: prefMember } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, role, status')
      .eq('workspace_id', preferredWorkspaceId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (prefMember?.workspace_id && (!prefMember.status || prefMember.status === 'active')) {
      return {
        workspaceId: prefMember.workspace_id,
        userRole: (prefMember.role as string) || 'editor',
      };
    }

    const { data: prefOwned } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('id', preferredWorkspaceId)
      .eq('owner_id', userId)
      .limit(1)
      .maybeSingle();

    if (prefOwned?.id) {
      return { workspaceId: prefOwned.id, userRole: 'owner' };
    }
  }

  // Deterministic first active membership
  const { data: membershipRows, error: membershipErr } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id, role, status, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(20);

  if (membershipErr) {
    logger.warn('Failed to query workspace_members in context resolution', {
      userId,
      error: membershipErr.message,
    });
  } else if (Array.isArray(membershipRows)) {
    const active = membershipRows.find((r) => !r.status || r.status === 'active');
    if (active?.workspace_id) {
      return {
        workspaceId: active.workspace_id,
        userRole: active.role || 'editor',
      };
    }
  }

  // Check workspaces directly owned by user before ever provisioning a new one
  const { data: ownedRows, error: ownedErr } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (!ownedErr && Array.isArray(ownedRows) && ownedRows.length > 0 && ownedRows[0]?.id) {
    const ownedId = ownedRows[0].id;
    // Heal missing owner membership row if needed
    await supabaseAdmin
      .from('workspace_members')
      .upsert(
        {
          workspace_id: ownedId,
          user_id: userId,
          role: 'owner',
          status: 'active',
        },
        { onConflict: 'workspace_id,user_id' }
      );
    return { workspaceId: ownedId, userRole: 'owner' };
  }

  // Only create initial workspace when BOTH queries succeeded cleanly with 0 rows
  if (membershipErr || ownedErr) {
    return { workspaceId: userId, userRole: 'owner' };
  }

  // Ensure public.users row exists cleanly first
  await supabaseAdmin
    .from('users')
    .upsert(
      {
        id: userId,
        email: userEmail || `${userId}@unool.co`,
        full_name:
          (typeof userMetadata?.full_name === 'string' && userMetadata.full_name) ||
          (typeof userMetadata?.name === 'string' && userMetadata.name) ||
          null,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

  const { data: newWorkspace, error: wsError } = await supabaseAdmin
    .from('workspaces')
    .insert({
      name: 'Personal Workspace',
      owner_id: userId,
      plan: 'spark',
      plan_status: 'active',
    })
    .select('id')
    .limit(1)
    .maybeSingle();

  if (wsError || !newWorkspace?.id) {
    logger.warn('Failed to provision initial workspace in context resolution', {
      userId,
      error: wsError?.message,
    });
    return { workspaceId: userId, userRole: 'owner' };
  }

  await supabaseAdmin.from('workspace_members').insert({
    workspace_id: newWorkspace.id,
    user_id: userId,
    role: 'owner',
    status: 'active',
  });

  return { workspaceId: newWorkspace.id, userRole: 'owner' };
}

export const getAuthContext = cache(async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const cookieStore = await cookies();
    const isImpersonated = Boolean(
      cookieStore.get('impersonating')?.value === 'true' ||
      cookieStore.get('impersonated_as')?.value
    );
    const preferredWorkspaceId = cookieStore.get('active_workspace_id')?.value?.trim();

    // Fast-path: ONLY accept middleware headers when signed with internal HMAC proof
    const headersList = await headers();
    const headerUserId = headersList.get('x-user-id');
    const headerWorkspaceId = headersList.get('x-workspace-id');
    const headerSig = headersList.get(INTERNAL_AUTH_SIGNATURE_HEADER);

    if (headerUserId && headerWorkspaceId && headerSig) {
      const valid = await verifyInternalAuthHeaders(headerUserId, headerWorkspaceId, headerSig);
      if (valid) {
        const finalWs =
          preferredWorkspaceId && (await verifyWorkspaceAccess(headerUserId, preferredWorkspaceId))
            ? preferredWorkspaceId
            : headerWorkspaceId;
        return {
          userId: headerUserId,
          workspaceId: finalWs,
          email: '',
          userRole: 'authenticated',
          isImpersonated,
        };
      }
    }

    // Check Bearer token if provided
    const authHeader = headersList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const anonClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        const {
          data: { user },
          error,
        } = await anonClient.auth.getUser(token);
        if (!error && user && user.user_metadata?.is_deleted !== true) {
          const { workspaceId, userRole } = await resolveOrProvisionWorkspace(
            user.id,
            user.email || '',
            user.user_metadata,
            preferredWorkspaceId
          );
          return {
            userId: user.id,
            workspaceId,
            email: user.email || '',
            userRole,
            isImpersonated,
          };
        }
        return null;
      }
    }

    // Fall back to Supabase SSR session cookies
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || user.user_metadata?.is_deleted === true) {
      return null;
    }

    const { workspaceId, userRole } = await resolveOrProvisionWorkspace(
      user.id,
      user.email || '',
      user.user_metadata,
      preferredWorkspaceId
    );

    return {
      userId: user.id,
      workspaceId,
      email: user.email || '',
      userRole,
      isImpersonated,
    };
  } catch (err) {
    logger.warn('getAuthContext returned null cleanly', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
});

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Error('Unauthorized: Authentication required');
  }
  return ctx;
}
