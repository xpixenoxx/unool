import { config } from '@/lib/config/schema';
import type { IPlatformRepository } from '../interfaces/IPlatformRepository';
import type {
  PlatformConnection,
  PlatformPost,
  CreatePlatformConnectionInput,
  CreatePlatformPostInput,
  Platform,
} from '../interfaces/IPlatformRepository';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { invalidateOverviewCache } from '@/lib/cache/overviewCache';
import { normalizeFacebookUrl } from '@/lib/platforms/facebookUrl';

export class SupabasePlatformRepository implements IPlatformRepository {
  private supabase = supabaseAdmin;

  private mapConnectionRow(row: Record<string, unknown>): PlatformConnection {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      userId: (row.user_id as string) || '',
      platform: row.platform as Platform,
      platformUserId: row.platform_user_id as string,
      username: row.username as string,
      displayName: (row.display_name as string | null) ?? undefined,
      avatarUrl: (row.avatar_url as string | null) ?? undefined,
      accessTokenEncrypted: row.access_token_encrypted as string,
      refreshTokenEncrypted: row.refresh_token_encrypted as string,
      expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
      scopes: (row.scopes as string[]) || [],
      status: row.status as 'connected' | 'expired' | 'revoked' | 'error',
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      metadata: (row.metadata as Record<string, unknown>) || {},
    };
  }

  private mapPostRow(row: Record<string, unknown>): PlatformPost {
    const rawUrl = (row.platform_url as string) || '';
    const rawPostId = (row.platform_post_id as string) || '';
    return {
      id: row.id as string,
      postVariantId: row.post_variant_id as string,
      platformConnectionId: row.platform_connection_id as string,
      platformPostId: rawPostId,
      platformUrl: normalizeFacebookUrl(rawUrl, rawPostId),
      engagement: row.engagement as Record<string, unknown>,
      createdAt: new Date(row.created_at as string),
    };
  }

  private toDbError(error: unknown, context: string): Error {
    if (error instanceof Error) return error;
    if (error && typeof error === 'object') {
      const pg = error as { message?: string; details?: string; hint?: string; code?: string };
      return new Error(`${context}: ${pg.message || 'unknown error'} (code: ${pg.code || 'none'}, details: ${pg.details || 'none'})`);
    }
    return new Error(`${context}: ${String(error)}`);
  }

  async findById(id: string): Promise<PlatformConnection | null> {
    const { data, error } = await this.supabase.from('platform_connections').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw this.toDbError(error, 'Error finding connection by id'); }
    return this.mapConnectionRow(data);
  }

  async findByWorkspaceAndPlatform(workspaceId: string, platform: Platform): Promise<PlatformConnection | null> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw this.toDbError(error, 'Error finding connection by platform');
    if (!data || data.length === 0) return null;
    return this.mapConnectionRow(data[0]);
  }

  async findAllByWorkspaceAndPlatform(workspaceId: string, platform: Platform): Promise<PlatformConnection[]> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .order('created_at', { ascending: true });
    if (error) throw this.toDbError(error, 'Error finding connections by platform');
    return (data || []).map(this.mapConnectionRow);
  }

  async findByWorkspacePlatformAndUser(
    workspaceId: string,
    platform: Platform,
    platformUserId: string
  ): Promise<PlatformConnection | null> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .eq('platform_user_id', platformUserId)
      .limit(1);
    if (error) throw this.toDbError(error, 'Error finding connection by platform user');
    if (!data || data.length === 0) return null;
    return this.mapConnectionRow(data[0]);
  }

  async findByWorkspaceId(workspaceId: string): Promise<PlatformConnection[]> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId);
    if (error) throw this.toDbError(error, 'Error finding connections by workspace');
    return data.map(this.mapConnectionRow);
  }

  async findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<PlatformConnection[]> {
    // Try with user_id filter first; if column doesn't exist, fall back to workspace-only
    try {
      const { data, error } = await this.supabase
        .from('platform_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);
      if (error) throw this.toDbError(error, 'Error finding connections by user');
      return data.map(this.mapConnectionRow);
    } catch {
      // user_id column may not exist yet — fall back
      return this.findByWorkspaceId(workspaceId);
    }
  }

  async create(input: CreatePlatformConnectionInput): Promise<PlatformConnection> {
    // Check if this specific account already exists (by workspace + platform + platform_user_id)
    const { data: existingData } = await this.supabase
      .from('platform_connections')
      .select('id')
      .eq('workspace_id', input.workspaceId)
      .eq('platform', input.platform)
      .eq('platform_user_id', input.platformUserId)
      .limit(1);

    const existing = existingData?.[0];

    let data: Record<string, unknown> | null = null;
    let lastError: unknown = null;

    if (existing) {
      // Update existing account record
      const updatePayload: Record<string, unknown> = {
        platform_user_id: input.platformUserId,
        username: input.username,
        access_token_encrypted: input.accessToken,
        expires_at: input.expiresAt?.toISOString(),
        scopes: input.scopes || [],
        status: 'connected',
        updated_at: new Date().toISOString(),
      };

      if (input.displayName !== undefined) {
        updatePayload.display_name = input.displayName;
      }
      if (input.avatarUrl !== undefined) {
        updatePayload.avatar_url = input.avatarUrl;
      }
      if (input.refreshToken) {
        updatePayload.refresh_token_encrypted = input.refreshToken;
      }
      if (input.userId) {
        updatePayload.user_id = input.userId;
      }
      if (input.metadata && Object.keys(input.metadata).length > 0) {
        updatePayload.metadata = input.metadata;
      }

      let result = await this.supabase
        .from('platform_connections')
        .update(updatePayload)
        .eq('id', existing.id)
        .select()
        .single();

      // If update failed due to missing optional column or constraint, progressively strip & retry
      if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204' || result.error.message?.includes('column') || result.error.code === '23503')) {
        for (const col of ['display_name', 'avatar_url', 'metadata', 'user_id'] as const) {
          if (result.error && col in updatePayload) {
            delete updatePayload[col];
            result = await this.supabase
              .from('platform_connections')
              .update(updatePayload)
              .eq('id', existing.id)
              .select()
              .single();
          }
        }
      }

      data = result.data;
      lastError = result.error;
    } else {
      // Insert new account record
      const insertPayload: Record<string, unknown> = {
        workspace_id: input.workspaceId,
        platform: input.platform,
        platform_user_id: input.platformUserId,
        username: input.username,
        access_token_encrypted: input.accessToken,
        refresh_token_encrypted: input.refreshToken,
        expires_at: input.expiresAt?.toISOString(),
        scopes: input.scopes || [],
        status: 'connected',
      };
      if (input.displayName !== undefined) {
        insertPayload.display_name = input.displayName;
      }
      if (input.avatarUrl !== undefined) {
        insertPayload.avatar_url = input.avatarUrl;
      }
      if (input.userId) {
        insertPayload.user_id = input.userId;
      }
      if (input.metadata && Object.keys(input.metadata).length > 0) {
        insertPayload.metadata = input.metadata;
      }

      let result = await this.supabase
        .from('platform_connections')
        .insert(insertPayload)
        .select()
        .single();

      // If insert failed because optional column doesn't exist yet, progressively strip & retry
      if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204' || result.error.message?.includes('column') || result.error.code === '23503')) {
        for (const col of ['display_name', 'avatar_url', 'metadata', 'user_id'] as const) {
          if (result.error && col in insertPayload) {
            delete insertPayload[col];
            result = await this.supabase
              .from('platform_connections')
              .insert(insertPayload)
              .select()
              .single();
          }
        }
      }

      // If insert hit unique constraint (23505), update the existing connection instead
      if (result.error && result.error.code === '23505') {
        const { data: conflictRow } = await this.supabase
          .from('platform_connections')
          .select('id')
          .eq('workspace_id', input.workspaceId)
          .eq('platform', input.platform)
          .limit(1)
          .single();

        if (conflictRow?.id) {
          const fallbackUpdate: Record<string, unknown> = {
            platform_user_id: input.platformUserId,
            username: input.username,
            access_token_encrypted: input.accessToken,
            expires_at: input.expiresAt?.toISOString(),
            scopes: input.scopes || [],
            status: 'connected',
            updated_at: new Date().toISOString(),
          };
          if (input.refreshToken) fallbackUpdate.refresh_token_encrypted = input.refreshToken;
          result = await this.supabase
            .from('platform_connections')
            .update(fallbackUpdate)
            .eq('id', conflictRow.id)
            .select()
            .single();
        }
      }

      data = result.data;
      lastError = result.error;
    }

    if (lastError || !data) {
      throw this.toDbError(lastError, 'DB error saving platform connection');
    }
    const mapped = this.mapConnectionRow(data);

    // Reconcile and preserve past posts: ensure existing platform_posts for this workspace & platform
    // are re-linked to this connection ID so historical analytics remain seamlessly connected.
    try {
      const { data: wsPosts } = await this.supabase
        .from('posts')
        .select('id')
        .eq('workspace_id', input.workspaceId);
      const postIds = (wsPosts || []).map((p: any) => p.id);
      if (postIds.length > 0) {
        const { data: wsVariants } = await this.supabase
          .from('post_variants')
          .select('id')
          .eq('platform', input.platform)
          .in('post_id', postIds);
        const variantIds = (wsVariants || []).map((v: any) => v.id);
        if (variantIds.length > 0) {
          await this.supabase
            .from('platform_posts')
            .update({ platform_connection_id: mapped.id })
            .in('post_variant_id', variantIds);
        }
      }
    } catch {
      // Non-blocking post-reconciliation
    }

    if (input.workspaceId) {
      invalidateOverviewCache(input.workspaceId);
    }

    return mapped;
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
    if (error) throw this.toDbError(error, 'Error updating platform connection');
    return this.mapConnectionRow(row);
  }

  async updateStatus(id: string, status: 'connected' | 'expired' | 'revoked' | 'error'): Promise<PlatformConnection> {
    return this.update(id, { status });
  }

  async disconnect(id: string): Promise<void> {
    const { data: row, error } = await this.supabase
      .from('platform_connections')
      .update({
        status: 'revoked',
        access_token_encrypted: '',
        refresh_token_encrypted: null,
        expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('workspace_id')
      .single();
    if (error) throw this.toDbError(error, 'Error disconnecting platform connection');
    if (row?.workspace_id) {
      invalidateOverviewCache(row.workspace_id);
    }
  }

  async delete(id: string): Promise<void> {
    const { data: row, error } = await this.supabase
      .from('platform_connections')
      .delete()
      .eq('id', id)
      .select('workspace_id')
      .single();
    if (error) throw this.toDbError(error, 'Error deleting platform connection');
    if (row?.workspace_id) {
      invalidateOverviewCache(row.workspace_id);
    }
  }

  async createPlatformPost(input: CreatePlatformPostInput): Promise<PlatformPost> {
    const sanitizedUrl = normalizeFacebookUrl(input.platformUrl, input.platformPostId);
    const { data, error } = await this.supabase
      .from('platform_posts')
      .insert({
        post_variant_id: input.postVariantId,
        platform_connection_id: input.platformConnectionId,
        platform_post_id: input.platformPostId,
        platform_url: sanitizedUrl,
        engagement: input.engagement || {},
      })
      .select()
      .single();
    if (error) throw this.toDbError(error, 'Error creating platform post');
    return this.mapPostRow(data);
  }

  async findPlatformPostsByVariant(variantId: string): Promise<PlatformPost[]> {
    const { data, error } = await this.supabase
      .from('platform_posts')
      .select('*')
      .eq('post_variant_id', variantId);
    if (error) throw this.toDbError(error, 'Error finding platform posts by variant');
    return data.map(this.mapPostRow);
  }

  async findPlatformPostsByVariantIds(variantIds: string[]): Promise<PlatformPost[]> {
    if (variantIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from('platform_posts')
      .select('*')
      .in('post_variant_id', variantIds);
    if (error) throw this.toDbError(error, 'Error finding platform posts by variant ids');
    return (data || []).map(this.mapPostRow);
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

  async findPlatformPostByPlatformPostId(platformPostId: string): Promise<PlatformPost | null> {
    const { data, error } = await this.supabase
      .from('platform_posts')
      .select('*')
      .eq('platform_post_id', platformPostId)
      .single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapPostRow(data);
  }
}
