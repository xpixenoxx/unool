import { NextRequest, NextResponse } from 'next/server';
import { ProfileExtractor, ExtractedProfile } from '@/lib/ai/ProfileExtractor';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { withPlanEnforcement } from '@/lib/middleware/plan-enforcement';


async function handleGenerate(request: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    const userId = request.headers.get('x-user-id');
    const workspaceId = request.headers.get('x-workspace-id');


    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    logger.info('Profile autofill generation requested', { traceId, url, workspaceId });

    const result = await ProfileExtractor.extractFromUrl(url);

    if (!result.ok) {
      logger.error('Profile extraction failed', { traceId, error: result.error });
      return NextResponse.json(
        { error: result.error.message || 'Failed to extract profile' },
        { status: 500 }
      );
    }

    const extracted: ExtractedProfile = result.value;

    const estimatedTokens = url.length + JSON.stringify(extracted).length;
    await trackAiUsage(workspaceId, userId, Math.ceil(estimatedTokens / 4), Math.ceil(estimatedTokens / 4), 'profile-extraction', config.AI_DEFAULT_MODEL);

    logger.info('Profile extraction completed successfully', { traceId, workspaceId });

    return NextResponse.json({ profile: extracted });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Profile generate API error', { traceId, error: err });
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}

export const POST = withPlanEnforcement(handleGenerate, { action: 'use_ai' });
