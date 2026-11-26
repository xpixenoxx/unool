import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { loadTodayIntelligence } from '@/lib/services/automation/todayIntelligence';
import { recordBudgetedNotification } from '@/lib/services/automation/notificationBudget';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/daily-wins-digest
 * Morning "While You Slept" SignalDM Wins Digest via Resend.
 * Protected by CRON_SECRET bearer header.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resendKey = config.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY not configured' });
  }

  try {
    const { data: configs } = await supabaseAdmin
      .from('instagram_automation_config')
      .select('workspace_id, daily_digest_enabled, daily_digest_hour')
      .eq('enabled', true)
      .eq('daily_digest_enabled', true)
      .limit(200);

    const eligible = Array.isArray(configs) ? configs : [];
    const todayDate = new Date().toISOString().slice(0, 10);
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    const appUrl = (config.NEXT_PUBLIC_APP_URL || 'https://unool.co').replace(/\/+$/, '');

    let sent = 0;
    let skipped = 0;

    for (const row of eligible) {
      const workspaceId = row.workspace_id;
      const intel = await loadTodayIntelligence(workspaceId);
      const totalActivity =
        intel.todayPulse.repliesSentToday +
        intel.todayPulse.dmsSentToday +
        intel.todayPulse.leadsCapturedToday +
        intel.todayPulse.clicksToday;

      // Never spam creators with an empty 0-activity email
      if (totalActivity === 0 && intel.expiringHotLeads.length === 0) {
        skipped++;
        continue;
      }

      const { data: ws } = await supabaseAdmin
        .from('workspaces')
        .select('name, owner_id')
        .eq('id', workspaceId)
        .maybeSingle();
      if (!ws?.owner_id) {
        skipped++;
        continue;
      }

      const { data: owner } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', ws.owner_id)
        .maybeSingle();
      if (!owner?.email) {
        skipped++;
        continue;
      }

      const budget = await recordBudgetedNotification({
        workspaceId,
        type: 'daily_digest',
        title: `While You Slept — ${intel.todayPulse.leadsCapturedToday} leads & ${intel.todayPulse.dmsSentToday} DMs`,
        dedupKey: `daily_digest:${todayDate}`,
        channel: 'email',
      });
      if (!budget.allowed) {
        skipped++;
        continue;
      }

      const topAction = intel.nextBestActions[0];
      await resend.emails.send({
        from: 'Unool SignalDM <digest@unool.co>',
        to: owner.email,
        subject: `While you slept: ${intel.todayPulse.dmsSentToday} DMs, ${intel.todayPulse.leadsCapturedToday} leads captured`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:24px;background:#FAF7F2;color:#3D2B1F;border-radius:16px">
          <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8B7355;margin:0 0 8px">Unool Daily SignalDM Brief</p>
          <h2 style="margin:0 0 16px">Good morning${owner.name ? `, ${owner.name}` : ''}</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr>
              <td style="padding:12px;background:#fff;border:1px solid #E4D9C8;border-radius:10px"><strong>${intel.todayPulse.repliesSentToday + intel.todayPulse.dmsSentToday}</strong><br/><span style="font-size:12px;color:#6E5A48">Replies & DMs</span></td>
              <td style="padding:12px;background:#fff;border:1px solid #E4D9C8;border-radius:10px"><strong>${intel.todayPulse.leadsCapturedToday}</strong><br/><span style="font-size:12px;color:#6E5A48">Leads Captured</span></td>
              <td style="padding:12px;background:#fff;border:1px solid #E4D9C8;border-radius:10px"><strong>${intel.todayPulse.clicksToday}</strong><br/><span style="font-size:12px;color:#6E5A48">Link Clicks</span></td>
            </tr>
          </table>
          ${
            intel.expiringHotLeads.length > 0
              ? `<p style="padding:12px;background:#FEF3C7;border-radius:10px;color:#92400E"><strong>${intel.expiringHotLeads.length} hot lead(s)</strong> have less than 8 hours left in Meta's 24h DM reply window.</p>`
              : ''
          }
          ${
            topAction
              ? `<p><strong>Top Next Action:</strong> ${topAction.title} — ${topAction.subtitle}</p>`
              : ''
          }
          <p style="margin-top:20px"><a href="${appUrl}/dashboard/automation" style="display:inline-block;padding:12px 20px;background:#3D2B1F;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Open Command Center</a></p>
        </div>`,
      });
      sent++;
    }

    return NextResponse.json({ success: true, checked: eligible.length, sent, skipped });
  } catch (error) {
    logger.error('GET /api/cron/daily-wins-digest error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Digest run failed' }, { status: 500 });
  }
}
