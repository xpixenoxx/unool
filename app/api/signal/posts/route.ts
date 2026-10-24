import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { extractNormalizedEngagement } from '@/lib/services/analytics/normalize';
import { syncWorkspaceEngagement } from '@/lib/services/analytics/syncEngagement';
import { scheduleService } from '@/lib/services/ScheduleService';

export const dynamic = 'force-dynamic';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workspaceId } = auth;
  const shouldSync = request.nextUrl.searchParams.get('sync') === 'true';

  // Self-heal: process any scheduled posts that have become due
  await scheduleService.processDueScheduledPosts(workspaceId).catch(() => {});

  // Trigger live engagement sync if requested

  // Trigger live engagement sync if requested
  if (shouldSync) {
    try {
      await syncWorkspaceEngagement(workspaceId, { maxPosts: 15, forceRefresh: true });
    } catch {
      // Non-blocking sync error
    }
  }

  // Fetch last 50 posts (published, scheduled, draft, failed, publishing with variants)
  const { data: posts, error: postsError } = await admin
    .from('posts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['published', 'scheduled', 'draft', 'failed', 'publishing'])
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(50);

  if (postsError) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  const postIds = posts.map((p: any) => p.id);

  // Fetch all variants for these posts in one query
  const { data: variants, error: variantsError } = await admin
    .from('post_variants')
    .select('*')
    .in('post_id', postIds)
    .order('created_at', { ascending: true });

  if (variantsError) {
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }

  // Fetch real platform_posts records containing live engagement metrics
  const variantIds = (variants || []).map((v: any) => v.id);
  let platformPostsByVariant: Record<string, any[]> = {};
  if (variantIds.length > 0) {
    const { data: pPosts } = await admin
      .from('platform_posts')
      .select('id, post_variant_id, platform_connection_id, platform_post_id, platform_url, engagement')
      .in('post_variant_id', variantIds);

    for (const pp of pPosts || []) {
      if (!platformPostsByVariant[pp.post_variant_id]) platformPostsByVariant[pp.post_variant_id] = [];
      platformPostsByVariant[pp.post_variant_id].push(pp);
    }
  }

  // Group variants by post_id and attach real engagement
  const variantsByPost: Record<string, any[]> = {};
  for (const v of variants || []) {
    if (!variantsByPost[v.post_id]) variantsByPost[v.post_id] = [];
    const ppList = platformPostsByVariant[v.id] || [];
    const primaryPp = ppList[0];
    const normalizedEngagement = extractNormalizedEngagement(primaryPp?.engagement);

    variantsByPost[v.post_id].push({
      id: v.id,
      platform: v.platform,
      status: v.status,
      platformUrl: primaryPp?.platform_url || v.platform_url || null,
      platformPostId: primaryPp?.platform_post_id || v.platform_post_id || null,
      characterCount: v.character_count,
      error: v.error,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      engagement: normalizedEngagement,
    });
  }

  const result = posts.map((p: any) => {
    const pVariants = variantsByPost[p.id] || [];
    let postLikes = 0;
    let postComments = 0;
    let postShares = 0;
    let postViews = 0;
    let hasRealData = false;

    for (const v of pVariants) {
      if (v.engagement) {
        postLikes += v.engagement.likes || 0;
        postComments += v.engagement.comments || 0;
        postShares += v.engagement.shares || 0;
        postViews += v.engagement.views || 0;
        if (v.engagement.hasRealData) hasRealData = true;
      }
    }

    const totalInteractions = postLikes + postComments + postShares;

    const isFlightPlan = Boolean(p.arc_id || p.adaptation_prompt_version === 'schedule-engine-v1');
    const isQuickBroadcast = p.adaptation_prompt_version === 'direct-broadcast';
    const origin: 'flightplan' | 'quick-broadcast' | 'ai-composer' = isFlightPlan
      ? 'flightplan'
      : isQuickBroadcast
      ? 'quick-broadcast'
      : 'ai-composer';

    return {
      id: p.id,
      content: p.content,
      status: p.status,
      hookType: p.hook_type || null,
      wordCount: p.word_count || null,
      hasMedia: p.has_media || false,
      createdAt: p.created_at,
      updatedAt: p.updated_at || p.created_at,
      publishedAt: p.published_at || null,
      adaptationPromptVersion: p.adaptation_prompt_version || null,
      arcId: p.arc_id || null,
      origin,
      variants: pVariants,
      engagement: {
        likes: postLikes,
        comments: postComments,
        shares: postShares,
        views: postViews,
        total: totalInteractions,
        hasRealData,
      },
    };
  });

  // Sort posts: active publishing posts always on top, then by most recent publishedAt/updatedAt/createdAt
  result.sort((a, b) => {
    const aPublishing = a.status === 'publishing' || a.variants.some((v: any) => v.status === 'publishing' || v.status === 'pending');
    const bPublishing = b.status === 'publishing' || b.variants.some((v: any) => v.status === 'publishing' || v.status === 'pending');
    if (aPublishing && !bPublishing) return -1;
    if (!aPublishing && bPublishing) return 1;

    const timeA = new Date(a.publishedAt || a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.publishedAt || b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  return NextResponse.json({ posts: result });
}

export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  let postId = searchParams.get('postId');
  if (!postId) {
    try {
      const body = await request.json();
      postId = body.postId;
    } catch {}
  }

  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
  }

  // Verify workspace ownership
  const { data: post } = await admin
    .from('posts')
    .select('id, workspace_id')
    .eq('id', postId)
    .eq('workspace_id', auth.workspaceId)
    .single();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Find and clean up variants & platform posts
  const { data: variants } = await admin
    .from('post_variants')
    .select('id')
    .eq('post_id', postId);

  const variantIds = (variants || []).map((v: any) => v.id);
  if (variantIds.length > 0) {
    await admin.from('platform_posts').delete().in('post_variant_id', variantIds);
    await admin.from('post_variants').delete().in('id', variantIds);
  }

  const { error: deleteError } = await admin
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('workspace_id', auth.workspaceId);

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Draft removed successfully' });
}
