import { isAutomationEnabledServer } from '@/lib/feature-flags-server';
import { getPlanContext } from '@/lib/entitlements';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Formats the public comment prompt shown when In-DM Follow Gate is enabled,
 * honoring a creator's customized followAskMessage before falling back to default copy.
 */
export function formatFollowGatePublicAsk(
  customMessage: string | null | undefined,
  brandHandle: string
): string {
  const trimmed = customMessage?.trim();
  if (trimmed) {
    return trimmed.replace(/\{\{?handle\}?\}/gi, brandHandle);
  }
  return `👋 Follow ${brandHandle} then DM us "link" to unlock your access! 🚀`;
}

/**
 * Shared guard for In-DM Follow-to-Unlock automation across synchronous webhook
 * and asynchronous QStash worker paths:
 *  1. Respects admin global `automation_enabled` kill switch.
 *  2. Enforces monthly `ig_comments_per_month` quota (combined IG replies + follow-gate DMs).
 */
export async function checkFollowGateDmEligibility(
  workspaceId: string,
  userId?: string | null
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const globalEnabled = await isAutomationEnabledServer();
    if (!globalEnabled) {
      return { allowed: false, reason: 'Automation disabled by administrator' };
    }
  } catch (flagErr) {
    logger.warn('Failed to verify automation feature flag for follow gate', {
      workspaceId,
      error: flagErr,
    });
  }

  try {
    const planCtx = await getPlanContext(userId || '', workspaceId);
    if (planCtx && planCtx.planStatus && planCtx.planStatus !== 'active' && planCtx.planStatus !== 'trialing') {
      return { allowed: false, reason: `Workspace plan status is ${planCtx.planStatus}` };
    }

    const monthlyLimit = planCtx?.limits?.ig_comments_per_month;
    if (typeof monthlyLimit === 'number' && monthlyLimit >= 0) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthIso = monthStart.toISOString();

      let commentsUsed = 0;
      let dmGateUsed = 0;

      try {
        const { count } = await supabaseAdmin
          .from('instagram_comment_logs')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('auto_replied', true)
          .gte('created_at', monthIso);
        commentsUsed = count || 0;
      } catch {
        commentsUsed = 0;
      }

      try {
        const { count } = await supabaseAdmin
          .from('instagram_dm_logs')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('auto_replied', true)
          .in('follow_status', ['not_following', 'following'])
          .gte('created_at', monthIso);
        dmGateUsed = count || 0;
      } catch {
        dmGateUsed = 0;
      }

      if (commentsUsed + dmGateUsed >= monthlyLimit) {
        return {
          allowed: false,
          reason: `Monthly Instagram automation quota reached (${commentsUsed + dmGateUsed}/${monthlyLimit})`,
        };
      }
    }
  } catch (err) {
    logger.warn('Follow-gate eligibility quota check error', { workspaceId, error: err });
  }

  return { allowed: true };
}
