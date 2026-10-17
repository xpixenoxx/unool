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

    // ── Step-by-step diagnostic log ──────────────────────────────────────
    const diagnostics: Array<{ step: string; status: string; detail?: string }> = [];

    // Step 0: Connection info
    diagnostics.push({
      step: 'connection',
      status: 'ok',
      detail: `username=${connection.username}, platformUserId=${connection.platform_user_id}, expiresAt=${connection.expires_at || 'none'}`,
    });

    // Verify token is valid by calling /me
    let metaProfile: any = null;
    try {
      const profileRes = await fetch(
        `https://graph.instagram.com/v20.0/me?fields=id,username,name,account_type&access_token=${accessToken}`
      );
      if (profileRes.ok) {
        metaProfile = await profileRes.json();
        diagnostics.push({
          step: 'token_check',
          status: 'ok',
          detail: `id=${metaProfile.id}, username=${metaProfile.username}, account_type=${metaProfile.account_type || 'unknown'}`,
        });
      } else {
        const errText = await profileRes.text();
        diagnostics.push({
          step: 'token_check',
          status: 'error',
          detail: `HTTP ${profileRes.status}: ${errText.substring(0, 300)}`,
        });
        // Token is bad — return immediately with diagnostics
        return NextResponse.json({
          ok: false,
          message: 'Instagram access token is invalid or expired. Please reconnect Instagram in Settings.',
          diagnostics,
        });
      }
    } catch (e: any) {
      diagnostics.push({ step: 'token_check', status: 'error', detail: e.message });
      return NextResponse.json({ ok: false, message: 'Network error checking token', diagnostics });
    }

    // Check webhook subscriptions
    try {
      const subRes = await fetch(
        `https://graph.instagram.com/v20.0/${connection.platform_user_id}/subscribed_apps?access_token=${accessToken}`
      );
      if (subRes.ok) {
        const subData = await subRes.json();
        const fields = subData.data?.[0]?.subscribed_fields || [];
        diagnostics.push({
          step: 'webhook_subscription',
          status: fields.length > 0 ? 'ok' : 'warning',
          detail: fields.length > 0 ? `subscribed_fields: ${fields.join(', ')}` : 'No webhook subscriptions found — subscribing now...',
        });
      } else {
        diagnostics.push({ step: 'webhook_subscription', status: 'warning', detail: 'Could not query subscribed_apps' });
      }
    } catch {
      diagnostics.push({ step: 'webhook_subscription', status: 'warning', detail: 'Network error checking subscriptions' });
    }

    // Proactively ensure the Instagram account is subscribed to comments & messages webhooks
    if (connection.platform_user_id) {
      InstagramCommentAutomation.subscribeAccountToWebhook(accessToken, connection.platform_user_id)
        .catch((subErr) => logger.warn('Background webhook subscribe failed in sync', { error: subErr }));
    }

    // 4. Fetch recent media from Instagram with robust multi-endpoint fallbacks and pagination
    let mediaItems: Array<{ id: string; caption?: string; timestamp?: string; comments_count?: number }> = [];
    const fetchLimit = 100;
    let mediaSource = '';

    // Endpoint A: graph.instagram.com/v20.0/me/media
    try {
      let nextUrl: string | null = `https://graph.instagram.com/v20.0/me/media?fields=id,caption,timestamp,comments_count,media_type&limit=${fetchLimit}&access_token=${accessToken}`;
      let pageCount = 0;
      while (nextUrl && pageCount < 3) {
        pageCount++;
        const mediaRes: Response = await fetch(nextUrl);
        if (mediaRes.ok) {
          const mediaData: any = await mediaRes.json();
          const items = mediaData.data || [];
          mediaItems = mediaItems.concat(items);
          if (mediaItems.length > 0 && !mediaSource) mediaSource = 'graph.instagram.com/me/media';
          nextUrl = mediaData.paging?.next || null;
        } else {
          const errText = await mediaRes.text();
          diagnostics.push({
            step: 'fetch_media_A',
            status: 'error',
            detail: `HTTP ${mediaRes.status}: ${errText.substring(0, 200)}`,
          });
          break;
        }
      }
      if (mediaItems.length > 0) {
        diagnostics.push({
          step: 'fetch_media_A',
          status: 'ok',
          detail: `graph.instagram.com/me/media → ${mediaItems.length} posts retrieved across ${pageCount} page(s)`,
        });
      }
    } catch (e: any) {
      diagnostics.push({ step: 'fetch_media_A', status: 'error', detail: e.message });
    }

    // Endpoint B: graph.facebook.com/v20.0/{platform_user_id}/media
    if (mediaItems.length === 0 && connection.platform_user_id) {
      try {
        let nextUrl: string | null = `https://graph.facebook.com/v20.0/${connection.platform_user_id}/media?fields=id,caption,timestamp,comments_count,media_type&limit=${fetchLimit}&access_token=${accessToken}`;
        let pageCount = 0;
        while (nextUrl && pageCount < 3) {
          pageCount++;
          const fbRes: Response = await fetch(nextUrl);
          if (fbRes.ok) {
            const fbData: any = await fbRes.json();
            const items = fbData.data || [];
            mediaItems = mediaItems.concat(items);
            if (mediaItems.length > 0 && !mediaSource) mediaSource = 'graph.facebook.com/{id}/media';
            nextUrl = fbData.paging?.next || null;
          } else {
            const fbErr = await fbRes.text();
            diagnostics.push({
              step: 'fetch_media_B',
              status: 'error',
              detail: `HTTP ${fbRes.status}: ${fbErr.substring(0, 200)}`,
            });
            break;
          }
        }
        if (mediaItems.length > 0) {
          diagnostics.push({
            step: 'fetch_media_B',
            status: 'ok',
            detail: `graph.facebook.com/${connection.platform_user_id}/media → ${mediaItems.length} posts retrieved`,
          });
        }
      } catch (e: any) {
        diagnostics.push({ step: 'fetch_media_B', status: 'error', detail: e.message });
      }
    }

    // Endpoint C: graph.instagram.com/v20.0/{platform_user_id}/media
    if (mediaItems.length === 0 && connection.platform_user_id) {
      try {
        const igUserRes = await fetch(
          `https://graph.instagram.com/v20.0/${connection.platform_user_id}/media?fields=id,caption,timestamp,comments_count,media_type&limit=${fetchLimit}&access_token=${accessToken}`
        );
        if (igUserRes.ok) {
          const igUserData = await igUserRes.json();
          mediaItems = igUserData.data || [];
          if (mediaItems.length > 0) mediaSource = 'graph.instagram.com/{id}/media';
          diagnostics.push({
            step: 'fetch_media_C',
            status: mediaItems.length > 0 ? 'ok' : 'empty',
            detail: `graph.instagram.com/${connection.platform_user_id}/media → ${mediaItems.length} posts`,
          });
        } else {
          const igErr = await igUserRes.text();
          diagnostics.push({
            step: 'fetch_media_C',
            status: 'error',
            detail: `HTTP ${igUserRes.status}: ${igErr.substring(0, 200)}`,
          });
        }
      } catch (e: any) {
        diagnostics.push({ step: 'fetch_media_C', status: 'error', detail: e.message });
      }
    }

    // Endpoint D: graph.facebook.com/v20.0/me/media
    if (mediaItems.length === 0) {
      try {
        const fbMeRes = await fetch(
          `https://graph.facebook.com/v20.0/me/media?fields=id,caption,timestamp,comments_count,media_type&limit=${fetchLimit}&access_token=${accessToken}`
        );
        if (fbMeRes.ok) {
          const fbMeData = await fbMeRes.json();
          mediaItems = fbMeData.data || [];
          if (mediaItems.length > 0) mediaSource = 'graph.facebook.com/me/media';
          diagnostics.push({
            step: 'fetch_media_D',
            status: mediaItems.length > 0 ? 'ok' : 'empty',
            detail: `graph.facebook.com/me/media → ${mediaItems.length} posts`,
          });
        } else {
          const fbMeErr = await fbMeRes.text();
          diagnostics.push({
            step: 'fetch_media_D',
            status: 'error',
            detail: `HTTP ${fbMeRes.status}: ${fbMeErr.substring(0, 200)}`,
          });
        }
      } catch (e: any) {
        diagnostics.push({ step: 'fetch_media_D', status: 'error', detail: e.message });
      }
    }

    diagnostics.push({
      step: 'media_summary',
      status: mediaItems.length > 0 ? 'ok' : 'error',
      detail: mediaItems.length > 0
        ? `Found ${mediaItems.length} posts via ${mediaSource}`
        : 'ALL media endpoints returned 0 posts — token may lack instagram_business_basic scope or account is not Professional',
    });

    let totalCommentsExamined = 0;
    let newCommentsProcessed = 0;
    let repliesPosted = 0;
    const processedComments: any[] = [];

    const recentReplies = await lexicalEntropyGuard.getRecentReplies(workspaceId, 15);

    // 5. For each media item, fetch and process comments
    for (const media of mediaItems) {
      let rawComments: any[] = [];

      // Query comments on the media
      // In Meta Graph API v20+:
      // - Standard fields on InstagramComment are: id, text, username, timestamp, replies
      // - Requesting `from` or `parent_id` on the comment node causes Error #100 (nonexistent field).
      // - Replies are retrieved via the `replies{id,text,username,timestamp}` edge.
      try {
        // Attempt 1: graph.facebook.com with comments + nested replies
        let commentsRes = await fetch(
          `https://graph.facebook.com/v20.0/${media.id}/comments?fields=id,text,username,timestamp,replies{id,text,username,timestamp}&access_token=${accessToken}`
        );

        if (commentsRes.ok) {
          const cData = await commentsRes.json();
          const items = cData.data || [];
          for (const item of items) {
            rawComments.push(item);
            if (item.replies?.data && Array.isArray(item.replies.data)) {
              for (const reply of item.replies.data) {
                rawComments.push({ ...reply, parent_id: item.id });
              }
            }
          }
        } else {
          // Attempt 2: Minimal fields on graph.facebook.com if replies edge fails
          const minimalFbRes = await fetch(
            `https://graph.facebook.com/v20.0/${media.id}/comments?fields=id,text,username,timestamp&access_token=${accessToken}`
          );
          if (minimalFbRes.ok) {
            const minFbData = await minimalFbRes.json();
            rawComments = minFbData.data || [];
          } else {
            // Attempt 3: graph.instagram.com with clean fields
            const igRes = await fetch(
              `https://graph.instagram.com/v20.0/${media.id}/comments?fields=id,text,username,timestamp&access_token=${accessToken}`
            );
            if (igRes.ok) {
              const igData = await igRes.json();
              rawComments = igData.data || [];
            } else {
              const fbErrText = await minimalFbRes.text().catch(() => '');
              logger.debug('No comments or error fetching comments for media during sync', {
                mediaId: media.id,
                error: fbErrText.substring(0, 150),
              });
            }
          }
        }
      } catch (err: any) {
        logger.warn('Failed to fetch comments for media during sync', { mediaId: media.id, error: err.message });
        continue;
      }

      totalCommentsExamined += rawComments.length;

      for (const item of rawComments) {
        const commentId = item.id;
        const commentText = item.text || item.message || '';
        const rawUsername = item.username || item.from?.username || item.user?.username || '';
        const commenterUsername = rawUsername.toLowerCase().trim();
        const commenterIgScopedId = item.from?.id || item.user?.id || item.user_id;

        // Skip if empty or already processed
        if (!commentId || !commentText) continue;

        // Skip comments made by brand account itself
        if (brandUsername && commenterUsername && commenterUsername === brandUsername) continue;

        // Skip reply-to-reply comments only if thread chaining is disabled
        if (item.parent_id && !automationConfig.threadChainingEnabled) continue;

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
            commenter_username: rawUsername || commenterUsername || 'instagram_user',
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
          username: rawUsername || commenterUsername || 'instagram_user',
          timestamp: item.timestamp || item.created_time || new Date().toISOString(),
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
          commenter_username: rawUsername || commenterUsername || 'instagram_user',
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

        // Optional DM sending for link requests — uses Private Replies API
        if (result.shouldSendDM && automationConfig.linkUrl) {
          const dmText = result.suggestedDM || `Hey @${commentEvent.username}! Here's the link: ${automationConfig.linkUrl}`;
          const dmRes = await automation.sendDmForComment(
            accessToken,
            connection.platform_user_id,
            commentId,
            commenterIgScopedId,
            dmText
          );
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
      diagnostics,
    });
  } catch (error: any) {
    logger.error('Error during Instagram comments sync', { error });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
