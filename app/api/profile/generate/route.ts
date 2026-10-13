import { NextRequest, NextResponse } from 'next/server';
import { ProfileExtractor, ExtractedProfile } from '@/lib/ai/ProfileExtractor';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { cookies } from 'next/headers';
import { withPlanEnforcement } from '@/lib/middleware/plan-enforcement';

const isDevAuthEnabled = config.NODE_ENV === 'development' || config.DEV_AUTH_BYPASS === true;
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

async function handleGenerate(request: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    let userId = request.headers.get('x-user-id');
    let workspaceId = request.headers.get('x-workspace-id');

    if ((!userId || !workspaceId) && isDevAuthEnabled) {
      const cookieStore = await cookies();
      const devBypassCookie = cookieStore.get('dev-auth-bypass') || cookieStore.get(`sb-${config.SUPABASE_PROJECT_ID || 'local'}-auth-token`);
      if (devBypassCookie) {
        userId = DEV_USER_ID;
        workspaceId = DEV_WORKSPACE_ID;
      }
    }

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
