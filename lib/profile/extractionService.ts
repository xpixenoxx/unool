import { NextRequest, NextResponse } from 'next/server';
import { ProfileExtractor, ExtractedProfile } from '@/lib/ai/ProfileExtractor';
import { quickUrlValidation } from '@/lib/utils/url-validation';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

export async function handleProfileExtractionRequest(
  request: NextRequest,
  context: { userId: string; workspaceId: string },
  options: { deprecated?: boolean } = {}
): Promise<NextResponse> {
  const traceId = crypto.randomUUID();
  const { userId, workspaceId } = context;

  try {
    const body = await request.json().catch(() => null);
    const rawUrl = typeof body?.url === 'string'
      ? body.url.trim()
      : typeof body?.sourceUrl === 'string'
        ? body.sourceUrl.trim()
        : '';

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const urlWithProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const quickCheck = quickUrlValidation(urlWithProtocol);
    if (!quickCheck.allowed) {
      return NextResponse.json(
        { error: quickCheck.reason || 'URL is not allowed' },
        { status: 400 }
      );
    }

    logger.info('Profile extraction requested', {
      traceId,
      url: urlWithProtocol,
      workspaceId,
      deprecatedEndpoint: Boolean(options.deprecated),
    });

    const result = await ProfileExtractor.extractFromUrl(urlWithProtocol);

    if (!result.ok) {
      logger.warn('Profile extraction failed', { traceId, error: result.error });
      const msg = result.error.message || 'Extraction failed';
      const status = msg.startsWith('Invalid URL:') || msg.includes('SSRF') ? 400 : 422;
      return NextResponse.json({ error: msg }, { status });
    }

    const extracted: ExtractedProfile = result.value;
    const estimatedTokens = urlWithProtocol.length + JSON.stringify(extracted).length;
    await trackAiUsage(
      workspaceId,
      userId,
      Math.ceil(estimatedTokens / 4),
      Math.ceil(estimatedTokens / 4),
      'profile-extraction',
      config.AI_DEFAULT_MODEL
    );

    const response = NextResponse.json({ profile: extracted });
    if (options.deprecated) {
      response.headers.set('Deprecation', 'true');
      response.headers.set('X-Deprecated-Endpoint', 'Use /api/profile/extract');
    }
    return response;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Profile extraction API error', { traceId, error: err });
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
