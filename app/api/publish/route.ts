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

      const results = await publishService.publishToAllPlatforms(postId, workspaceId);

      const hasAnySuccess = Object.values(results).some((r: any) => r.success);
      
      if (!hasAnySuccess && Object.keys(results).length > 0) {
        const errors = Object.entries(results).map(([platform, res]: [string, any]) => `${platform}: ${res.error}`).join(', ');
        logger.error('Publish job failed entirely', { postId, workspaceId, errors });
        return NextResponse.json({ 
          success: false, 
          error: `Publish failed: ${errors}`, 
          results 
        }, { status: 500 });
      }

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
  });
}