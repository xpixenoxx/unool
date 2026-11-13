import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    const { SupabasePlatformRepository } = await import('@/lib/repositories/supabase/SupabasePlatformRepository');
    const platformRepo = new SupabasePlatformRepository();
    const connections = await platformRepo.findByWorkspaceId(auth.workspaceId);
    const connectedPlatforms = new Set(connections.filter(c => c.status === 'connected').map(c => c.platform));

    const allVariants = await postRepository.findVariantsByPostId(postId);

    // Look up platform_posts for each variant to get the live platformUrl
    const variantPlatformUrls: Record<string, string> = {};
    for (const v of allVariants) {
      if (v.status === 'published') {
        const platformPosts = await platformRepo.findPlatformPostsByVariant(v.id);
        if (platformPosts.length > 0 && platformPosts[0].platformUrl) {
          variantPlatformUrls[v.id] = platformPosts[0].platformUrl;
        }
      }
    }

    logger.info('Post with variants fetched', { traceId, postId, variantCount: allVariants.length });

    const isFlightPlan = Boolean(post.arcId || post.adaptationPromptVersion === 'schedule-engine-v1');
    const isQuickBroadcast = post.adaptationPromptVersion === 'direct-broadcast';
    const origin: 'flightplan' | 'quick-broadcast' | 'ai-composer' = isFlightPlan
      ? 'flightplan'
      : isQuickBroadcast
      ? 'quick-broadcast'
      : 'ai-composer';

    const connectionIds = Array.from(
      new Set(allVariants.map(v => v.platformConnectionId).filter((id): id is string => Boolean(id)))
    );
    const connectionMetaById: Record<string, { username?: string | null; displayName?: string | null; avatarUrl?: string | null }> = {};
    if (connectionIds.length > 0) {
      const { data: connRows } = await supabaseAdmin
        .from('platform_connections')
        .select('id, username, display_name, avatar_url')
        .in('id', connectionIds);
      for (const row of connRows || []) {
        connectionMetaById[row.id] = {
          username: row.username ?? null,
          displayName: row.display_name ?? null,
          avatarUrl: row.avatar_url ?? null,
        };
      }
    }

    return NextResponse.json({
      post: {
        id: post.id,
        profileId: post.profileId,
        workspaceId: post.workspaceId,
        content: post.content,
        status: post.status,
        scheduledAt: post.scheduledAt?.toISOString() ?? null,
        scheduleStrategy: post.scheduleStrategy,
        arcId: post.arcId,
        adaptationPromptVersion: post.adaptationPromptVersion ?? null,
        origin,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
      variants: allVariants.map((v) => {
        const connMeta = v.platformConnectionId ? connectionMetaById[v.platformConnectionId] : undefined;
        return {
          id: v.id,
          postId: v.postId,
          platform: v.platform,
          platformConnectionId: v.platformConnectionId ?? null,
          accountUsername: connMeta?.username ?? null,
          accountDisplayName: connMeta?.displayName ?? null,
          accountAvatarUrl: connMeta?.avatarUrl ?? null,
          adaptedContent: v.adaptedContent,
          mediaUrls: v.mediaUrls ?? [],
          characterCount: v.characterCount,
          hashtagStrategy: v.hashtagStrategy ?? [],
          firstCommentHint: v.firstCommentHint,
          scheduledAt: v.scheduledAt?.toISOString() ?? null,
          autoFirstComment: v.autoFirstComment,
          status: v.status,
          error: v.error,
          platformUrl: variantPlatformUrls[v.id] || null,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        };
      }),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch post', { traceId, postId, error: err });
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function DELETE(
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

    

    // 1. Find all variants for this post
    const variants = await postRepository.findVariantsByPostId(postId);
    const variantIds = variants.map(v => v.id);

    if (variantIds.length > 0) {
      // 2. Delete platform_posts if any exist
      await supabaseAdmin.from('platform_posts').delete().in('post_variant_id', variantIds);
      // 3. Delete post_variants
      await supabaseAdmin.from('post_variants').delete().in('id', variantIds);
    }

    // 4. Delete the post record
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('workspace_id', auth.workspaceId);

    if (deleteError) {
      throw deleteError;
    }

    logger.info('Draft post removed successfully', { traceId, postId });
    return NextResponse.json({ success: true, message: 'Draft removed successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to delete post', { traceId, postId, error: err });
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
