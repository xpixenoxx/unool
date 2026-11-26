import { NextRequest, NextResponse } from 'next/server';
import { resolveAndRecordTrackedClick } from '@/lib/services/automation/trackedLinks';

export const dynamic = 'force-dynamic';

/**
 * GET /go/[code]
 * Public tracked redirect endpoint for SignalDM links.
 * Records click telemetry, boosts contact Intent Score, cancels pending 3h nudges,
 * and issues a 302 redirect to the creator's destination URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { destinationUrl } = await resolveAndRecordTrackedClick(code, {
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });

  if (!destinationUrl) {
    return NextResponse.redirect(new URL('/', request.url), { status: 302 });
  }

  return NextResponse.redirect(destinationUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}
