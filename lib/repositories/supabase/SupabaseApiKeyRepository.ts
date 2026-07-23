import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { IApiKeyRepository } from '../interfaces/IApiKeyRepository';
import type { ApiKey, CreateApiKeyInput, CreateApiKeyResult, ApiKeyScope } from '../interfaces/IApiKeyRepository';

export class SupabaseApiKeyRepository implements IApiKeyRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  private mapRow(row: Record<string, unknown>): ApiKey {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      userId: row.user_id as string,
      name: row.name as string,
      keyPrefix: row.key_prefix as string,
      scopes: (row.scopes as ApiKeyScope[]) || [],
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : null,
      expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
      revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async create(
    input: CreateApiKeyInput,
    plaintextKey: string,
    keyHash: string,
    encryptedKey: string
  ): Promise<CreateApiKeyResult> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        name: input.name,
        key_hash: keyHash,
        key_prefix: plaintextKey.substring(0, 8),
        encrypted_key: encryptedKey,
        scopes: input.scopes,
        expires_at: input.expiresAt?.toISOString() ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      apiKey: this.mapRow(data),
      plaintextKey,
    };
  }

  async findById(id: string): Promise<ApiKey | null> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapRow(data);
  }

  async findByWorkspaceId(workspaceId: string): Promise<ApiKey[]> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapRow(data);
  }

  async updateLastUsed(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async revoke(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}