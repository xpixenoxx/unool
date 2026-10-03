import { NextRequest, NextResponse } from 'next/server';
import { publishService } from '@/lib/services/PublishService';
import { logger } from '@/lib/logger';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';

export const maxDuration = 300; // 5 minutes (max allowed on Vercel Pro/Hobby for long-running publish tasks)

export async function POST(request: NextRequest) {
  return planEnforcement.createPost(request, async (request) => {
    try {
      const body = await request.json();
      const { postId, workspaceId } = body;

      if (!postId || !workspaceId) {
        return NextResponse.json(
          { error: 'postId and workspaceId are required' },
          { status: 400 }
        );
      }

      // Publish synchronously — after() was getting killed by Vercel before
      // LinkedIn video uploads could complete, leaving variants stuck as "draft".
      // maxDuration = 300 gives us 5 minutes to finish all uploads.
      let results: Record<string, any> = {};
      try {
        logger.info('Publish starting', { postId, workspaceId });
        results = await publishService.publishToAllPlatforms(postId, workspaceId);
        logger.info('Publish complete', { postId, workspaceId, results });
      } catch (bgError) {
        logger.error('Publish failed', { postId, workspaceId, error: bgError });
      }

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
  });
}