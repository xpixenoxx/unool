import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Validates that a user has access to a given workspaceId.
 * Grants access if:
 * 1. workspaceId === userId (single-user personal workspace fallback)
 * 2. user has a record in workspace_members for workspaceId
 * 3. user is the owner_id of the workspace in the workspaces table
 */
export async function verifyWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  if (!userId || !workspaceId) return false;
  if (workspaceId === userId) return true;

  try {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (member) return true;

    const { data: ws } = await supabase
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
