import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { ISyncEventRepository } from '../interfaces/ISyncEventRepository';
import type { SyncEvent, SyncEventType } from '../interfaces/ISyncEventRepository';

export class SupabaseSyncEventRepository implements ISyncEventRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  private mapRow(row: Record<string, unknown>): SyncEvent {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      type: row.type as SyncEventType,
      payload: row.payload as Record<string, unknown>,
      version: row.version as number,
      createdAt: new Date(row.created_at as string),
    };
  }

  async append(event: Omit<SyncEvent, 'id' | 'createdAt'>): Promise<SyncEvent> {
    const { data, error } = await this.supabase
      .from('sync_events')
      .insert({
        workspace_id: event.workspaceId,
        type: event.type,
        payload: event.payload,
        version: event.version,
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async findByWorkspaceSince(workspaceId: string, since: Date, limit = 100): Promise<SyncEvent[]> {
    const { data, error } = await this.supabase
      .from('sync_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data.map(this.mapRow);
  }

  async findById(id: string): Promise<SyncEvent | null> {
    const { data, error } = await this.supabase.from('sync_events').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapRow(data);
  }
}