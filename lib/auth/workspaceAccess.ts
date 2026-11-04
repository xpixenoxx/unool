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
      .single();

    if (member) return true;

    // Check 2: User owns the workspace
    const { data: ws } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', userId)
      .single();

    return Boolean(ws);
  } catch {
    return false;
  }
}