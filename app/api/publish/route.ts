import { NextRequest, NextResponse } from 'next/server';
import { publishService } from '@/lib/services/PublishService';
import { logger } from '@/lib/logger';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';

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

      // We use Next.js 15 after() to run the publishing in the background
      // This prevents Vercel Serverless Functions from timing out.
      const { after } = await import('next/server');

      after(async () => {
        try {
          logger.info('Background publish starting', { postId, workspaceId });
          await publishService.publishToAllPlatforms(postId, workspaceId);
        } catch (bgError) {
          logger.error('Background publish failed', { postId, workspaceId, error: bgError });
        }
      });

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