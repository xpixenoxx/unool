import { NextResponse } from 'next/server';
import { getFeatureFlagsServer } from '@/lib/feature-flags-server';

export const dynamic = 'force-dynamic';

// GET /api/feature-flags — returns current feature flag values
export async function GET() {
  const flags = await getFeatureFlagsServer();
  return NextResponse.json(flags, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
