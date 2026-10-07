import { NextRequest, NextResponse } from 'next/server';
import { publishService } from '@/lib/services/PublishService';
import { logger } from '@/lib/logger';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

export const maxDuration = 300; // 5 minutes max for background publishing

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, workspaceId } = body;

    if (!postId || !workspaceId) {
      logger.error('Invalid QStash payload: missing postId or workspaceId');
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    logger.info('QStash background publish executing', { postId, workspaceId });
    await publishService.publishToAllPlatforms(postId, workspaceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('QStash background publish failed', { error: err });
    
    // Returning a 500 will tell QStash to retry the job according to the queue's retry policy
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

// Wrap the handler with the verifySignature middleware provided by Upstash.
// This ensures that only QStash can trigger this route!
export const POST = verifySignatureAppRouter(handler);
