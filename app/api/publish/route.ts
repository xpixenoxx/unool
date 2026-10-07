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

      // Enqueue a background job in QStash for reliable long-running video uploads
      // This solves the Vercel maxDuration timeouts
      const { queueService } = await import('@/lib/services/QueueService');
      await queueService.enqueuePublishTask(postId, workspaceId);

      return NextResponse.json({
        success: true,
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