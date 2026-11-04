// ── Workspace and membership type definitions ─────────────────────
// Shared across dashboard, API routes, and admin pages.

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  planId: string;
  subdomain?: string;
  createdAt: string;
  updatedAt?: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

