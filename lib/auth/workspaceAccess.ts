import { supabaseAdmin } from '@/lib/supabase/admin';

export const WORKSPACE_ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export interface WorkspaceMembership {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: string;
  isOwner: boolean;
}

export function normalizeWorkspaceRole(rawRole: unknown): WorkspaceRole {
  if (typeof rawRole !== 'string') return 'viewer';
  const r = rawRole.trim().toLowerCase();
  if (r === 'owner') return 'owner';
  if (r === 'admin') return 'admin';
  if (r === 'editor' || r === 'member') return 'editor';
  return 'viewer';
}

/**
 * Resolves the user's active membership and role inside a workspace.
 * Returns null when the user is not an active member or owner.
 * Never uses .single() so multi-row or zero-row states never throw PGRST116.
 */
export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<WorkspaceMembership | null> {
  if (!userId || !workspaceId || typeof userId !== 'string' || typeof workspaceId !== 'string') {
    return null;
  }

  const trimmedUserId = userId.trim();
  const trimmedWorkspaceId = workspaceId.trim();
  if (!trimmedUserId || !trimmedWorkspaceId) {
    return null;
  }

  // 1. Check active membership in workspace_members
  const { data: member } = await supabaseAdmin
    .from('workspace_members')
    .select('role, status')
    .eq('workspace_id', trimmedWorkspaceId)
    .eq('user_id', trimmedUserId)
    .limit(1)
    .maybeSingle();

  if (member) {
    const status = typeof (member as { status?: unknown }).status === 'string'
      ? (member as { status: string }).status
      : 'active';
    if (status && status !== 'active') {
      return null;
    }
    const role = normalizeWorkspaceRole((member as { role?: unknown }).role);
    return {
      workspaceId: trimmedWorkspaceId,
      userId: trimmedUserId,
      role,
      status: status || 'active',
      isOwner: role === 'owner',
    };
  }

  // 2. Fallback: verify direct workspace ownership on workspaces.owner_id
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('id', trimmedWorkspaceId)
    .eq('owner_id', trimmedUserId)
    .limit(1)
    .maybeSingle();

  if (workspace?.id) {
    return {
      workspaceId: trimmedWorkspaceId,
      userId: trimmedUserId,
      role: 'owner',
      status: 'active',
      isOwner: true,
    };
  }

  return null;
}

/**
 * Verifies whether a user has active access to a workspace.
 */
export async function verifyWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await getWorkspaceMembership(userId, workspaceId);
  return membership !== null;
}

/**
 * Enforces that a user holds one of the allowed active roles inside a workspace.
 */
export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowedRoles: readonly WorkspaceRole[]
): Promise<
  | { allowed: true; membership: WorkspaceMembership }
  | { allowed: false; reason: 'forbidden' | 'insufficient_role'; role: WorkspaceRole | null }
> {
  const membership = await getWorkspaceMembership(userId, workspaceId);
  if (!membership) {
    return { allowed: false, reason: 'forbidden', role: null };
  }
  if (!allowedRoles.includes(membership.role)) {
    return { allowed: false, reason: 'insufficient_role', role: membership.role };
  }
  return { allowed: true, membership };
}

export interface UserWorkspaceSummary {
  id: string;
  name: string;
  plan: string;
  role: WorkspaceRole;
  isOwner: boolean;
}

/**
 * Lists all workspaces a user actively belongs to or owns, deterministically ordered.
 */
export async function listUserWorkspaces(userId: string): Promise<UserWorkspaceSummary[]> {
  if (!userId) return [];

  const [{ data: memberRows }, { data: ownedRows }] = await Promise.all([
    supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, role, status, joined_at, workspaces(id, name, plan, owner_id)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: true }),
    supabaseAdmin
      .from('workspaces')
      .select('id, name, plan, owner_id, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  const byId = new Map<string, UserWorkspaceSummary>();

  if (Array.isArray(ownedRows)) {
    for (const row of ownedRows as Array<{ id: string; name?: string | null; plan?: string | null }>) {
      if (!row?.id) continue;
      byId.set(row.id, {
        id: row.id,
        name: row.name || 'Workspace',
        plan: row.plan || 'spark',
        role: 'owner',
        isOwner: true,
      });
    }
  }

  if (Array.isArray(memberRows)) {
    for (const row of memberRows as Array<{
      workspace_id: string;
      role?: string | null;
      status?: string | null;
      workspaces?: { id?: string; name?: string | null; plan?: string | null; owner_id?: string | null } | null;
    }>) {
      if (!row?.workspace_id) continue;
      if (row.status && row.status !== 'active') continue;
      const existing = byId.get(row.workspace_id);
      const role = existing ? 'owner' : normalizeWorkspaceRole(row.role);
      const ws = row.workspaces;
      byId.set(row.workspace_id, {
        id: row.workspace_id,
        name: ws?.name || existing?.name || 'Workspace',
        plan: ws?.plan || existing?.plan || 'spark',
        role,
        isOwner: existing?.isOwner || ws?.owner_id === userId || role === 'owner',
      });
    }
  }

  return Array.from(byId.values());
}

/**
 * Deterministic workspace resolver safe for multi-workspace users.
 * Honors preferredWorkspaceId (e.g. active_workspace_id cookie) when authorized,
 * otherwise falls back to oldest active membership, then oldest owned workspace.
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
      .select('workspace_id, status')
      .eq('user_id', userId)
      .or('status.eq.active,status.is.null')
      .order('joined_at', { ascending: true })
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
