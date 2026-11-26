import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type NotificationType =
  | 'vip_dm'
  | 'hot_lead'
  | 'surge_alert'
  | 'health_alert'
  | 'daily_digest';

export const MAX_REALTIME_PINGS_PER_DAY = 3;

export function isInQuietHours(
  quietStart = '22:00',
  quietEnd = '08:00',
  timezone = 'UTC',
  now: Date = new Date()
): boolean {
  const parseMin = (t: string) => {
    const [h, m] = t.split(':').map((n) => parseInt(n, 10));
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0;
  };
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
    const min = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const cur = hour * 60 + min;
    const start = parseMin(quietStart);
    const end = parseMin(quietEnd);
    if (start <= end) return cur >= start && cur < end;
    return cur >= start || cur < end;
  } catch {
    return false;
  }
}

/**
 * Enforces the creator's calm Notification Budget:
 * - Maximum 3 real-time alerts per workspace per rolling 24h window.
 * - Suppresses alerts during quiet hours (22:00-08:00) EXCEPT `vip_dm` and `health_alert`.
 * - Deduplicates via `dedupKey`.
 */
export async function recordBudgetedNotification(params: {
  workspaceId: string;
  type: NotificationType;
  title: string;
  body?: string;
  dedupKey?: string;
  channel?: 'in_app' | 'email';
  quietStart?: string;
  quietEnd?: string;
  timezone?: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  const { workspaceId, type, title, body, dedupKey, channel = 'in_app' } = params;

  const isUrgentBypass = type === 'vip_dm' || type === 'health_alert' || type === 'daily_digest';
  if (!isUrgentBypass && isInQuietHours(params.quietStart, params.quietEnd, params.timezone)) {
    return { allowed: false, reason: 'quiet_hours' };
  }

  try {
    if (type !== 'daily_digest') {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from('automation_notification_log')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .neq('notification_type', 'daily_digest')
        .gte('created_at', since24h);

      if ((count ?? 0) >= MAX_REALTIME_PINGS_PER_DAY && type !== 'health_alert') {
        return { allowed: false, reason: 'daily_budget_reached' };
      }
    }

    const { error } = await supabaseAdmin.from('automation_notification_log').insert({
      workspace_id: workspaceId,
      notification_type: type,
      dedup_key: dedupKey || null,
      title: title.slice(0, 160),
      body: body ? body.slice(0, 500) : null,
      channel,
    });

    if (error) {
      // Unique dedup violation means already sent
      if (error.code === '23505') {
        return { allowed: false, reason: 'deduplicated' };
      }
      return { allowed: false, reason: error.message };
    }
    return { allowed: true };
  } catch (err) {
    logger.debug('recordBudgetedNotification degraded cleanly', {
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { allowed: false, reason: 'unavailable' };
  }
}
