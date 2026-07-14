export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type Platform = 'linkedin' | 'x' | 'threads' | 'manual';

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
  createdAt: Date;
  updatedAt: Date;
}

export type PostVariantStatus = 'draft' | 'published' | 'failed';

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
}

export interface CreatePostVariantInput {
  postId: string;
  platform: Platform;
  adaptedContent: string;
  mediaUrls?: PostMedia[];
  characterCount: number;
  hashtagStrategy: string[];
  firstCommentHint?: string;
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
}