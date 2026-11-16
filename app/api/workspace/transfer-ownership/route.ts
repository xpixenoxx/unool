import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import { getWorkspaceMembership, requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const transferSchema = z.object({
  targetUserId: z.string().uuid('Valid target member userId is required.'),
});

/**
 * POST /api/workspace/transfer-ownership
 * Transfers ownership of the active workspace to another active member.
 * Restricted strictly to the current workspace owner (never allowed under impersonation).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    if (auth.isImpersonated) {
      return NextResponse.json(
        { error: 'Workspace ownership transfer is blocked during admin impersonation.', code: 'IMPERSONATION_BLOCKED' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const rate = await checkRateLimit(request, 'accountAction', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
      );
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Only the workspace owner can transfer ownership.' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid transfer payload.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { targetUserId } = parsed.data;
    if (targetUserId === auth.userId) {
      return NextResponse.json(
        { error: 'You are already the owner of this workspace.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const targetMembership = await getWorkspaceMembership(targetUserId, auth.workspaceId);
    if (!targetMembership || targetMembership.status !== 'active') {
      return NextResponse.json(
        { error: 'Selected user must be an active member of this workspace before receiving ownership.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Prefer atomic transactional RPC when deployed
    let transferredViaRpc = false;
    try {
      const { error: rpcErr } = await supabaseAdmin.rpc('transfer_workspace_ownership', {
        p_workspace_id: auth.workspaceId,
        p_current_owner_id: auth.userId,
        p_new_owner_id: targetUserId,
      });

      if (!rpcErr) {
        transferredViaRpc = true;
      } else {
        const code = String((rpcErr as { code?: string }).code || '');
        if (code !== '42883' && code !== 'PGRST202') {
          throw new Error(rpcErr.message || 'Ownership transfer RPC failed');
        }
      }
    } catch (rpcException) {
      const code = String((rpcException as { code?: string })?.code || '');
      if (code && code !== '42883' && code !== 'PGRST202') {
        throw rpcException;
      }
    }

    if (!transferredViaRpc) {
      const { data: updatedWs, error: wsErr } = await supabaseAdmin
        .from('workspaces')
        .update({ owner_id: targetUserId, updated_at: new Date().toISOString() })
        .eq('id', auth.workspaceId)
        .eq('owner_id', auth.userId)
        .select('id')
        .maybeSingle();

      if (wsErr || !updatedWs?.id) {
        throw new Error(wsErr?.message || 'Workspace ownership update failed.');
      }

      await Promise.all([
        supabaseAdmin
          .from('workspace_members')
          .update({ role: 'owner', status: 'active' })
          .eq('workspace_id', auth.workspaceId)
          .eq('user_id', targetUserId),
        supabaseAdmin
          .from('workspace_members')
          .upsert(
            {
              workspace_id: auth.workspaceId,
              user_id: auth.userId,
              role: 'admin',
              status: 'active',
            },
            { onConflict: 'workspace_id,user_id' }
          ),
      ]);
    }

    try {
      await supabaseAdmin.from('workspace_security_events').insert({
        workspace_id: auth.workspaceId,
        actor_user_id: auth.userId,
        event_type: 'ownership_transferred',
        metadata: { previous_owner_id: auth.userId, new_owner_id: targetUserId },
      });
    } catch {
      // Ignore pre-migration
    }

    logger.info('Workspace ownership transferred', {
      workspaceId: auth.workspaceId,
      fromUserId: auth.userId,
      toUserId: targetUserId,
    });

    return NextResponse.json(
      {
        success: true,
        workspaceId: auth.workspaceId,
        newOwnerId: targetUserId,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('POST /api/workspace/transfer-ownership failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to transfer workspace ownership.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

