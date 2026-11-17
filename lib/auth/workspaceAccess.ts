import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Validates that a user has access to a given workspaceId.
 * Grants access if:
 * 1. user has a record in workspace_members for workspaceId
 * 2. user is the owner_id of the workspace in the workspaces table
 */
export async function verifyWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  if (!userId || !workspaceId) return false;

  try {
    // Check 1: User is a member of the workspace
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (member) return true;

    // Check 2: User owns the workspace
    const { data: ws } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', userId)
      .limit(1)
      .maybeSingle();

    return Boolean(ws);
  } catch {
    return false;
  }
}

/**
 * Deterministic workspace resolver safe for multi-workspace users.
 * Honors preferredWorkspaceId (e.g. unool_active_ws cookie) when authorized,
 * otherwise falls back to oldest membership, then oldest owned workspace.
 */
export async function resolvePrimaryWorkspaceId(
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<string | null> {
  if (!userId) return null;

  try {
    if (preferredWorkspaceId) {
      const hasAccess = await verifyWorkspaceAccess(userId, preferredWorkspaceId);
      if (hasAccess) {
        return preferredWorkspaceId;
      }
    }

    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (member?.workspace_id) {
      return member.workspace_id;
    }

    const { data: ownedWs } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    return ownedWs?.id ?? null;
  } catch {
    return null;
  }
}