import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyMetaSignature } from '@/lib/webhooks/verify';
import { config } from '@/lib/config/schema';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { decryptToken } from '@/lib/crypto/encryption';
import {
  InstagramCommentAutomation,
  DEFAULT_AUTOMATION_CONFIG,
  type CommentEvent,
  type AutomationConfig,
} from '@/lib/services/InstagramCommentAutomation';
import { createClient } from '@supabase/supabase-js';

const platformRepository = new SupabasePlatformRepository();
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// ─── GET: Meta Webhook Verification ─────────────────────────────────────────
// Meta sends a GET request with hub.mode, hub.challenge, hub.verify_token
// to verify your endpoint. You must echo back the challenge.

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === config.META_WEBHOOK_VERIFY_TOKEN) {
    logger.info('Instagram webhook verified successfully');
    // Must return the challenge as plain text, not JSON
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  logger.warn('Instagram webhook verification failed', { mode, tokenMatch: token === config.META_WEBHOOK_VERIFY_TOKEN });
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ─── POST: Receive Instagram Webhook Events ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify the signature from Meta
    const signature = request.headers.get('x-hub-signature-256') || request.headers.get('x-hub-signature');
    if (!signature) {
      logger.warn('Instagram webhook: missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const secret = config.META_WEBHOOK_SECRET;
    if (secret) {
      const isValid = await verifyMetaSignature(body, signature, secret);
      if (!isValid) {
        logger.warn('Instagram webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (config.NODE_ENV === 'production') {
      logger.error('Instagram webhook: META_WEBHOOK_SECRET not configured in production');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      logger.warn('Instagram webhook: invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Meta webhook payload format:
    // { object: "instagram", entry: [{ id: "ig_user_id", changes: [...] }] }
    if (payload.object !== 'instagram') {
      logger.debug('Instagram webhook: not an instagram object', { object: payload.object });
      return NextResponse.json({ received: true });
    }

    const entries = payload.entry as Array<Record<string, unknown>> | undefined;
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ received: true });
    }

    // Process each entry (each represents one subscribed IG account)
    for (const entry of entries) {
      const igUserId = entry.id as string;
      const changes = entry.changes as Array<Record<string, unknown>> | undefined;

      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        if (change.field === 'comments') {
          const value = change.value as Record<string, unknown>;
          if (value) {
            // Process asynchronously so we return 200 quickly to Meta
            processCommentEvent(igUserId, value).catch((err) => {
              logger.error('Error processing Instagram comment event', {
                igUserId,
                error: err instanceof Error ? err : new Error(String(err)),
              });
            });
          }
        }
        // Future: handle 'messages' field for DM receipts/responses
      }
    }

    // Always return 200 quickly to Meta to avoid retries
    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Instagram webhook processing error', { error: err });
    // Return 200 even on error to prevent Meta from retrying
    return NextResponse.json({ received: true });
  }
}

// ─── Comment Processing Logic ───────────────────────────────────────────────

async function processCommentEvent(igUserId: string, value: Record<string, unknown>): Promise<void> {
  const commentEvent: CommentEvent = {
    commentId: value.id as string,
    mediaId: value.media?.id as string || value.media_id as string || '',
    text: value.text as string || '',
    username: value.from?.username as string || '',
    timestamp: value.created_time as string || new Date().toISOString(),
    parentId: value.parent_id as string || undefined,
  };

  // Don't process replies to our own comments (avoid loops)
  if (commentEvent.parentId) {
    logger.debug('Skipping reply-to-reply comment', { commentId: commentEvent.commentId });
    return;
  }

  if (!commentEvent.text || !commentEvent.commentId) {
    logger.debug('Skipping empty comment event', { value });
    return;
  }

  // Find the platform connection for this IG user
  const { data: connections } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('platform', 'instagram')
    .eq('platform_user_id', igUserId)
    .eq('status', 'connected');

  if (!connections || connections.length === 0) {
    logger.warn('No active Instagram connection found for webhook', { igUserId });
    return;
  }

  const connection = connections[0];
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    logger.warn('GROQ_API_KEY not configured, skipping comment automation');
    return;
  }

  // Decrypt the access token
  let accessToken: string;
  try {
    accessToken = await decryptToken(connection.access_token_encrypted);
  } catch (error) {
    logger.error('Failed to decrypt Instagram access token', { connectionId: connection.id });
    return;
  }

  // Load automation config for this workspace (or use defaults)
  const automationConfig = await loadAutomationConfig(connection.workspace_id);

  if (!automationConfig.enabled) {
    logger.debug('Instagram comment automation disabled for workspace', { workspaceId: connection.workspace_id });
    return;
  }

  // Get the post caption for context (best-effort)
  let postCaption = '';
  if (commentEvent.mediaId) {
    try {
      const mediaRes = await fetch(
        `https://graph.instagram.com/v20.0/${commentEvent.mediaId}?fields=caption&access_token=${accessToken}`
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        postCaption = mediaData.caption || '';
      }
    } catch {
      logger.debug('Could not fetch post caption for comment context');
    }
  }

  // Classify and generate reply
  const automation = new InstagramCommentAutomation(groqApiKey);
  const result = await automation.classifyAndGenerateReply(commentEvent, postCaption, automationConfig);

  // Log the comment and classification
  await logCommentEvent(connection.workspace_id, commentEvent, result);

  // Act on the classification
  if (result.shouldAutoReply && result.suggestedReply && result.suggestedReply !== 'SKIP') {
    // Post the public reply
    await automation.postPublicReply(accessToken, commentEvent.mediaId, commentEvent.commentId, result.suggestedReply);

    // For link requests, also send a DM
    if (result.classification === 'link_request' && automationConfig.linkUrl) {
      // The commenter's IG scoped ID is needed for DMs
      // In the webhook payload, value.from.id is the IGSID (Instagram Scoped ID)
      const commenterIgScopedId = (value.from as Record<string, unknown>)?.id as string;
      if (commenterIgScopedId) {
        const dmMessage = `Hey @${commentEvent.username}! Here's the link you asked for: ${automationConfig.linkUrl}`;
        await automation.sendPrivateMessage(accessToken, igUserId, commenterIgScopedId, dmMessage);
      }
    }
  }

  if (result.shouldFlagForReview) {
    await flagCommentForReview(connection.workspace_id, commentEvent, result);
  }
}

// ─── Helper: Load automation config ─────────────────────────────────────────

async function loadAutomationConfig(workspaceId: string): Promise<AutomationConfig> {
  try {
    const { data } = await supabase
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (data) {
      return {
        enabled: data.enabled ?? false,
        autoReplyPositive: data.auto_reply_positive ?? true,
        autoReplyQuestions: data.auto_reply_questions ?? true,
        autoReplyLinkRequests: data.auto_reply_link_requests ?? true,
        linkUrl: data.link_url || undefined,
        customInstructions: data.custom_instructions || undefined,
        flagNegative: data.flag_negative ?? true,
        flagSpam: data.flag_spam ?? true,
      };
    }
  } catch {
    // Table may not exist yet — fall back to defaults
  }

  return DEFAULT_AUTOMATION_CONFIG;
}

// ─── Helper: Log comment event ──────────────────────────────────────────────

async function logCommentEvent(
  workspaceId: string,
  comment: CommentEvent,
  classification: { classification: string; confidence: number; suggestedReply: string; shouldAutoReply: boolean; shouldFlagForReview: boolean; reasoning: string }
): Promise<void> {
  try {
    await supabase.from('instagram_comment_logs').insert({
      workspace_id: workspaceId,
      comment_id: comment.commentId,
      media_id: comment.mediaId,
      comment_text: comment.text,
      commenter_username: comment.username,
      classification: classification.classification,
      confidence: classification.confidence,
      suggested_reply: classification.suggestedReply,
      auto_replied: classification.shouldAutoReply,
      flagged_for_review: classification.shouldFlagForReview,
      reasoning: classification.reasoning,
    });
  } catch (error) {
    logger.warn('Failed to log Instagram comment event', { error });
  }
}

// ─── Helper: Flag comment for review ────────────────────────────────────────

async function flagCommentForReview(
  workspaceId: string,
  comment: CommentEvent,
  classification: { classification: string; suggestedReply: string; reasoning: string }
): Promise<void> {
  try {
    await supabase.from('instagram_flagged_comments').insert({
      workspace_id: workspaceId,
      comment_id: comment.commentId,
      media_id: comment.mediaId,
      comment_text: comment.text,
      commenter_username: comment.username,
      classification: classification.classification,
      suggested_reply: classification.suggestedReply,
      reasoning: classification.reasoning,
      status: 'pending',
    });
  } catch (error) {
    logger.warn('Failed to flag Instagram comment for review', { error });
  }
}
