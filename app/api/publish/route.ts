import { NextRequest, NextResponse } from 'next/server';
import { publishService } from '@/lib/services/PublishService';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, workspaceId } = body;

    if (!postId || !workspaceId) {
      return NextResponse.json(
        { error: 'postId and workspaceId are required' },
        { status: 400 }
      );
    }

    const results = await publishService.publishToAllPlatforms(postId, workspaceId);

    logger.info('Publish job completed', { postId, workspaceId, results });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Publish API error', { error: err });
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    );
  }
}