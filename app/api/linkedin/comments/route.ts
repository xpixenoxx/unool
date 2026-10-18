import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

const LI_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'X-Restli-Protocol-Version': '2.0.0',
  'LinkedIn-Version': '202606',
});

export interface LinkedInCommentLog {
  id: string;
  comment_id: string;
  post_id?: string;
  comment_text: string;
  commenter_username: string;
  author_headline?: string;
  classification: string;
  confidence: number;
  suggested_reply: string | null;
  auto_replied: boolean;
  flagged_for_review: boolean;
  reasoning: string | null;
  lead_score: number;
  dm_sent: boolean;
  created_at: string;
}

function classifyComment(text: string): {
  classification: string;
  confidence: number;
  leadScore: number;
  flagged: boolean;
  reasoning: string;
} {
  const t = text.toLowerCase();

  if (/pricing|enterprise|cost|quote|seats|contract|onboarding|demo|pilot|sla|procurement/i.test(t)) {
    return {
      classification: 'purchase_intent',
      confidence: 0.94,
      leadScore: 3,
      flagged: true,
      reasoning: 'High-value commercial buyer inquiry regarding enterprise onboarding or pricing.',
    };
  }

  if (/case study|deck|slides|link|resource|doc|guide|whitepaper|framework|blueprint|send me/i.test(t)) {
    return {
      classification: 'link_request',
      confidence: 0.95,
      leadScore: 2,
      flagged: false,
      reasoning: 'Inbound request for architecture deck, case study, or resource link.',
    };
  }

  if (/\?|how |why |what |is there|can you|could you|explain/i.test(t)) {
    return {
      classification: 'question',
      confidence: 0.91,
      leadScore: 1,
      flagged: false,
      reasoning: 'Technical or consultative domain inquiry regarding methodology.',
    };
  }

  if (/crypto|whatsapp|telegram|dm me|buy leads|followers|\$199|guaranteed b2b/i.test(t)) {
    return {
      classification: 'spam',
      confidence: 0.98,
      leadScore: 0,
      flagged: true,
      reasoning: 'Unsolicited promotional scraping pitch or recruiter spam.',
    };
  }

  if (/disagree|wrong|doubt|flawed|skeptical|problem with|misleading|waste|nonsense/i.test(t)) {
    return {
      classification: 'negative',
      confidence: 0.88,
      leadScore: 1,
      flagged: true,
      reasoning: 'Contrarian objection or critical remark routed for human triage.',
    };
  }

  if (/love|great|brilliant|exceptional|insightful|congrats|awesome|agreed|kudos|superb|well said/i.test(t)) {
    return {
      classification: 'positive',
      confidence: 0.92,
      leadScore: 1,
      flagged: false,
      reasoning: 'Thought leadership praise and professional endorsement.',
    };
  }

  return {
    classification: 'unrelated',
    confidence: 0.85,
    leadScore: 0,
    flagged: false,
    reasoning: 'General professional remark.',
  };
}

function generateSuggestedReply(
  commentText: string,
  authorName: string,
  classification: string,
  linkUrl?: string | null
): string {
  const firstName = authorName.split(' ')[0] || 'there';

  if (classification === 'link_request') {
    return linkUrl
      ? `Appreciate your interest, ${firstName}! You can explore the complete framework and deck here: ${linkUrl}`
      : `Appreciate your interest, ${firstName}! Sending the deck and architecture notes over right away.`;
  }
  if (classification === 'purchase_intent') {
    return `Thanks for reaching out, ${firstName}. We offer tailored enterprise onboarding and guaranteed SLAs for scaling teams. Happy to connect directly to discuss rollout parameters.`;
  }
  if (classification === 'question') {
    return `Thoughtful query, ${firstName}. We designed this specifically to address high-velocity B2B pipelines with verified safeguards.`;
  }
  if (classification === 'positive') {
    return `Much appreciated, ${firstName}! Glad the breakdown resonated with your work.`;
  }
  if (classification === 'negative') {
    return `Appreciate the perspective, ${firstName}. In production workflows, having explicit guardrails is exactly how we prevent those edge cases.`;
  }
  return `Thanks for the input, ${firstName}!`;
}

export function parseLinkedInPostUrn(input: string): string | null {
  if (!input) return null;
  const clean = input.trim();
  if (clean.startsWith('urn:li:')) return clean;

  const activityMatch = clean.match(/urn:li:(?:activity|share|ugcPost):(\d+)/);
  if (activityMatch) return activityMatch[0];

  const urlActivityMatch = clean.match(/activity-?(\d{15,})/);
  if (urlActivityMatch) return `urn:li:activity:${urlActivityMatch[1]}`;

  const pureNumMatch = clean.match(/^(\d{15,})$/);
  if (pureNumMatch) return `urn:li:share:${pureNumMatch[1]}`;

  return null;
}

// ── GET /api/linkedin/comments?workspaceId=xxx&classification=all&search=xxx
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const workspaceId = params.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const classification = params.get('classification') || 'all';
    const search = (params.get('search') || '').toLowerCase().trim();

    const { data: ws } = await adminSupabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();

    const settings = (ws?.settings as Record<string, unknown>) || {};
    let logs = (settings.linkedin_comment_logs as LinkedInCommentLog[]) || [];

    if (classification !== 'all') {
      logs = logs.filter(l => l.classification === classification);
    }
    if (search) {
      logs = logs.filter(l =>
        l.comment_text?.toLowerCase().includes(search) ||
        l.commenter_username?.toLowerCase().includes(search) ||
        l.suggested_reply?.toLowerCase().includes(search)
      );
    }

    const allLogs = (settings.linkedin_comment_logs as LinkedInCommentLog[]) || [];
    const stats = {
      total: allLogs.length,
      autoReplied: allLogs.filter(l => l.auto_replied).length,
      flagged: allLogs.filter(l => l.flagged_for_review).length,
      highIntent: allLogs.filter(l => l.lead_score >= 2).length,
      byClassification: {
        positive: allLogs.filter(l => l.classification === 'positive').length,
        question: allLogs.filter(l => l.classification === 'question').length,
        link_request: allLogs.filter(l => l.classification === 'link_request').length,
        purchase_intent: allLogs.filter(l => l.classification === 'purchase_intent').length,
        negative: allLogs.filter(l => l.classification === 'negative').length,
        spam: allLogs.filter(l => l.classification === 'spam').length,
      },
    };

    return NextResponse.json({ comments: logs, stats });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/linkedin/comments error', { error: err });
    return NextResponse.json({ error: 'Failed to fetch LinkedIn comments' }, { status: 500 });
  }
}

// ── POST /api/linkedin/comments (Audit live LinkedIn posts & fetch real comments)
export async function POST(request: NextRequest) {
  const debug: string[] = [];

  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId');
    const specificPostUrl = body.postUrl ? String(body.postUrl).trim() : null;

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // ── Find LinkedIn connection ──────────────────────────
    let { data: connRows } = await adminSupabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'linkedin');

    if ((!connRows || connRows.length === 0) && user.id !== workspaceId) {
      const s2 = await adminSupabase
        .from('platform_connections')
        .select('*')
        .eq('workspace_id', user.id)
        .eq('platform', 'linkedin');
      if (s2.data && s2.data.length > 0) connRows = s2.data;
    }

    if (!connRows || connRows.length === 0) {
      const { data: memberships } = await adminSupabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);
      if (memberships) {
        for (const m of memberships) {
          const s3 = await adminSupabase
            .from('platform_connections')
            .select('*')
            .eq('workspace_id', m.workspace_id)
            .eq('platform', 'linkedin');
          if (s3.data && s3.data.length > 0) {
            connRows = s3.data;
            break;
          }
        }
      }
    }

    if (!connRows || connRows.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'LinkedIn account is not connected. Connect LinkedIn under Settings or Automation header first.',
        debug,
      }, { status: 404 });
    }

    const connection = connRows[0];
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token_encrypted);
      debug.push('token_decrypted');
    } catch {
      return NextResponse.json({
        ok: false,
        error: 'Failed to decrypt LinkedIn token. Please reconnect your account.',
        debug,
      }, { status: 401 });
    }

    // Load workspace settings for automation config & existing logs
    const { data: ws } = await adminSupabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();

    const currentSettings = (ws?.settings as Record<string, unknown>) || {};
    const autoConfig = (currentSettings.linkedin_automation_config as Record<string, unknown>) || {};
    const linkUrl = (autoConfig.linkUrl as string) || null;
    const existingLogs = (currentSettings.linkedin_comment_logs as LinkedInCommentLog[]) || [];

    // ── Collect Post URNs to audit ────────────────────────
    const postUrnsToAudit: { urn: string; id: string }[] = [];

    // 1. If user supplied a specific post URL or URN
    if (specificPostUrl) {
      const parsed = parseLinkedInPostUrn(specificPostUrl);
      if (parsed) {
        postUrnsToAudit.push({ urn: parsed, id: parsed });
        debug.push(`manual_post_urn:${parsed}`);
      } else {
        return NextResponse.json({
          ok: false,
          error: 'Invalid LinkedIn post link. Please provide a valid LinkedIn URL or URN (e.g. https://www.linkedin.com/feed/update/urn:li:activity:...).',
        }, { status: 400 });
      }
    }

    // 2. Fetch posts from Unool database
    const { data: platformPosts } = await adminSupabase
      .from('platform_posts')
      .select('id, platform_post_id, platform_url')
      .eq('platform_connection_id', connection.id)
      .not('platform_post_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(15);

    if (platformPosts) {
      for (const p of platformPosts) {
        const platformPostId = p.platform_post_id;
        if (!platformPostId) continue;
        const urn = platformPostId.startsWith('urn:')
          ? platformPostId
          : `urn:li:share:${platformPostId}`;
        if (!postUrnsToAudit.some(item => item.urn === urn)) {
          postUrnsToAudit.push({ urn, id: platformPostId });
        }
      }
      debug.push(`db_platform_posts:${platformPosts.length}`);
    }

    // 3. Fallback: check workspace posts published to LinkedIn
    if (postUrnsToAudit.length === 0) {
      const { data: wsPosts } = await adminSupabase
        .from('posts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'published')
        .limit(10);

      if (wsPosts && wsPosts.length > 0) {
        const postIds = wsPosts.map((p: any) => p.id);
        const { data: variants } = await adminSupabase
          .from('post_variants')
          .select('platform_post_id')
          .in('post_id', postIds)
          .eq('platform', 'linkedin')
          .not('platform_post_id', 'is', null);

        if (variants) {
          for (const v of variants) {
            const pid = v.platform_post_id;
            if (pid) {
              const urn = pid.startsWith('urn:') ? pid : `urn:li:share:${pid}`;
              if (!postUrnsToAudit.some(item => item.urn === urn)) {
                postUrnsToAudit.push({ urn, id: pid });
              }
            }
          }
          debug.push(`workspace_variant_posts:${variants.length}`);
        }
      }
    }

    // 4. Try fetching member's own posts via LinkedIn REST API
    try {
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        const authorUrn = `urn:li:person:${profile.sub}`;
        const restPostsUrl = `https://api.linkedin.com/rest/posts?author=${encodeURIComponent(authorUrn)}&q=author&count=5`;
        const postsRes = await fetch(restPostsUrl, { headers: LI_HEADERS(accessToken) });
        if (postsRes.ok) {
          const pd = await postsRes.json();
          const elements = pd.elements || [];
          for (const el of elements) {
            const urn = el.id || el['$URN'];
            if (urn && !postUrnsToAudit.some(item => item.urn === urn)) {
              postUrnsToAudit.push({ urn, id: urn });
            }
          }
          debug.push(`rest_posts_api:${elements.length}`);
        }
      }
    } catch {
      /* skip API author scan fallback */
    }

    if (postUrnsToAudit.length === 0) {
      return NextResponse.json({
        ok: true,
        mediaCount: 0,
        commentsExamined: 0,
        newCommentsProcessed: 0,
        comments: existingLogs,
        message: 'No LinkedIn posts found in your workspace. If you published directly on LinkedIn, use "Audit by Post URL" above.',
        debug,
      });
    }

    // ── Audit comments for collected posts ─────────────────
    const newOrUpdatedLogs: LinkedInCommentLog[] = [];
    let totalCommentsExamined = 0;

    for (const postItem of postUrnsToAudit) {
      try {
        const commentsUrl = `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postItem.urn)}/comments?count=30`;
        const res = await fetch(commentsUrl, { headers: LI_HEADERS(accessToken) });

        if (!res.ok) {
          const errText = await res.text();
          debug.push(`audit_post_err:${postItem.urn.slice(-12)}:${res.status}`);
          continue;
        }

        const data = await res.json();
        const elements = data.elements || [];
        totalCommentsExamined += elements.length;
        debug.push(`audit_post_ok:${postItem.urn.slice(-12)}:comments=${elements.length}`);

        for (const c of elements) {
          const commentId = c['$URN'] || c.id || `${postItem.id}_${Math.random().toString(36).substring(7)}`;
          const commentText = c.message?.text || c.comment || '';
          if (!commentText.trim()) continue;

          const commenterName = c.actor?.name || 'LinkedIn Member';
          const authorHeadline = c.actor?.headline || '';
          const createdAt = c.created?.time ? new Date(c.created.time).toISOString() : new Date().toISOString();

          const { classification, confidence, leadScore, flagged, reasoning } = classifyComment(commentText);
          const suggestedReply = generateSuggestedReply(commentText, commenterName, classification, linkUrl);

          newOrUpdatedLogs.push({
            id: commentId,
            comment_id: commentId,
            post_id: postItem.id,
            comment_text: commentText,
            commenter_username: commenterName,
            author_headline: authorHeadline,
            classification,
            confidence,
            suggested_reply: suggestedReply,
            auto_replied: false,
            flagged_for_review: flagged,
            reasoning,
            lead_score: leadScore,
            dm_sent: false,
            created_at: createdAt,
          });
        }
      } catch (postAuditErr) {
        debug.push(`post_exception:${String(postAuditErr)}`);
      }
    }

    // ── Merge with existing comments ───────────────────────
    const mergedMap = new Map<string, LinkedInCommentLog>();
    for (const item of existingLogs) {
      mergedMap.set(item.comment_id, item);
    }
    for (const item of newOrUpdatedLogs) {
      mergedMap.set(item.comment_id, item);
    }

    const mergedLogs = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Save back to workspace settings
    const updatedSettings = {
      ...currentSettings,
      linkedin_comment_logs: mergedLogs.slice(0, 500),
    };

    const { error: updateErr } = await adminSupabase
      .from('workspaces')
      .update({ settings: updatedSettings })
      .eq('id', workspaceId);

    if (updateErr) {
      logger.error('Failed to save audited LinkedIn comments to workspace settings', { updateErr, workspaceId });
    }

    const stats = {
      total: mergedLogs.length,
      autoReplied: mergedLogs.filter(l => l.auto_replied).length,
      flagged: mergedLogs.filter(l => l.flagged_for_review).length,
      highIntent: mergedLogs.filter(l => l.lead_score >= 2).length,
      byClassification: {
        positive: mergedLogs.filter(l => l.classification === 'positive').length,
        question: mergedLogs.filter(l => l.classification === 'question').length,
        link_request: mergedLogs.filter(l => l.classification === 'link_request').length,
        purchase_intent: mergedLogs.filter(l => l.classification === 'purchase_intent').length,
        negative: mergedLogs.filter(l => l.classification === 'negative').length,
        spam: mergedLogs.filter(l => l.classification === 'spam').length,
      },
    };

    return NextResponse.json({
      ok: true,
      mediaCount: postUrnsToAudit.length,
      totalCommentsExamined,
      newCommentsProcessed: newOrUpdatedLogs.length,
      comments: mergedLogs,
      stats,
      debug,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/linkedin/comments error', { error: err });
    return NextResponse.json({ ok: false, error: 'Internal server error while auditing LinkedIn comments', debug }, { status: 500 });
  }
}
