import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';
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
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { API_VERSIONS, resolveInstagramApiHost } from '@/lib/platforms/apiVersions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;



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

    // 1. Verify caller access: require either valid CRON_SECRET Bearer token OR authenticated workspace member
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthorized) {
      let authorizedUser = false;
      try {
        const userClient = await createSupabaseServerClient();
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          if (!workspaceId) {
            const { data: m } = await supabaseAdmin
              .from('workspace_members')
              .select('workspace_id')
              .eq('user_id', user.id)
              .limit(1)
              .single();
            workspaceId = m?.workspace_id;
            authorizedUser = Boolean(workspaceId);
          } else {
            const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
            if (!hasAccess) {
              return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            authorizedUser = true;
          }
        }
      } catch {
        authorizedUser = false;
      }

      if (!authorizedUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // 2. Fetch platform connection
    const { data: connections, error: connErr } = await supabaseAdmin
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
        await supabaseAdmin
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
          await supabaseAdmin
            .from('platform_connections')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', connection.id);
          return NextResponse.json({ ok: false, message: 'Instagram token expired — connection marked expired, please reconnect' });
        }
      }
    }

    // 3. Fetch automation config
    const globalAutomationEnabled = await isAutomationEnabledServer();
    const { data: rawConfig } = await supabaseAdmin
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    const resolvedWorkspaceLinkUrl = await resolveCreatorDeliveryLink(workspaceId, {
      configuredLinkUrl: rawConfig?.link_url,
      brandUsername,
    });

    const automationConfig: AutomationConfig = (rawConfig && globalAutomationEnabled)
      ? {
          enabled: rawConfig.enabled ?? true,
          autoReplyPositive: rawConfig.auto_reply_positive ?? true,
          autoReplyQuestions: rawConfig.auto_reply_questions ?? true,
          autoReplyLinkRequests: rawConfig.auto_reply_link_requests ?? true,
          autoReplyPurchaseIntent: rawConfig.auto_reply_purchase_intent ?? true,
          linkUrl: resolvedWorkspaceLinkUrl,
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
          requireFollowForDm: rawConfig.require_follow_for_dm ?? false,
          followAskMessage: rawConfig.follow_ask_message || undefined,
          followVerifiedMessage: rawConfig.follow_verified_message || undefined,
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
    const diagnostics: Array<{ step: string; status: string; detail?: string; [key: string]: any }> = [];

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
        `https://graph.instagram.com/${API_VERSIONS.instagram}/me?fields=id,username,name,account_type&access_token=${accessToken}`
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
        `https://graph.instagram.com/${API_VERSIONS.instagram}/${connection.platform_user_id}/subscribed_apps?access_token=${accessToken}`
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

    // 4. Fetch recent media from Instagram with bounded time budget and endpoint fallbacks
    const SYNC_START_MS = Date.now();
    const SYNC_BUDGET_MS = 38_000;
    const hasTimeBudget = () => Date.now() - SYNC_START_MS < SYNC_BUDGET_MS;

    let mediaItems: Array<{ id: string; caption?: string; timestamp?: string; comments_count?: number; comments?: { data?: any[] } }> = [];
    const fetchLimit = 50;
    let mediaSource = '';
    const primaryHost = resolveInstagramApiHost(accessToken);

    // Endpoint A: graph.instagram.com/{version}/me/media (request comments + replies + from in bulk)
    try {
      let nextUrl: string | null = `https://graph.instagram.com/${API_VERSIONS.instagram}/me/media?fields=id,caption,timestamp,comments_count,media_type,comments{id,text,username,timestamp,from{id,username},replies{id,text,timestamp,from{id,username}}}&limit=${fetchLimit}&access_token=${accessToken}`;
      let pageCount = 0;
      while (nextUrl && pageCount < 2 && hasTimeBudget()) {
        pageCount++;
        const mediaRes: Response = await fetch(nextUrl);
        if (mediaRes.ok) {
          const mediaData: any = await mediaRes.json();
          const items = mediaData.data || [];
          mediaItems = mediaItems.concat(items);
          if (mediaItems.length > 0 && !mediaSource) mediaSource = 'graph.instagram.com/me/media';
          nextUrl = mediaData.paging?.next || null;
        } else {
          // If bulk comments edge fails, try without comments field
          const fallbackRes: Response = await fetch(
            `https://graph.instagram.com/${API_VERSIONS.instagram}/me/media?fields=id,caption,timestamp,comments_count,media_type&limit=${fetchLimit}&access_token=${accessToken}`
          );
          if (fallbackRes.ok) {
            const fbData: any = await fallbackRes.json();
            mediaItems = mediaItems.concat(fbData.data || []);
            if (mediaItems.length > 0 && !mediaSource) mediaSource = 'graph.instagram.com/me/media';
            nextUrl = fbData.paging?.next || null;
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

    // Endpoint B: graph.facebook.com/{version}/{platform_user_id}/media
    if (mediaItems.length === 0 && connection.platform_user_id) {
      try {
        let nextUrl: string | null = `https://graph.facebook.com/${API_VERSIONS.facebook}/${connection.platform_user_id}/media?fields=id,caption,timestamp,comments_count,media_type,comments{id,text,username,timestamp}&limit=${fetchLimit}&access_token=${accessToken}`;
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

    // Endpoint C: graph.instagram.com/{version}/{platform_user_id}/media
    if (mediaItems.length === 0 && connection.platform_user_id) {
      try {
        const igUserRes = await fetch(
          `https://graph.instagram.com/${API_VERSIONS.instagram}/${connection.platform_user_id}/media?fields=id,caption,timestamp,comments_count,media_type&limit=${fetchLimit}&access_token=${accessToken}`
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

    // Endpoint D: graph.facebook.com/{version}/me/media
    if (mediaItems.length === 0) {
      try {
        const fbMeRes = await fetch(
          `https://graph.facebook.com/${API_VERSIONS.facebook}/me/media?fields=id,caption,timestamp,comments_count,media_type&limit=${fetchLimit}&access_token=${accessToken}`
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

    const postsWithCommentsCount = mediaItems.filter(m => (m.comments_count || 0) > 0).length;

    diagnostics.push({
      step: 'media_summary',
      status: mediaItems.length > 0 ? 'ok' : 'error',
      detail: mediaItems.length > 0
        ? `Found ${mediaItems.length} posts via ${mediaSource}. Posts with comments_count > 0: ${postsWithCommentsCount}`
        : 'ALL media endpoints returned 0 posts — token may lack instagram_business_basic scope or account is not Professional',
    });

    let totalCommentsExamined = 0;
    let newCommentsProcessed = 0;
    let repliesPosted = 0;
    let partialSync = false;
    const processedComments: any[] = [];

    // 5. For each media item, fetch and process comments
    for (const media of mediaItems) {
      if (!hasTimeBudget()) {
        partialSync = true;
        diagnostics.push({
          step: 'time_budget',
          status: 'warning',
          detail: 'Stopped scanning older posts early to stay within serverless execution budget.',
        });
        break;
      }

      const rawComments: any[] = [];
      const commentsCount = media.comments_count ?? 0;

      // Source 1: Check if comments were already retrieved in bulk me/media call
      if (media.comments?.data && Array.isArray(media.comments.data) && media.comments.data.length > 0) {
        for (const item of media.comments.data) {
          rawComments.push(item);
          if (item.replies?.data && Array.isArray(item.replies.data)) {
            for (const reply of item.replies.data) {
              rawComments.push({ ...reply, parent_id: item.id });
            }
          }
        }
      }

      // Optimization: If media explicitly reports 0 comments and no nested comments found, skip extra API calls
      if (rawComments.length === 0 && commentsCount === 0 && media.comments_count !== undefined) {
        continue;
      }

      // Source 2: Focused Graph API queries using resolved token host first (avoids 9-request fan-out)
      if (rawComments.length === 0 && hasTimeBudget()) {
        const alternateHost = primaryHost.includes('graph.instagram.com')
          ? 'https://graph.facebook.com'
          : 'https://graph.instagram.com';
        const primaryVersion = primaryHost.includes('graph.instagram.com')
          ? API_VERSIONS.instagram
          : API_VERSIONS.facebook;
        const altVersion = alternateHost.includes('graph.instagram.com')
          ? API_VERSIONS.instagram
          : API_VERSIONS.facebook;

        const queryCandidates = [
          `${primaryHost}/${primaryVersion}/${media.id}/comments?fields=id,text,timestamp,from{id,username},replies{id,text,timestamp,from{id,username}}&limit=50&access_token=${accessToken}`,
          `${primaryHost}/${primaryVersion}/${media.id}/comments?fields=id,text,timestamp,username&limit=50&access_token=${accessToken}`,
          `${alternateHost}/${altVersion}/${media.id}/comments?fields=id,text,timestamp,from{id,username},replies{id,text,timestamp,from{id,username}}&limit=50&access_token=${accessToken}`,
          `${primaryHost}/${primaryVersion}/${media.id}?fields=id,comments{id,text,timestamp,from{id,username}}&access_token=${accessToken}`,
        ];

        for (const endpoint of queryCandidates) {
          if (!hasTimeBudget()) break;
          try {
            const res = await fetch(endpoint);
            const resText = await res.text();
            let resData: any = null;
            try { resData = JSON.parse(resText); } catch {}

            if (res.ok && resData) {
              const items = resData.data || resData.comments?.data || [];
              if (Array.isArray(items) && items.length > 0) {
                for (const item of items) {
                  rawComments.push(item);
                  if (item.replies?.data && Array.isArray(item.replies.data)) {
                    for (const reply of item.replies.data) {
                      rawComments.push({ ...reply, parent_id: item.id });
                    }
                  }
                }
                logger.info('Successfully fetched comments for post', {
                  mediaId: media.id,
                  endpoint: endpoint.split('?')[0],
                  count: rawComments.length,
                });
                break; // Successfully obtained comments, stop trying other endpoints for this post
              }
            } else {
              logger.debug('Comment query candidate returned non-200 or invalid payload', {
                mediaId: media.id,
                endpoint: endpoint.split('?')[0],
                status: res.status,
                body: resText.substring(0, 200),
              });
            }
          } catch (err: any) {
            logger.warn('Comment query candidate fetch failed', {
              mediaId: media.id,
              endpoint: endpoint.split('?')[0],
              error: err.message,
            });
          }
        }

        // If post has comments according to Instagram but Meta returned empty array across all endpoints
        if (commentsCount > 0 && rawComments.length === 0 && hasTimeBudget()) {
          const sampleCount = diagnostics.filter(d => d.step.startsWith('withheld_sample')).length;
          if (sampleCount < 2) {
            try {
              const sampleRes = await fetch(`https://graph.instagram.com/${API_VERSIONS.instagram}/${media.id}/comments?fields=id,text,timestamp,username&access_token=${accessToken}`);
              const sampleBody = await sampleRes.text();
              logger.warn('Meta Graph API returned empty data for post with comments (Dev Mode withholding)', {
                mediaId: media.id,
                commentsCount,
                httpStatus: sampleRes.status,
                metaResponse: sampleBody.substring(0, 300),
              });
              diagnostics.push({
                step: `withheld_sample_${media.id}`,
                status: sampleRes.ok ? 'meta_empty_data' : 'meta_api_error',
                detail: `HTTP ${sampleRes.status}: ${sampleBody.substring(0, 200)} (Instagram reports comments_count=${commentsCount})`,
                mediaId: media.id,
                reportedCount: commentsCount,
                sampleBody: sampleBody.substring(0, 300),
              });
            } catch (e: any) {
              logger.error('Failed to query withheld sample', { mediaId: media.id, error: e.message });
              diagnostics.push({
                step: `withheld_sample_${media.id}`,
                status: 'fetch_error',
                detail: e.message,
              });
            }
          }
        }
      }

      totalCommentsExamined += rawComments.length;

      if (rawComments.length === 0) {
        continue;
      }

      const recentReplies = await lexicalEntropyGuard.getRecentReplies(workspaceId, 15, media.id);
      const mediaLinkUrl = await resolveCreatorDeliveryLink(workspaceId, {
        configuredLinkUrl: rawConfig?.link_url,
        brandUsername,
        mediaId: media.id,
      });
      const effectiveMediaConfig: AutomationConfig = {
        ...automationConfig,
        linkUrl: mediaLinkUrl,
      };

      for (const item of rawComments) {
        if (!hasTimeBudget()) {
          partialSync = true;
          break;
        }

        const commentId = item.id;
        const commentText = item.text || item.message || '';
        let rawUsername = item.from?.username || item.username || item.user?.username || '';

        // If username was not populated, try best-effort comment node lookup
        if (!rawUsername && commentId) {
          try {
            const cRes = await fetch(
              `https://graph.instagram.com/${API_VERSIONS.instagram}/${commentId}?fields=from{id,username},username&access_token=${accessToken}`
            );
            if (cRes.ok) {
              const cData = await cRes.json();
              rawUsername = cData.from?.username || cData.username || '';
            }
          } catch {}
        }

        const commenterUsername = (rawUsername || 'instagram_user').toLowerCase().trim();
        const commenterIgScopedId = item.from?.id || item.user?.id || item.user_id;

        // Skip if empty or already processed
        if (!commentId || !commentText) continue;

        // Skip comments made by brand account itself (by numeric ID or username)
        const isSelfComment =
          (commenterIgScopedId && connection.platform_user_id && commenterIgScopedId === connection.platform_user_id) ||
          (brandUsername && commenterUsername && commenterUsername === brandUsername);
        if (isSelfComment) continue;

        // Skip reply-to-reply comments only if thread chaining is disabled
        if (item.parent_id && !automationConfig.threadChainingEnabled) continue;

        // Check deduplication guard in database — only skip comments already completed
        const { data: existing } = await supabaseAdmin
          .from('instagram_comment_logs')
          .select('id, workspace_id, auto_replied, classification, delivery_status')
          .eq('comment_id', commentId)
          .limit(1);

        if (existing && existing.length > 0) {
          const row = existing[0];
          if (row.workspace_id && row.workspace_id !== workspaceId) {
            logger.warn('Comment ID already logged under another workspace — skipping cross-workspace duplicate', {
              commentId,
              existingWorkspaceId: row.workspace_id,
              workspaceId,
            });
            continue;
          }
          const isPendingOrRetryable =
            row.classification === 'pending' ||
            row.delivery_status === 'queued' ||
            row.delivery_status === 'failed';
          if (row.auto_replied === true || !isPendingOrRetryable) {
            continue; // Already processed and logged
          }
        }

        // Validate with ContentGuard
        const guardResult = ContentGuard.validateComment(commentText);
        if (!guardResult.safe && guardResult.violation.level === 'blocked') {
          const { error: guardLogErr } = await supabaseAdmin.from('instagram_comment_logs').upsert({
            workspace_id: workspaceId,
            comment_id: commentId,
            media_id: media.id,
            comment_text: commentText,
            commenter_username: rawUsername || commenterUsername || 'instagram_user',
            classification: 'harmful',
            confidence: 1,
            suggested_reply: 'SKIP',
            auto_replied: false,
            delivery_status: 'needs_review',
            flagged_for_review: true,
            reasoning: guardResult.violation.internal || guardResult.violation.message,
            lead_score: 0,
            dm_sent: false,
          }, { onConflict: 'comment_id', ignoreDuplicates: false });
          if (guardLogErr) {
            logger.warn('Failed to log ContentGuard-blocked comment in sync', { commentId, error: guardLogErr.message });
          }
          newCommentsProcessed++;
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
          effectiveMediaConfig,
          recentReplies
        );

        let finalReply = result.suggestedReply;
        if (result.shouldAutoReply && finalReply && finalReply !== 'SKIP') {
          try {
            finalReply = ContentHumanizer.humanize(finalReply, 'instagram').humanized || finalReply;
          } catch {}
          finalReply = ContentGuard.sanitizeOutput(finalReply);
        }

        const activeLinkUrl = mediaLinkUrl;
        const willPostFollowGate = Boolean(
          result.shouldSendDM && activeLinkUrl && automationConfig.requireFollowForDm
        );
        const brandHandle = connection.username ? `@${connection.username}` : 'our profile';
        const followAskPublic = `👋 Follow ${brandHandle} then DM us "link" to unlock your access! 🚀`;
        const plannedReplyText = willPostFollowGate ? followAskPublic : finalReply;

        // Log classified comment BEFORE outbound API calls so it always appears in Dispatch Ledger even on timeout/blip
        const { error: logErr } = await supabaseAdmin.from('instagram_comment_logs').upsert({
          workspace_id: workspaceId,
          comment_id: commentId,
          media_id: media.id,
          comment_text: commentText,
          commenter_username: rawUsername || commenterUsername || 'instagram_user',
          classification: result.classification,
          confidence: result.confidence,
          suggested_reply: plannedReplyText,
          auto_replied: false,
          delivery_status: result.shouldAutoReply || willPostFollowGate ? 'processing' : (result.shouldFlagForReview ? 'needs_review' : 'sent'),
          flagged_for_review: result.shouldFlagForReview,
          reasoning: result.reasoning + ' (Live sync)',
          lead_score: result.leadScore,
          dm_sent: false,
          dm_message: result.suggestedDM,
          thread_hook: result.threadHook,
        }, { onConflict: 'comment_id', ignoreDuplicates: false });
        if (logErr) {
          logger.error('Failed to upsert comment log in sync route', { commentId, workspaceId, error: logErr.message });
        }

        let didReply = false;
        // Post standard public reply only when follow-gate is not taking over the public reply slot
        if (!willPostFollowGate && result.shouldAutoReply && finalReply && finalReply !== 'SKIP') {
          const replyResult = await automation.postPublicReply(
            accessToken,
            media.id,
            commentId,
            finalReply,
            rawUsername || commenterUsername
          );

          if (replyResult) {
            didReply = true;
            repliesPosted++;
            await velocityThrottle.recordReply(workspaceId);
            lexicalEntropyGuard.recordReply(workspaceId, finalReply, media.id);
            logger.info('Auto-reply posted via comment sync', { commentId, replyId: replyResult.replyId });
          }
        }

        const shouldFlag =
          result.shouldFlagForReview ||
          (!willPostFollowGate && !didReply && result.shouldAutoReply && finalReply !== 'SKIP');
        if (shouldFlag) {
          try {
            await supabaseAdmin.from('instagram_flagged_comments').upsert({
              workspace_id: workspaceId,
              comment_id: commentId,
              media_id: media.id,
              comment_text: commentText,
              commenter_username: rawUsername || commenterUsername || 'instagram_user',
              classification: result.classification,
              suggested_reply: plannedReplyText || '',
              reasoning: result.reasoning + (didReply ? '' : ' (Auto-reply failed/pending review)'),
              status: 'pending',
              priority: result.leadScore > 0 ? 'high' : 'normal',
              lead_score: result.leadScore || 0,
            }, { onConflict: 'comment_id', ignoreDuplicates: false });
          } catch (flagErr) {
            logger.warn('Failed to insert flagged comment in sync route', { commentId, error: flagErr });
          }
        }

        // Update delivery status after public reply attempt
        const { error: statusUpdateErr } = await supabaseAdmin
          .from('instagram_comment_logs')
          .update({
            auto_replied: didReply,
            delivery_status: didReply ? 'sent' : (shouldFlag ? 'needs_review' : (willPostFollowGate ? 'processing' : 'sent')),
            flagged_for_review: shouldFlag,
            ...(didReply ? { reply_sent_at: new Date().toISOString() } : {}),
          })
          .eq('comment_id', commentId);
        if (statusUpdateErr) {
          logger.warn('Failed to update comment log status in sync route', { commentId, error: statusUpdateErr.message });
        }

        // Optional DM sending for link requests — uses Private Replies API (or single public follow-gate prompt)
        if (result.shouldSendDM && activeLinkUrl) {
          if (willPostFollowGate) {
            const pubGateRes = await automation.postPublicReply(
              accessToken,
              media.id,
              commentId,
              followAskPublic,
              rawUsername || commenterUsername
            );
            if (pubGateRes) {
              didReply = true;
              repliesPosted++;
              await velocityThrottle.recordReply(workspaceId);
              await supabaseAdmin
                .from('instagram_comment_logs')
                .update({
                  auto_replied: true,
                  delivery_status: 'sent',
                  reply_sent_at: new Date().toISOString(),
                })
                .eq('comment_id', commentId);
            }
          } else {
            const dmText = result.suggestedDM
              ? (automationConfig.linkUrl && activeLinkUrl !== automationConfig.linkUrl
                  ? result.suggestedDM.replace(automationConfig.linkUrl, activeLinkUrl)
                  : result.suggestedDM)
              : `Hey @${commentEvent.username}! Here's the link: ${activeLinkUrl}`;
            const dmRes = await automation.sendDmForComment(
              accessToken,
              connection.platform_user_id,
              commentId,
              commenterIgScopedId,
              dmText
            );
            if (dmRes) {
              await supabaseAdmin
                .from('instagram_comment_logs')
                .update({ dm_sent: true, dm_message: dmText })
                .eq('comment_id', commentId);
            }
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
            const hideHost = resolveInstagramApiHost(accessToken);
            const hideParams = new URLSearchParams({ hide: 'true', access_token: accessToken });
            const hideRes = await fetch(
              `${hideHost}/${API_VERSIONS.instagram}/${commentId}`,
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

    const isMetaWithheld = postsWithCommentsCount > 0 && totalCommentsExamined === 0;

    diagnostics.push({
      step: 'comments_summary',
      status: totalCommentsExamined > 0 ? 'ok' : (isMetaWithheld ? 'meta_withheld' : 'empty'),
      detail: totalCommentsExamined > 0
        ? `Found and examined ${totalCommentsExamined} comments across ${mediaItems.length} posts.`
        : (isMetaWithheld
            ? `Meta Withheld Comments in Development Mode: Instagram reports ${postsWithCommentsCount} post(s) have comments, but Meta Graph API returned 0 comment objects. The commenter must have an accepted Tester role in your Meta App at developers.facebook.com or facebook.com/settings -> Developer Invites.`
            : `All ${mediaItems.length} posts have 0 comments according to Instagram.`),
      metaWithheld: isMetaWithheld,
      postsWithCommentsCount,
      guidance: isMetaWithheld ? [
        '1. In Meta Developer Portal (developers.facebook.com) -> App Roles -> Roles -> Testers, invite the tester.',
        '2. The tester must go to facebook.com -> Settings & Privacy -> Settings -> Apps and Websites -> Developer Invites tab (or developers.facebook.com/requests) and ACCEPT.',
        '3. If they only accepted in Instagram app settings, that does not grant Meta App Role access in Development Mode.',
      ] : undefined,
    });

    return NextResponse.json({
      ok: true,
      workspaceId,
      mediaCount: mediaItems.length,
      postsWithCommentsCount,
      totalCommentsExamined,
      newCommentsProcessed,
      repliesPosted,
      partialSync,
      processedComments,
      metaWithheld: isMetaWithheld,
      diagnostics,
    });
  } catch (error: any) {
    logger.error('Error during Instagram comments sync', { error });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
