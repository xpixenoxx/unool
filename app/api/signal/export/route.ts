import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { enforcePlanLimits } from '@/lib/plan-enforcement';
import { serializeSignalPostsToCsv } from '@/lib/analytics/signalEngine';
import {
  loadWorkspaceSignalAnalytics,
  parseSignalFilterSearchParams,
} from '@/lib/analytics/signalDataLoader';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestedWorkspaceId = request.nextUrl.searchParams.get('workspaceId');
  let workspaceId = auth.workspaceId;

  if (requestedWorkspaceId && requestedWorkspaceId !== auth.workspaceId) {
    const allowed = await verifyWorkspaceAccess(auth.userId, requestedWorkspaceId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    workspaceId = requestedWorkspaceId;
  }

  // Enforce workspace CSV export entitlement from lib/billing/plans.ts (`csv_export`)
  const entitlement = await enforcePlanLimits(workspaceId, 'csv_export');
  if (!entitlement.allowed) {
    return NextResponse.json(
      {
        error:
          entitlement.checks?.csv_export?.message ||
          'CSV export requires a Pro or Studio plan.',
        code: 'PLAN_LIMIT_EXCEEDED',
        plan: entitlement.workspacePlan.planName,
        upgradeUrl: '/dashboard/billing',
      },
      { status: 403 }
    );
  }

  try {
    const filters = parseSignalFilterSearchParams(request.nextUrl.searchParams);
    const { analytics } = await loadWorkspaceSignalAnalytics(workspaceId, filters, 500);
    const csv = serializeSignalPostsToCsv(analytics);
    const dateStamp = new Date().toISOString().split('T')[0];
    const safeRange = analytics.meta.effectiveRange.replace(/[^a-z0-9]/gi, '');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="unool-signal-${safeRange}-${dateStamp}.csv"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    logger.error('Signal CSV export failed', {
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to export Signal analytics' },
      { status: 500 }
    );
  }
}
