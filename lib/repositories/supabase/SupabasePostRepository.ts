import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { IPostRepository } from '../interfaces/IPostRepository';
import type {
  Post,
  PostVariant,
  CreatePostInput,
  UpdatePostInput,
  CreatePostVariantInput,
  UpdatePostVariantInput,
  PostFilters,
  PostStatus,
  PostVariantStatus,
  Platform,
  PostMedia,
  PostError,
} from '../interfaces/IPostRepository';

export class SupabasePostRepository implements IPostRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  private mapPostRow(row: Record<string, unknown>): Post {
    return {
      id: row.id as string,
      profileId: row.profile_id as string,
      workspaceId: row.workspace_id as string,
      content: row.content as string,
      status: row.status as PostStatus,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at as string) : null,
      publishedAt: row.published_at ? new Date(row.published_at as string) : null,
      adaptationPromptVersion: row.adaptation_prompt_version as string | null,
      version: row.version as number,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapVariantRow(row: Record<string, unknown>): PostVariant {
    return {
      id: row.id as string,
      postId: row.post_id as string,
      platform: row.platform as Platform,
      adaptedContent: row.adapted_content as string,
      mediaUrls: (row.media_urls as PostMedia[]) || [],
      characterCount: row.character_count as number,
      hashtagStrategy: (row.hashtag_strategy as string[]) || [],
      firstCommentHint: row.first_comment_hint as string | null,
      platformPostId: row.platform_post_id as string | null,
      status: row.status as PostVariantStatus,
      error: row.error as PostError | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async findById(id: string): Promise<Post | null> {
    const { data, error } = await this.supabase.from('posts').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapPostRow(data);
  }

  async findByProfileId(profileId: string, filters?: PostFilters): Promise<Post[]> {
    let query = this.supabase.from('posts').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom.toISOString());
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo.toISOString());
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(this.mapPostRow);
  }

  async findByWorkspaceId(workspaceId: string, filters?: PostFilters): Promise<Post[]> {
    let query = this.supabase.from('posts').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom.toISOString());
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo.toISOString());
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(this.mapPostRow);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const { data, error } = await this.supabase
      .from('posts')
      .insert({
        profile_id: input.profileId,
        workspace_id: input.workspaceId,
        content: input.content,
        adaptation_prompt_version: input.adaptationPromptVersion,
        status: 'draft',
        version: 1,
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapPostRow(data);
  }

  async update(id: string, data: UpdatePostInput): Promise<Post> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.content !== undefined) updateData.content = data.content;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scheduledAt !== undefined) updateData.scheduled_at = data.scheduledAt?.toISOString() ?? null;
    if (data.adaptationPromptVersion !== undefined) updateData.adaptation_prompt_version = data.adaptationPromptVersion;

    const { data: row, error } = await this.supabase.from('posts').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return this.mapPostRow(row);
  }

  async updateStatus(id: string, status: PostStatus, platformPostId?: string): Promise<Post> {
    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'published') updateData.published_at = new Date().toISOString();
    if (platformPostId) updateData.platform_post_id = platformPostId;

    const { data, error } = await this.supabase.from('posts').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return this.mapPostRow(data);
  }

  async findVariantsByPostId(postId: string): Promise<PostVariant[]> {
    const { data, error } = await this.supabase
      .from('post_variants')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(this.mapVariantRow);
  }

  async findVariantById(id: string): Promise<PostVariant | null> {
    const { data, error } = await this.supabase.from('post_variants').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapVariantRow(data);
  }

  async createVariant(input: CreatePostVariantInput): Promise<PostVariant> {
    const { data, error } = await this.supabase
      .from('post_variants')
      .insert({
        post_id: input.postId,
        platform: input.platform,
        adapted_content: input.adaptedContent,
        media_urls: input.mediaUrls || [],
        character_count: input.characterCount,
        hashtag_strategy: input.hashtagStrategy,
        first_comment_hint: input.firstCommentHint,
        status: 'draft',
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapVariantRow(data);
  }

  async updateVariant(id: string, data: UpdatePostVariantInput): Promise<PostVariant> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.adaptedContent !== undefined) updateData.adapted_content = data.adaptedContent;
    if (data.mediaUrls !== undefined) updateData.media_urls = data.mediaUrls;
    if (data.characterCount !== undefined) updateData.character_count = data.characterCount;
    if (data.hashtagStrategy !== undefined) updateData.hashtag_strategy = data.hashtagStrategy;
    if (data.firstCommentHint !== undefined) updateData.first_comment_hint = data.firstCommentHint;
    if (data.platformPostId !== undefined) updateData.platform_post_id = data.platformPostId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.error !== undefined) updateData.error = data.error;

    const { data: row, error } = await this.supabase.from('post_variants').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return this.mapVariantRow(row);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDraft(profileId: string, _clientVersion: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapPostRow(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async saveDraft(postId: string, content: string, _clientVersion: string): Promise<void> {
    const { error } = await this.supabase
      .from('posts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', postId);
    if (error) throw error;
  }
}