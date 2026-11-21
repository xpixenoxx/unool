import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Whop uses OIDC OAuth (`/api/auth/platform/connect?platform=whop`) rather than webhook credentials.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Whop uses OAuth authentication. Please connect via /api/auth/platform/connect?platform=whop.',
      oauthUrl: '/api/auth/platform/connect?platform=whop',
    },
    { status: 400 }
  );
}

