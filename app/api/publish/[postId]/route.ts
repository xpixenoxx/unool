import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { logger } from '@/lib/logger';

const postRepository = new SupabasePostRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const traceId = crypto.randomUUID();
  const { postId } = await params;

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await postRepository.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify workspace ownership
    if (post.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const variants = await postRepository.findVariantsByPostId(postId);

    logger.info('Post with variants fetched', { traceId, postId, variantCount: variants.length });

    return NextResponse.json({
      post: {
        id: post.id,
        profileId: post.profileId,
        workspaceId: post.workspaceId,
        content: post.content,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
      variants: variants.map((v) => ({
        id: v.id,
        postId: v.postId,
        platform: v.platform,
        adaptedContent: v.adaptedContent,
        mediaUrls: v.mediaUrls,
        characterCount: v.characterCount,
        hashtagStrategy: v.hashtagStrategy,
        firstCommentHint: v.firstCommentHint,
        status: v.status,
        error: v.error,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch post', { traceId, postId, error: err });
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}