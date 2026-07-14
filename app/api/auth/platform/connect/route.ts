import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  const workspaceId = searchParams.get('workspaceId');
  const state = searchParams.get('state');

  if (!platform || !workspaceId || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=missing_params', request.url)
    );
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=unsupported_platform&platform=${platform}`, request.url)
    );
  }

  // Verify state matches stored value (in production, store in secure cookie or session)
  // For now, we'll use the state as a composite key
  const expectedState = `oauth_${workspaceId}_${platform}`;
  if (state !== expectedState) {
    logger.warn('OAuth state mismatch', { state, expected: expectedState });
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=invalid_state', request.url)
    );
  }

  const authUrl = adapter.getAuthUrl(state);
  return NextResponse.redirect(authUrl);
}