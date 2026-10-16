import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import {
  InstagramCommentAutomation,
  DEFAULT_AUTOMATION_CONFIG,
  type CommentEvent,
  type AutomationConfig,
  type ClassifiedComment,
} from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { ContentHumanizer } from '@/lib/ai/engines/ContentHumanizer';
import { lexicalEntropyGuard } from '@/lib/services/automation/lexical';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

/**
 * POST /api/instagram/sync
 * Actively syncs comments from the user's recent Instagram posts, classifies new comments,
 * and posts automated replies. This ensures comments are handled even if Meta webhooks
 * are delayed or dropped due to app mode limitations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId');

    // 1. Verify caller access if user session is present
    try {
      const userClient = await createSupabaseServerClient();
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        if (!workspaceId) {
          const { data: m } = await supabase
            .from('workspace_memberships')
            .select('workspace_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();
          workspaceId = m?.workspace_id;
        } else {
          const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
          if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }
      }
    } catch {
      // Allow background sync / diagnostic caller if workspaceId is provided
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // 2. Fetch platform connection
    const { data: connections, error: connErr } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('status', 'connected');

    if (connErr || !connections || connections.length === 0) {
      return NextResponse.json({ error: 'No active Instagram connection found for this workspace' }, { status: 404 });
    }

    const connection = connections[0];
    let accessToken = await decryptToken(connection.access_token_encrypted);
    const brandUsername = (connection.username || '').toLowerCase().trim();

    // ── Token refresh: if token expires within 7 days, refresh proactively ──
    const connExpiresAt = connection.expires_at ? new Date(connection.expires_at) : null;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (connExpiresAt && (connExpiresAt.getTime() - Date.now() < sevenDaysMs)) {
      try {
        const { InstagramAdapter } = await import('@/lib/platforms/InstagramAdapter');
        const { encryptToken } = await import('@/lib/crypto/encryption');
        const adapter = new InstagramAdapter();
        const refreshed = await adapter.refreshAccessToken(accessToken);
        accessToken = refreshed.accessToken;
        const newExpiresAt = refreshed.expiresIn
          ? new Date(Date.now() + refreshed.expiresIn * 1000)
          : null;
        await supabase
          .from('platform_connections')
          .update({
            access_token_encrypted: await encryptToken(refreshed.accessToken),
            refresh_token_encrypted: await encryptToken(refreshed.accessToken),
            expires_at: newExpiresAt?.toISOString() ?? null,
            status: 'connected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);
        logger.info('Instagram token refreshed during sync', { connectionId: connection.id });
      } catch (refreshErr) {
        const refreshErrMsg = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
        logger.warn('Token refresh failed during sync — using existing token', { connectionId: connection.id, error: refreshErrMsg });
        if (connExpiresAt && connExpiresAt.getTime() < Date.now()) {
          await supabase
            .from('platform_connections')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', connection.id);
          return NextResponse.json({ ok: false, message: 'Instagram token expired — connection marked expired, please reconnect' });
        }
      }
    }

    // 3. Fetch automation config
    const { data: rawConfig } = await supabase
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    const automationConfig: AutomationConfig = rawConfig
      ? {
          enabled: rawConfig.enabled ?? true,
          autoReplyPositive: rawConfig.auto_reply_positive ?? true,
          autoReplyQuestions: rawConfig.auto_reply_questions ?? true,
          autoReplyLinkRequests: rawConfig.auto_reply_link_requests ?? true,
          autoReplyPurchaseIntent: rawConfig.auto_reply_purchase_intent ?? true,
          linkUrl: rawConfig.link_url,
          customInstructions: rawConfig.custom_instructions,
          brandPersona: rawConfig.brand_persona,
          flagNegative: rawConfig.flag_negative ?? true,
          flagSpam: rawConfig.flag_spam ?? true,
          maxRepliesPerHour: rawConfig.max_replies_per_hour ?? 30,
          jitterMinSeconds: rawConfig.jitter_min_seconds ?? 5,
          jitterMaxSeconds: rawConfig.jitter_max_seconds ?? 30,
          threadChainingEnabled: rawConfig.thread_chaining_enabled ?? true,
          dmTemplate: rawConfig.dm_template,
          autoHideSpam: rawConfig.auto_hide_spam ?? false,
          dmAutoReplyEnabled: rawConfig.dm_auto_reply_enabled ?? false,
          dmWelcomeMessage: rawConfig.dm_welcome_message,
          dmKnowledgeBase: rawConfig.dm_knowledge_base,
          dmEscalationEnabled: rawConfig.dm_escalation_enabled ?? false,
          dmMaxRepliesPerHour: rawConfig.dm_max_replies_per_hour ?? 20,
        }
      : DEFAULT_AUTOMATION_CONFIG;

    if (!automationConfig.enabled) {
      return NextResponse.json({ ok: false, message: 'Instagram automation is disabled for this workspace' });
    }

    const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ ok: false, message: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const automation = new InstagramCommentAutomation(groqApiKey);

    // 4. Fetch recent media from Instagram
    let mediaItems: Array<{ id: string; caption?: string }> = [];
    try {
      const mediaRes = await fetch(
        `https://graph.instagram.com/v20.0/me/media?fields=id,caption,timestamp&limit=5&access_token=${accessToken}`
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        mediaItems = mediaData.data || [];
      }
    } catch (e: any) {
      logger.error('Failed to fetch recent Instagram media for sync', { error: e.message });
    }

    let totalCommentsExamined = 0;
    let newCommentsProcessed = 0;
    let repliesPosted = 0;
    const processedComments: any[] = [];

    const recentReplies = await lexicalEntropyGuard.getRecentReplies(workspaceId, 15);

    // 5. For each media item, fetch and process comments
    for (const media of mediaItems) {
      let rawComments: any[] = [];

      // Query comments on the media
      try {
        let commentsRes = await fetch(
          `https://graph.instagram.com/v20.0/${media.id}/comments?fields=id,text,from{id,username},timestamp,parent_id&access_token=${accessToken}`
        );

        if (commentsRes.ok) {
          const cData = await commentsRes.json();
          rawComments = cData.data || [];
        }

        // If graph.instagram.com returns empty, try graph.facebook.com
        if (rawComments.length === 0) {
          const fbRes = await fetch(
            `https://graph.facebook.com/v20.0/${media.id}/comments?fields=id,text,from{id,username},timestamp,parent_id&access_token=${accessToken}`
          );
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            rawComments = fbData.data || [];
          }
        }
      } catch (err: any) {
        logger.warn('Failed to fetch comments for media during sync', { mediaId: media.id, error: err.message });
        continue;
      }

      totalCommentsExamined += rawComments.length;

      for (const item of rawComments) {
        const commentId = item.id;
        const commentText = item.text || '';
        const commenterUsername = (item.from?.username || '').toLowerCase().trim();
        const commenterIgScopedId = item.from?.id;

        // Skip if empty or already processed
        if (!commentId || !commentText) continue;

        // Skip comments made by brand account itself
        if (brandUsername && commenterUsername === brandUsername) continue;

        // Skip reply-to-reply comments
        if (item.parent_id) continue;

        // Check deduplication guard in database
        const { data: existing } = await supabase
          .from('instagram_comment_logs')
          .select('id')
          .eq('comment_id', commentId)
          .limit(1);

        if (existing && existing.length > 0) {
          continue; // Already processed
        }

        // Validate with ContentGuard
        const guardResult = ContentGuard.validateComment(commentText);
        if (!guardResult.safe && guardResult.violation.level === 'blocked') {
          await supabase.from('instagram_comment_logs').upsert({
            workspace_id: workspaceId,
            comment_id: commentId,
            media_id: media.id,
            comment_text: commentText,
            commenter_username: item.from?.username || commenterUsername,
            classification: 'harmful',
            confidence: 1,
            suggested_reply: 'SKIP',
            auto_replied: false,
            flagged_for_review: true,
            reasoning: guardResult.violation.internal || guardResult.violation.message,
            lead_score: 0,
            dm_sent: false,
          }, { onConflict: 'comment_id', ignoreDuplicates: true });
          continue;
        }

        // Classify with AI
        const commentEvent: CommentEvent = {
          commentId,
          mediaId: media.id,
          text: commentText,
          username: item.from?.username || commenterUsername,
          timestamp: item.timestamp || new Date().toISOString(),
        };

        const result: ClassifiedComment = await automation.classifyAndGenerateReply(
          commentEvent,
          media.caption || '',
          automationConfig,
          recentReplies
        );

        let finalReply = result.suggestedReply;
        if (result.shouldAutoReply && finalReply && finalReply !== 'SKIP') {
          try {
            finalReply = ContentHumanizer.humanize(finalReply, 'instagram').humanized || finalReply;
          } catch {}
        }

        let didReply = false;
        // Post reply if automation allows
        if (result.shouldAutoReply && finalReply && finalReply !== 'SKIP') {
          const replyResult = await automation.postPublicReply(
            accessToken,
            media.id,
            commentId,
            finalReply
          );

          if (replyResult) {
            didReply = true;
            repliesPosted++;
            await velocityThrottle.recordReply(workspaceId);
            lexicalEntropyGuard.recordReply(workspaceId, finalReply);
            logger.info('Auto-reply posted via comment sync', { commentId, replyId: replyResult.replyId });
          }
        }

        // Log comment into database
        await supabase.from('instagram_comment_logs').upsert({
          workspace_id: workspaceId,
          comment_id: commentId,
          media_id: media.id,
          comment_text: commentText,
          commenter_username: item.from?.username || commenterUsername,
          classification: result.classification,
          confidence: result.confidence,
          suggested_reply: finalReply,
          auto_replied: didReply,
          flagged_for_review: result.shouldFlagForReview,
          reasoning: result.reasoning + ' (Live sync)',
          lead_score: result.leadScore,
          dm_sent: false,
          dm_message: result.suggestedDM,
          thread_hook: result.threadHook,
        }, { onConflict: 'comment_id', ignoreDuplicates: true });

        // Optional DM sending for link requests
        if (result.shouldSendDM && automationConfig.linkUrl && commenterIgScopedId) {
          const dmText = result.suggestedDM || `Hey @${commentEvent.username}! Here's the link: ${automationConfig.linkUrl}`;
          const dmRes = await automation.sendPrivateMessage(accessToken, connection.platform_user_id, commenterIgScopedId, dmText);
          if (dmRes) {
            await supabase
              .from('instagram_comment_logs')
              .update({ dm_sent: true })
              .eq('comment_id', commentId);
          }
        }

        // autoHideSpam: hide spam comments if enabled
        if (
          result.classification === 'spam' &&
          automationConfig.autoHideSpam &&
          commentId &&
          !commentId.startsWith('test_')
        ) {
          try {
            const hideParams = new URLSearchParams({ hide: 'true', access_token: accessToken });
            const hideRes = await fetch(
              `https://graph.facebook.com/v20.0/${commentId}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: hideParams.toString(),
              }
            );
            if (hideRes.ok) {
              logger.info('Spam comment hidden during sync', { commentId });
            } else {
              logger.warn('Failed to hide spam comment during sync', { commentId, error: await hideRes.text() });
            }
          } catch (hideErr) {
            logger.warn('Error hiding spam comment during sync', { commentId, error: hideErr });
          }
        }

        newCommentsProcessed++;
        processedComments.push({
          commentId,
          user: commenterUsername,
          text: commentText,
          classification: result.classification,
          reply: finalReply,
          autoReplied: didReply,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      workspaceId,
      mediaCount: mediaItems.length,
      totalCommentsExamined,
      newCommentsProcessed,
      repliesPosted,
      processedComments,
    });
  } catch (error: any) {
    logger.error('Error during Instagram comments sync', { error });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
