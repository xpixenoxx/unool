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
  ContentArc,
  CreateContentArcInput,
  UpdateContentArcInput,
  ArcStatus,
  StoryType,
  ScheduleStrategy,
} from '../interfaces/IPostRepository';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class SupabasePostRepository implements IPostRepository {
  private supabase = supabaseAdmin;

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
      qstashMessageId: (row.qstash_message_id as string | null) ?? null,
      scheduleStrategy: (row.schedule_strategy as ScheduleStrategy) ?? 'simultaneous',
      arcId: (row.arc_id as string | null) ?? null,
      arcBeat: (row.arc_beat as string | null) ?? null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapVariantRow(row: Record<string, unknown>): PostVariant {
    return {
      id: row.id as string,
      postId: row.post_id as string,
      platform: row.platform as Platform,
      platformConnectionId: (row.platform_connection_id as string | null) ?? null,
      adaptedContent: row.adapted_content as string,
      mediaUrls: (row.media_urls as PostMedia[]) || [],
      characterCount: row.character_count as number,
      hashtagStrategy: (row.hashtag_strategy as string[]) || [],
      firstCommentHint: row.first_comment_hint as string | null,
      platformPostId: row.platform_post_id as string | null,
      status: row.status as PostVariantStatus,
      error: row.error as PostError | null,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at as string) : null,
      qstashMessageId: (row.qstash_message_id as string | null) ?? null,
      autoFirstComment: (row.auto_first_comment as string | null) ?? null,
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
    const insertRow: Record<string, unknown> = {
      profile_id: input.profileId,
      workspace_id: input.workspaceId,
      content: input.content,
      adaptation_prompt_version: input.adaptationPromptVersion,
      status: 'draft',
      version: 1,
    };
    if (input.arcBeat !== undefined) {
      insertRow.arc_beat = input.arcBeat;
    }

    const { data, error } = await this.supabase
      .from('posts')
      .insert(insertRow)
      .select()
      .single();

    if (error && input.arcBeat !== undefined && (error.code === 'PGRST204' || error.code === '42703' || String(error.message || '').includes('arc_beat'))) {
      delete insertRow.arc_beat;
      const retry = await this.supabase.from('posts').insert(insertRow).select().single();
      if (retry.error) throw retry.error;
      return { ...this.mapPostRow(retry.data), arcBeat: input.arcBeat ?? null };
    }
    if (error) throw error;
    return this.mapPostRow(data);
  }

  async update(id: string, data: UpdatePostInput): Promise<Post> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.content !== undefined) updateData.content = data.content;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scheduledAt !== undefined) updateData.scheduled_at = data.scheduledAt?.toISOString() ?? null;
    if (data.adaptationPromptVersion !== undefined) updateData.adaptation_prompt_version = data.adaptationPromptVersion;
    if (data.qstashMessageId !== undefined) updateData.qstash_message_id = data.qstashMessageId;
    if (data.scheduleStrategy !== undefined) updateData.schedule_strategy = data.scheduleStrategy;
    if (data.arcId !== undefined) updateData.arc_id = data.arcId;
    if (data.arcBeat !== undefined) updateData.arc_beat = data.arcBeat;

    const { data: row, error } = await this.supabase.from('posts').update(updateData).eq('id', id).select().single();
    if (error && data.arcBeat !== undefined && (error.code === 'PGRST204' || error.code === '42703' || String(error.message || '').includes('arc_beat'))) {
      delete updateData.arc_beat;
      const retry = await this.supabase.from('posts').update(updateData).eq('id', id).select().single();
      if (retry.error) throw retry.error;
      return { ...this.mapPostRow(retry.data), arcBeat: data.arcBeat ?? null };
    }
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

  async claimForPublishing(
    id: string,
    fromStatus: 'scheduled' | 'publishing' | 'failed' = 'scheduled',
    staleBefore?: Date,
  ): Promise<Post | null> {
    let query = this.supabase
      .from('posts')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', fromStatus);

    if (fromStatus === 'publishing') {
      const threshold = staleBefore ?? new Date(Date.now() - 5 * 60 * 1000);
      query = query.lte('updated_at', threshold.toISOString());
    }

    // No .single(): zero affected rows is a normal "lost the claim" outcome, not an error.
    const { data, error } = await query.select();
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return this.mapPostRow(data[0]);
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
    const insertRow: Record<string, unknown> = {
      post_id: input.postId,
      platform: input.platform,
      adapted_content: input.adaptedContent,
      media_urls: input.mediaUrls || [],
      character_count: input.characterCount,
      hashtag_strategy: input.hashtagStrategy,
      first_comment_hint: input.firstCommentHint ?? null,
      auto_first_comment: input.autoFirstComment ?? null,
      qstash_message_id: input.qstashMessageId ?? null,
      status: input.status ?? 'draft',
      scheduled_at: input.scheduledAt ? input.scheduledAt.toISOString() : null,
      error: input.error ?? null,
    };
    if (input.platformConnectionId !== undefined) {
      insertRow.platform_connection_id = input.platformConnectionId ?? null;
    }

    const { data, error } = await this.supabase
      .from('post_variants')
      .insert(insertRow)
      .select()
      .single();
    if (error && input.platformConnectionId !== undefined && (error.code === '42703' || error.code === 'PGRST204' || String(error.message || '').includes('platform_connection_id'))) {
      delete insertRow.platform_connection_id;
      const retry = await this.supabase.from('post_variants').insert(insertRow).select().single();
      if (retry.error) throw retry.error;
      return { ...this.mapVariantRow(retry.data), platformConnectionId: input.platformConnectionId ?? null };
    }
    if (error) throw error;
    return this.mapVariantRow(data);
  }

  async createVariantsBatch(inputs: CreatePostVariantInput[]): Promise<PostVariant[]> {
    if (inputs.length === 0) return [];
    const buildRows = (includeConnectionId: boolean) =>
      inputs.map((input) => ({
        post_id: input.postId,
        platform: input.platform,
        ...(includeConnectionId ? { platform_connection_id: input.platformConnectionId ?? null } : {}),
        adapted_content: input.adaptedContent,
        media_urls: input.mediaUrls || [],
        character_count: input.characterCount,
        hashtag_strategy: input.hashtagStrategy,
        first_comment_hint: input.firstCommentHint ?? null,
        auto_first_comment: input.autoFirstComment ?? null,
        qstash_message_id: input.qstashMessageId ?? null,
        status: input.status ?? 'draft',
        scheduled_at: input.scheduledAt ? input.scheduledAt.toISOString() : null,
        error: input.error ?? null,
      }));

    const { data, error } = await this.supabase
      .from('post_variants')
      .insert(buildRows(true))
      .select();
    if (error && (error.code === '42703' || error.code === 'PGRST204' || String(error.message || '').includes('platform_connection_id'))) {
      const retry = await this.supabase.from('post_variants').insert(buildRows(false)).select();
      if (retry.error) throw retry.error;
      return (retry.data || []).map((row, idx) => ({
        ...this.mapVariantRow(row),
        platformConnectionId: inputs[idx]?.platformConnectionId ?? null,
      }));
    }
    if (error) throw error;
    return (data || []).map(this.mapVariantRow.bind(this));
  }

  async claimVariantForPublishing(
    id: string,
    fromStatus: 'scheduled' | 'publishing' | 'failed' = 'scheduled',
    staleBefore?: Date,
  ): Promise<PostVariant | null> {
    let query = this.supabase
      .from('post_variants')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', fromStatus);

    if (fromStatus === 'publishing') {
      const threshold = staleBefore ?? new Date(Date.now() - 5 * 60 * 1000);
      query = query.lte('updated_at', threshold.toISOString());
    }

    const { data, error } = await query.select();
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return this.mapVariantRow(data[0]);
  }

  async updateVariant(id: string, data: UpdatePostVariantInput): Promise<PostVariant> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.platformConnectionId !== undefined) updateData.platform_connection_id = data.platformConnectionId;
    if (data.adaptedContent !== undefined) updateData.adapted_content = data.adaptedContent;
    if (data.mediaUrls !== undefined) updateData.media_urls = data.mediaUrls;
    if (data.characterCount !== undefined) updateData.character_count = data.characterCount;
    if (data.hashtagStrategy !== undefined) updateData.hashtag_strategy = data.hashtagStrategy;
    if (data.firstCommentHint !== undefined) updateData.first_comment_hint = data.firstCommentHint;
    if (data.platformPostId !== undefined) updateData.platform_post_id = data.platformPostId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.scheduledAt !== undefined) updateData.scheduled_at = data.scheduledAt?.toISOString() ?? null;
    if (data.qstashMessageId !== undefined) updateData.qstash_message_id = data.qstashMessageId;
    if (data.autoFirstComment !== undefined) updateData.auto_first_comment = data.autoFirstComment;

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

  // ── Scheduling Engine ────────────────────────────────────────────────────

  async findScheduledByWorkspace(workspaceId: string, from: Date, to: Date): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['scheduled', 'published', 'publishing', 'failed'])
      .gte('scheduled_at', from.toISOString())
      .lte('scheduled_at', to.toISOString())
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(this.mapPostRow.bind(this));
  }

  async findDueScheduledPosts(beforeDate: Date, workspaceId?: string): Promise<Post[]> {
    let query = this.supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', beforeDate.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Self-heal: also recover posts stuck in 'publishing' state for > 5 minutes
    const stuckThreshold = new Date(Date.now() - 5 * 60 * 1000);
    let stuckQuery = this.supabase
      .from('posts')
      .select('*')
      .eq('status', 'publishing')
      .lte('updated_at', stuckThreshold.toISOString())
      .order('updated_at', { ascending: true })
      .limit(20);

    if (workspaceId) {
      stuckQuery = stuckQuery.eq('workspace_id', workspaceId);
    }

    const { data: stuckData, error: stuckError } = await stuckQuery;
    if (stuckError) throw stuckError;

    // Combine scheduled and stuck posts, deduplicating by ID
    const combinedMap = new Map<string, Record<string, unknown>>();
    for (const row of (data || [])) {
      combinedMap.set(row.id as string, row);
    }
    for (const row of (stuckData || [])) {
      if (!combinedMap.has(row.id as string)) {
        combinedMap.set(row.id as string, row);
      }
    }

    return Array.from(combinedMap.values()).map(this.mapPostRow.bind(this));
  }

  async findDueScheduledVariants(beforeDate: Date, workspaceId?: string): Promise<PostVariant[]> {
    if (workspaceId) {
      const { data, error } = await this.supabase
        .from('post_variants')
        .select('*, posts!inner(workspace_id)')
        .eq('status', 'scheduled')
        .eq('posts.workspace_id', workspaceId)
        .lte('scheduled_at', beforeDate.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        return data.map(this.mapVariantRow.bind(this));
      }
    }

    const query = this.supabase
      .from('post_variants')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', beforeDate.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.mapVariantRow.bind(this));
  }

  async findVariantsByPostIds(postIds: string[]): Promise<PostVariant[]> {
    if (postIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from('post_variants')
      .select('*')
      .in('post_id', postIds)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(this.mapVariantRow.bind(this));
  }

  // ── Content Arc CRUD ─────────────────────────────────────────────────────

  private mapArcRow(row: Record<string, unknown>): ContentArc {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      profileId: row.profile_id as string,
      title: row.title as string,
      coreStory: row.core_story as string,
      storyType: row.story_type as StoryType,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      status: row.status as ArcStatus,
      idempotencyKey: (row.idempotency_key as string | null) ?? null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async createContentArc(input: CreateContentArcInput): Promise<ContentArc> {
    const insertRow: Record<string, unknown> = {
      workspace_id: input.workspaceId,
      profile_id: input.profileId,
      title: input.title,
      core_story: input.coreStory,
      story_type: input.storyType,
      start_date: input.startDate,
      end_date: input.endDate,
      status: 'active',
    };
    if (input.idempotencyKey) {
      insertRow.idempotency_key = input.idempotencyKey;
    }

    const { data, error } = await this.supabase
      .from('content_arcs')
      .insert(insertRow)
      .select()
      .single();

    if (error && input.idempotencyKey && (error.code === 'PGRST204' || error.code === '42703' || String(error.message || '').includes('idempotency_key'))) {
      delete insertRow.idempotency_key;
      const retry = await this.supabase.from('content_arcs').insert(insertRow).select().single();
      if (retry.error) throw retry.error;
      return { ...this.mapArcRow(retry.data), idempotencyKey: input.idempotencyKey };
    }
    if (error) throw error;
    return this.mapArcRow(data);
  }

  async findContentArcByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<ContentArc | null> {
    if (!idempotencyKey) return null;
    const { data, error } = await this.supabase
      .from('content_arcs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('idempotency_key', idempotencyKey)
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === '42703' || String(error.message || '').includes('idempotency_key')) {
        return null;
      }
      throw error;
    }
    if (!data) return null;
    return this.mapArcRow(data);
  }

  async findPostsByArcId(arcId: string): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('arc_id', arcId)
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(this.mapPostRow.bind(this));
  }

  async updateContentArc(id: string, data: UpdateContentArcInput): Promise<ContentArc> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.title !== undefined) updateData.title = data.title;
    const { data: row, error } = await this.supabase
      .from('content_arcs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapArcRow(row);
  }

  async findContentArcsByWorkspace(workspaceId: string): Promise<ContentArc[]> {
    const { data, error } = await this.supabase
      .from('content_arcs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data.map(this.mapArcRow.bind(this));
  }

  async findContentArcById(id: string): Promise<ContentArc | null> {
    const { data, error } = await this.supabase
      .from('content_arcs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapArcRow(data);
  }
}
