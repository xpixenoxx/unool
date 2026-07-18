import { NextRequest, NextResponse } from 'next/server';
import { ProfileExtractor, ExtractedProfile } from '@/lib/ai/ProfileExtractor';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { getCurrentUsage, checkLimit, getLimitsForTier, Tier } from '@/lib/limits/freeTier';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { cookies } from 'next/headers';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// Dev bypass: check if dev auth is enabled and cookie is present
const isDevAuthEnabled = config.NODE_ENV === 'development' || config.DEV_AUTH_BYPASS === true;
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    // Get userId and workspaceId from headers (added by middleware) or dev bypass
    let userId = request.headers.get('x-user-id');
    let workspaceId = request.headers.get('x-workspace-id');

    // Dev bypass fallback: check cookie directly
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

    // Check free tier AI token limit
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('plan_tier')
      .eq('id', workspaceId)
      .single();

    const tier = (workspace?.plan_tier as Tier) || 'free';
    const limits = getLimitsForTier(tier);
    const usage = await getCurrentUsage(supabase, workspaceId, userId);
    const limitResult = checkLimit('aiTokensPerMonth', usage, limits);

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'AI token limit exceeded', limit: limitResult },
        { status: 429 }
      );
    }

    logger.info('Profile extraction requested', { traceId, url, workspaceId });

    const result = await ProfileExtractor.extractFromUrl(url);

    if (!result.ok) {
      logger.error('Profile extraction failed', { traceId, error: result.error });
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    const extracted: ExtractedProfile = result.value;

    // Track AI usage (approximate tokens)
    const estimatedTokens = url.length + JSON.stringify(extracted).length;
    await trackAiUsage(workspaceId, userId, Math.ceil(estimatedTokens / 4), Math.ceil(estimatedTokens / 4), 'profile-extraction', config.AI_DEFAULT_MODEL);

    logger.info('Profile extraction completed', { traceId, workspaceId });

    return NextResponse.json({ profile: extracted });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Profile extraction API error', { traceId, error: err });
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}