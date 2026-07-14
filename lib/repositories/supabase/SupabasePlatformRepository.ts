import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { IPlatformRepository } from '../interfaces/IPlatformRepository';
import type {
  PlatformConnection,
  PlatformPost,
  CreatePlatformConnectionInput,
  CreatePlatformPostInput,
} from '../interfaces/IPlatformRepository';

export class SupabasePlatformRepository implements IPlatformRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  private mapConnectionRow(row: Record<string, unknown>): PlatformConnection {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      platform: row.platform as 'linkedin' | 'x' | 'threads',
      platformUserId: row.platform_user_id as string,
      username: row.username as string,
      accessTokenEncrypted: row.access_token_encrypted as string,
      refreshTokenEncrypted: row.refresh_token_encrypted as string,
      expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
      scopes: (row.scopes as string[]) || [],
      status: row.status as 'connected' | 'expired' | 'revoked' | 'error',
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapPostRow(row: Record<string, unknown>): PlatformPost {
    return {
      id: row.id as string,
      postVariantId: row.post_variant_id as string,
      platformConnectionId: row.platform_connection_id as string,
      platformPostId: row.platform_post_id as string,
      platformUrl: row.platform_url as string,
      engagement: row.engagement as Record<string, unknown>,
      createdAt: new Date(row.created_at as string),
    };
  }

  async findById(id: string): Promise<PlatformConnection | null> {
    const { data, error } = await this.supabase.from('platform_connections').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapConnectionRow(data);
  }

  async findByWorkspaceAndPlatform(workspaceId: string, platform: 'linkedin' | 'x' | 'threads'): Promise<PlatformConnection | null> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapConnectionRow(data);
  }

  async findByWorkspaceId(workspaceId: string): Promise<PlatformConnection[]> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId);
    if (error) throw error;
    return data.map(this.mapConnectionRow);
  }

  async create(input: CreatePlatformConnectionInput): Promise<PlatformConnection> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .insert({
        workspace_id: input.workspaceId,
        platform: input.platform,
        platform_user_id: input.platformUserId,
        username: input.username,
        access_token_encrypted: input.accessToken,
        refresh_token_encrypted: input.refreshToken,
        expires_at: input.expiresAt?.toISOString(),
        scopes: input.scopes || [],
        status: 'connected',
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapConnectionRow(data);
  }

  async update(id: string, data: Partial<PlatformConnection>): Promise<PlatformConnection> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.username !== undefined) updateData.username = data.username;
    if (data.accessTokenEncrypted !== undefined) updateData.access_token_encrypted = data.accessTokenEncrypted;
    if (data.refreshTokenEncrypted !== undefined) updateData.refresh_token_encrypted = data.refreshTokenEncrypted;
    if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt?.toISOString();
    if (data.scopes !== undefined) updateData.scopes = data.scopes;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: row, error } = await this.supabase.from('platform_connections').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return this.mapConnectionRow(row);
  }

  async updateStatus(id: string, status: 'connected' | 'expired' | 'revoked' | 'error'): Promise<PlatformConnection> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('platform_connections').delete().eq('id', id);
    if (error) throw error;
  }

  async createPlatformPost(input: CreatePlatformPostInput): Promise<PlatformPost> {
    const { data, error } = await this.supabase
      .from('platform_posts')
      .insert({
        post_variant_id: input.postVariantId,
        platform_connection_id: input.platformConnectionId,
        platform_post_id: input.platformPostId,
        platform_url: input.platformUrl,
        engagement: input.engagement || {},
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapPostRow(data);
  }

  async findPlatformPostsByVariant(variantId: string): Promise<PlatformPost[]> {
    const { data, error } = await this.supabase
      .from('platform_posts')
      .select('*')
      .eq('post_variant_id', variantId);
    if (error) throw error;
    return data.map(this.mapPostRow);
  }

  async updateEngagement(id: string, engagement: Record<string, unknown>): Promise<PlatformPost> {
    const { data, error } = await this.supabase
      .from('platform_posts')
      .update({ engagement })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapPostRow(data);
  }
}