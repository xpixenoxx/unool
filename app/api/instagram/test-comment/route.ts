import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation, type CommentEvent } from '@/lib/services/InstagramCommentAutomation';
import { logger } from '@/lib/logger';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { ContentHumanizer } from '@/lib/ai/engines/ContentHumanizer';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/test-comment?workspaceId=...
 * Health-check the entire pipeline: Supabase connection, Token decryption, Meta Graph API validity, Groq AI key.
 */
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || '1cd222a9-0147-4da6-a7d9-ab7e42462fcb';

    // 1. Connection check
    const { data: connections, error: connErr } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('status', 'connected');

    if (connErr || !connections || connections.length === 0) {
      return NextResponse.json({
        ok: false,
        step: 'platform_connections',
        error: connErr?.message || 'No active Instagram connection found',
      }, { status: 404 });
    }

    const conn = connections[0];

    // 2. Token decryption check
    let accessToken = '';
    try {
      accessToken = await decryptToken(conn.access_token_encrypted);
    } catch (e) {
      return NextResponse.json({
        ok: false,
        step: 'decrypt_token',
        error: 'Failed to decrypt access token',
      }, { status: 500 });
    }

    // 3. Meta Graph API token validity check
    let metaProfile: any = null;
    let metaError: string | null = null;
    try {
      const res = await fetch(`https://graph.instagram.com/v20.0/me?fields=id,username,name&access_token=${accessToken}`);
      const data = await res.json();
      if (res.ok) {
        metaProfile = data;
      } else {
        metaError = data.error?.message || JSON.stringify(data);
      }
    } catch (e: any) {
      metaError = e.message;
    }

    // 4. Groq API Key check
    const groqKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;

    // 5. Automation Config check
    const { data: autoConfig } = await supabase
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    return NextResponse.json({
      ok: !metaError && !!groqKey,
      workspaceId,
      username: conn.username,
      platformUserId: conn.platform_user_id,
      tokenExpiresAt: conn.expires_at,
      metaApiStatus: metaError ? 'error' : 'ok',
      metaProfile,
      metaError,
      groqConfigured: !!groqKey,
      automationEnabled: autoConfig?.enabled ?? false,
      autoConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/instagram/test-comment
 * Executes a full test comment through the pipeline and logs it.
 * Body: { workspaceId?, text, username?, mediaId?, postLive? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || '1cd222a9-0147-4da6-a7d9-ab7e42462fcb';
    const text = body.text || 'Hi';
    const commenterUsername = body.username || 'shrut_hi3878';
    const postLive = body.postLive === true;

    // Fetch connection
    const { data: connections } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('status', 'connected');

    if (!connections || connections.length === 0) {
      return NextResponse.json({ ok: false, error: 'No connected Instagram account' }, { status: 404 });
    }

    const conn = connections[0];
    const accessToken = await decryptToken(conn.access_token_encrypted);
    const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({ ok: false, error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    // Fetch automation config
    const { data: cfg } = await supabase
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    const automationConfig = cfg || {
      enabled: true,
      auto_reply_positive: true,
      auto_reply_questions: true,
      auto_reply_link_requests: true,
      auto_reply_purchase_intent: true,
    };

    const commentEvent: CommentEvent = {
      commentId: `test_${Date.now()}`,
      mediaId: body.mediaId || 'test_media',
      text,
      username: commenterUsername,
      timestamp: new Date().toISOString(),
    };

    // Classify
    const automation = new InstagramCommentAutomation(groqApiKey);
    const result = await automation.classifyAndGenerateReply(commentEvent, '', automationConfig, []);

    let finalReply = result.suggestedReply;
    if (result.shouldAutoReply && finalReply && finalReply !== 'SKIP') {
      try {
        finalReply = ContentHumanizer.humanize(finalReply, 'instagram').humanized || finalReply;
      } catch {}
    }

    let graphApiResult: any = null;
    if (postLive && body.mediaId && body.commentId) {
      graphApiResult = await automation.postPublicReply(accessToken, body.mediaId, body.commentId, finalReply);
    }

    // Log to Supabase
    const { data: logData, error: logErr } = await supabase
      .from('instagram_comment_logs')
      .insert({
        workspace_id: workspaceId,
        comment_id: commentEvent.commentId,
        media_id: commentEvent.mediaId,
        comment_text: commentEvent.text,
        commenter_username: commentEvent.username,
        classification: result.classification,
        confidence: result.confidence,
        suggested_reply: finalReply,
        auto_replied: result.shouldAutoReply && !!graphApiResult,
        flagged_for_review: result.shouldFlagForReview,
        reasoning: result.reasoning + (postLive ? ' (Live test)' : ' (Simulation test)'),
        lead_score: result.leadScore,
        dm_sent: false,
        dm_message: result.suggestedDM,
        thread_hook: result.threadHook,
      })
      .select()
      .single();

    return NextResponse.json({
      ok: true,
      commentEvent,
      result,
      finalReply,
      graphApiResult,
      loggedRow: logData,
      logError: logErr?.message,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
