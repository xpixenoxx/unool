import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/crypto/encryption';
import { API_VERSIONS, resolveInstagramApiHost } from '@/lib/platforms/apiVersions';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { matchCampaignWaterfall, type InstagramCampaign } from '@/lib/services/automation/campaignMatcher';
import { executeMatchedCampaign } from '@/lib/services/automation/campaignExecutor';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/instagram/campaigns/[id]/backfill
 * Retroactively scans comments from the last 7 days (Meta's Private Reply window)
 * on the campaign's bound media (or recent IG posts if global) and sends DMs to
 * matching commenters who haven't been replied to yet.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || auth.workspaceId;
    const dryRun = Boolean(body.dryRun);
    const maxToSend = Math.max(1, Math.min(30, Number(body.maxToSend || 15)));

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [{ data: campaign }, { data: connections }] = await Promise.all([
      supabaseAdmin
        .from('instagram_campaigns')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .single(),
      supabaseAdmin
        .from('platform_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'instagram')
        .eq('status', 'connected')
        .limit(1),
    ]);

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    const conn = connections?.[0];
    if (!conn) return NextResponse.json({ error: 'No connected Instagram account' }, { status: 400 });

    const accessToken = await decryptToken(conn.access_token_encrypted);
    const apiHost = resolveInstagramApiHost(accessToken);
    const apiVersion = API_VERSIONS.instagram;
    const targetMediaIds: string[] = [];

    if (campaign.media_id) {
      targetMediaIds.push(campaign.media_id);
    } else {
      const targetUser = apiHost.includes('graph.instagram.com') ? 'me' : conn.platform_user_id;
      const mediaRes = await fetch(
        `${apiHost}/${apiVersion}/${targetUser}/media?fields=id&limit=10&access_token=${encodeURIComponent(accessToken)}`
      );
      if (mediaRes.ok) {
        const mediaJson = (await mediaRes.json()) as { data?: Array<{ id: string }> };
        for (const m of mediaJson.data || []) {
          if (m.id) targetMediaIds.push(m.id);
        }
      }
    }

    const sevenDaysMs = (6 * 24 + 23) * 60 * 60 * 1000;
    const nowMs = Date.now();
    const automation = new InstagramCommentAutomation(config.GROQ_API_KEY || process.env.GROQ_API_KEY || '');

    let scanned = 0;
    let matchedCount = 0;
    let sentCount = 0;
    let skippedAlreadyReplied = 0;
    const sampleMatches: Array<{ commentId: string; username: string; text: string }> = [];

    for (const mediaId of targetMediaIds) {
      const commentsRes = await fetch(
        `${apiHost}/${apiVersion}/${mediaId}/comments?fields=id,text,username,timestamp,from&limit=50&access_token=${encodeURIComponent(accessToken)}`
      );
      if (!commentsRes.ok) continue;
      const commentsJson = (await commentsRes.json()) as { data?: Array<Record<string, any>> };

      for (const c of commentsJson.data || []) {
        scanned++;
        const commentId = String(c.id || '');
        const text = String(c.text || '');
        const username = String(c.username || c.from?.username || '');
        const fromId = c.from?.id ? String(c.from.id) : null;
        if (!commentId || !text) continue;

        // Skip self comments
        if (
          (conn.username && username.toLowerCase() === conn.username.toLowerCase()) ||
          (fromId && fromId === conn.platform_user_id)
        ) {
          continue;
        }

        // Enforce Meta's 7-day Private Reply eligibility window
        if (c.timestamp && nowMs - Date.parse(c.timestamp) > sevenDaysMs) continue;

        const match = matchCampaignWaterfall([campaign as InstagramCampaign], {
          surface: 'comment',
          text,
          mediaId,
        });
        if (!match) continue;

        // Check if already replied
        const { data: existingLog } = await supabaseAdmin
          .from('instagram_comment_logs')
          .select('id, auto_replied, dm_sent')
          .eq('comment_id', commentId)
          .maybeSingle();

        if (existingLog?.auto_replied || existingLog?.dm_sent) {
          skippedAlreadyReplied++;
          continue;
        }

        matchedCount++;
        if (sampleMatches.length < 10) {
          sampleMatches.push({ commentId, username, text: text.slice(0, 120) });
        }

        if (!dryRun && sentCount < maxToSend) {
          const execRes = await executeMatchedCampaign({
            workspaceId,
            connectionId: conn.id,
            igUserId: conn.platform_user_id,
            brandUsername: conn.username || 'creator',
            accessToken,
            automation,
            campaign: campaign as InstagramCampaign,
            surface: 'comment',
            triggerEventId: commentId,
            mediaId,
            platformUserId: fromId,
            username,
            inboundText: text,
          });
          if (execRes.dmSent || execRes.publicReplySent) {
            sentCount++;
            await supabaseAdmin.from('instagram_comment_logs').upsert(
              {
                workspace_id: workspaceId,
                comment_id: commentId,
                media_id: mediaId,
                comment_text: text,
                commenter_username: username,
                classification: 'link_request',
                confidence: 1.0,
                suggested_reply: execRes.publicReplyText || '',
                auto_replied: execRes.publicReplySent,
                dm_sent: execRes.dmSent,
                dm_message: execRes.dmText || null,
                campaign_id: campaign.id,
                trigger_surface: 'comment',
                reasoning: `7-day backfill matched campaign "${campaign.name}"`,
                lead_score: 2,
              },
              { onConflict: 'comment_id' }
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      scanned,
      matchedCount,
      sentCount,
      skippedAlreadyReplied,
      sampleMatches,
    });
  } catch (error) {
    logger.error('POST /api/instagram/campaigns/[id]/backfill error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 });
  }
}
