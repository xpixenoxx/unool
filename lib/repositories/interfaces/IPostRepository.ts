export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type Platform = 'linkedin' | 'x' | 'threads' | 'manual' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'reddit' | 'mastodon' | 'slack' | 'twitch' | 'telegram' | 'discord' | 'dribbble' | 'skool' | 'whop' | 'kick' | 'vk' | 'warpcast' | 'mewe' | 'nostr' | 'medium' | 'lemmy' | 'listmonk' | 'hashnode' | 'devto';
export type ScheduleStrategy = 'simultaneous' | 'cascading';
export type StoryType = 'shipped' | 'learned' | 'milestone' | 'opinion';
export type ArcStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface Post {
  id: string;
  profileId: string;
  workspaceId: string;
  content: string;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  adaptationPromptVersion: string | null;
  version: number;
  // Scheduling engine fields
  qstashMessageId: string | null;
  scheduleStrategy: ScheduleStrategy;
  arcId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentArc {
  id: string;
  workspaceId: string;
  profileId: string;
  title: string;
  coreStory: string;
  storyType: StoryType;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;
  status: ArcStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostVariant {
  id: string;
  postId: string;
  platform: Platform;
  adaptedContent: string;
  mediaUrls: PostMedia[];
  characterCount: number;
  hashtagStrategy: string[];
  firstCommentHint: string | null;
  platformPostId: string | null;
  status: PostVariantStatus;
  error: PostError | null;
  // Scheduling engine fields
  scheduledAt: Date | null;
  qstashMessageId: string | null;
  autoFirstComment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PostVariantStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface PostMedia {
  url: string;
  type: 'image' | 'video';
  alt?: string;
}

export interface PostError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CreatePostInput {
  profileId: string;
  workspaceId: string;
  content: string;
  adaptationPromptVersion?: string;
}

export interface UpdatePostInput {
  content?: string;
  status?: PostStatus;
  scheduledAt?: Date | null;
  adaptationPromptVersion?: string;
  qstashMessageId?: string | null;
  scheduleStrategy?: ScheduleStrategy;
  arcId?: string | null;
}

export interface CreateContentArcInput {
  workspaceId: string;
  profileId: string;
  title: string;
  coreStory: string;
  storyType: StoryType;
  startDate: string;
  endDate: string;
}

export interface UpdateContentArcInput {
  status?: ArcStatus;
  title?: string;
}

export interface PostFilters {
  status?: PostStatus;
  platform?: Platform;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findByProfileId(profileId: string, filters?: PostFilters): Promise<Post[]>;
  findByWorkspaceId(workspaceId: string, filters?: PostFilters): Promise<Post[]>;
  create(input: CreatePostInput): Promise<Post>;
  update(id: string, data: UpdatePostInput): Promise<Post>;
  updateStatus(id: string, status: PostStatus, platformPostId?: string): Promise<Post>;
  findVariantsByPostId(postId: string): Promise<PostVariant[]>;
  findVariantById(id: string): Promise<PostVariant | null>;
  createVariant(variant: CreatePostVariantInput): Promise<PostVariant>;
  updateVariant(id: string, data: UpdatePostVariantInput): Promise<PostVariant>;
  getDraft(profileId: string, clientVersion: string): Promise<Post | null>;
  saveDraft(postId: string, content: string, clientVersion: string): Promise<void>;
  // Scheduling
  findScheduledByWorkspace(workspaceId: string, from: Date, to: Date): Promise<Post[]>;
  findVariantsByPostIds(postIds: string[]): Promise<PostVariant[]>;
  // Content Arcs
  createContentArc(input: CreateContentArcInput): Promise<ContentArc>;
  updateContentArc(id: string, data: UpdateContentArcInput): Promise<ContentArc>;
  findContentArcsByWorkspace(workspaceId: string): Promise<ContentArc[]>;
  findContentArcById(id: string): Promise<ContentArc | null>;
}

export interface CreatePostVariantInput {
  postId: string;
  platform: Platform;
  adaptedContent: string;
  mediaUrls?: PostMedia[];
  characterCount: number;
  hashtagStrategy: string[];
  firstCommentHint?: string | null;
  status?: PostVariantStatus;
  error?: PostError | null;
}

export interface UpdatePostVariantInput {
  adaptedContent?: string;
  mediaUrls?: PostMedia[];
  characterCount?: number;
  hashtagStrategy?: string[];
  firstCommentHint?: string;
  platformPostId?: string;
  status?: PostVariantStatus;
  error?: PostError | null;
  // Scheduling
  scheduledAt?: Date | null;
  qstashMessageId?: string | null;
  autoFirstComment?: string | null;
}