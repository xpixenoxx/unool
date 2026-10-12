import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { logger } from '@/lib/logger';

const postRepository = new SupabasePostRepository();

/** PATCH: Update a variant's content (save edits) */
/** DELETE: Remove a variant */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const { variantId } = await params;
  const traceId = crypto.randomUUID();

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, hashtags } = body;

    // Find the variant to verify ownership
    const variant = await postRepository.findVariantById(variantId);
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Verify workspace ownership through the post
    const post = await postRepository.findById(variant.postId);
    if (!post || post.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow editing drafts
    if (variant.status !== 'draft') {
      return NextResponse.json({ error: 'Can only edit draft variants' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (content !== undefined) {
      updateData.adaptedContent = content;
      updateData.characterCount = content.length;
    }
    if (hashtags !== undefined) {
      updateData.hashtagStrategy = hashtags;
    }

    const updated = await postRepository.updateVariant(variantId, updateData);

    logger.info('Variant updated', { traceId, variantId, platform: variant.platform });

    return NextResponse.json({
      success: true,
      variant: {
        id: updated.id,
        platform: updated.platform,
        adaptedContent: updated.adaptedContent,
        characterCount: updated.characterCount,
        hashtagStrategy: updated.hashtagStrategy,
        status: updated.status,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Variant update failed', { traceId, variantId, error: err });
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const { variantId } = await params;
  const traceId = crypto.randomUUID();

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the variant to verify ownership
    const variant = await postRepository.findVariantById(variantId);
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Verify workspace ownership through the post
    const post = await postRepository.findById(variant.postId);
    if (!post || post.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow deleting drafts
    if (variant.status !== 'draft') {
      return NextResponse.json({ error: 'Can only delete draft variants' }, { status: 400 });
    }

    // Delete by setting status to failed with a "deleted" marker
    // (We don't hard-delete to preserve audit trail)
    await postRepository.updateVariant(variantId, {
      status: 'failed',
      error: { code: 'USER_DELETED', message: 'Deleted by user' },
    });

    logger.info('Variant deleted', { traceId, variantId, platform: variant.platform });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Variant delete failed', { traceId, variantId, error: err });
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
  }
}
