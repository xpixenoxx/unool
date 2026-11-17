import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { syncWorkspaceEngagement } from '@/lib/services/analytics/syncEngagement';
import { scheduleService } from '@/lib/services/ScheduleService';
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

  const shouldSync = request.nextUrl.searchParams.get('sync') === 'true';
  let syncSummary = null;

  // Non-blocking background self-heal & passive sync on standard view load
  if (!shouldSync) {
    try {
      const { after } = await import('next/server');
      if (typeof after === 'function') {
        after(async () => {
          try {
            await scheduleService.processDueScheduledPosts(workspaceId);
            await syncWorkspaceEngagement(workspaceId, { maxPosts: 35, forceRefresh: false });
          } catch {
            // Non-blocking background refresh
          }
        });
      }
    } catch {
      // Ignored outside Next request lifecycle (e.g. direct unit tests)
    }
  } else {
    try {
      syncSummary = await syncWorkspaceEngagement(workspaceId, {
        maxPosts: 50,
        forceRefresh: true,
      });
    } catch (err) {
      logger.warn('Signal manual sync failed cleanly', {
        workspaceId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    const filters = parseSignalFilterSearchParams(request.nextUrl.searchParams);
    const { analytics } = await loadWorkspaceSignalAnalytics(workspaceId, filters);

    return NextResponse.json({
      ...analytics,
      syncSummary: syncSummary
        ? {
            syncedCount: syncSummary.syncedCount,
            failedCount: syncSummary.failedCount,
            skippedCount: syncSummary.skippedCount,
            unsupportedCount: syncSummary.unsupportedCount,
            expiredTokenCount: syncSummary.expiredTokenCount,
            rateLimitedCount: syncSummary.rateLimitedCount,
            errors: syncSummary.errors.slice(0, 10),
          }
        : null,
    });
  } catch (err) {
    logger.error('Failed to compute Signal analytics', {
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to load Signal analytics' },
      { status: 500 }
    );
  }
}
