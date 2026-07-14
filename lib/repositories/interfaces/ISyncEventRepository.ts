export interface SyncEvent {
  id: string;
  workspaceId: string;
  type: SyncEventType;
  payload: Record<string, unknown>;
  version: number;
  createdAt: Date;
}

export type SyncEventType =
  | 'profile.updated'
  | 'post.created'
  | 'post.updated'
  | 'post.published'
  | 'post.failed'
  | 'variant.updated'
  | 'connection.updated'
  | 'enrichment.created';

export interface ISyncEventRepository {
  append(event: Omit<SyncEvent, 'id' | 'createdAt'>): Promise<SyncEvent>;
  findByWorkspaceSince(workspaceId: string, since: Date, limit?: number): Promise<SyncEvent[]>;
  findById(id: string): Promise<SyncEvent | null>;
}