import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  CAMPAIGN_PLAYBOOK_PRESETS,
  analyzeCampaignKeywords,
  type InstagramCampaign,
  type CampaignTriggerSurface,
} from '@/lib/services/automation/campaignMatcher';
import { diagnoseCampaigns, type CampaignFunnelMetrics } from '@/lib/services/automation/campaignDoctor';

export const dynamic = 'force-dynamic';

// GET /api/instagram/campaigns?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [campaignsRes, enrollmentsRes, clicksRes, couponsRes] = await Promise.all([
      supabaseAdmin
        .from('instagram_campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('campaign_enrollments')
        .select('campaign_id, ab_variant, follow_verified, lead_captured, dm_sent_at, link_clicked_at')
        .eq('workspace_id', workspaceId)
        .limit(2000),
      supabaseAdmin
        .from('tracked_link_clicks')
        .select('campaign_id, ab_variant')
        .eq('workspace_id', workspaceId)
        .limit(2000),
      supabaseAdmin
        .from('campaign_coupons')
        .select('campaign_id, claimed_at')
        .eq('workspace_id', workspaceId)
        .limit(2000),
    ]);

    const campaigns = (campaignsRes.data || []) as InstagramCampaign[];
    const enrollments = (enrollmentsRes.data || []) as any[];
    const clicks = (clicksRes.data || []) as any[];
    const coupons = (couponsRes.data || []) as any[];

    const metricsByCampaign: Record<string, CampaignFunnelMetrics> = {};
    for (const c of campaigns) {
      const cEnrolls = enrollments.filter((e) => e.campaign_id === c.id);
      const cClicks = clicks.filter((cl) => cl.campaign_id === c.id);
      const cCoupons = coupons.filter((cp) => cp.campaign_id === c.id);
      metricsByCampaign[c.id] = {
        campaignId: c.id,
        campaignName: c.name,
        triggered: Math.max(c.total_sends || 0, cEnrolls.length),
        dmSent: cEnrolls.filter((e) => e.dm_sent_at).length || c.total_sends || 0,
        followVerified: cEnrolls.filter((e) => e.follow_verified).length,
        leadsCaptured: cEnrolls.filter((e) => e.lead_captured).length,
        linkClicks: cClicks.length,
        variantASends: cEnrolls.filter((e) => e.ab_variant === 'A').length,
        variantAClicks: cClicks.filter((cl) => cl.ab_variant === 'A').length,
        variantBSends: cEnrolls.filter((e) => e.ab_variant === 'B').length,
        variantBClicks: cClicks.filter((cl) => cl.ab_variant === 'B').length,
        availableCoupons: cCoupons.filter((cp) => !cp.claimed_at).length,
        totalCoupons: cCoupons.length,
      };
    }

    const diagnostics = diagnoseCampaigns(campaigns, metricsByCampaign);

    return NextResponse.json({
      campaigns,
      metricsByCampaign,
      diagnostics,
      presets: CAMPAIGN_PLAYBOOK_PRESETS,
    });
  } catch (error) {
    logger.error('GET /api/instagram/campaigns error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/instagram/campaigns
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const workspaceId = body.workspaceId || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });

    const triggerSurface: CampaignTriggerSurface = body.trigger_surface || 'comment';
    const keywords = Array.isArray(body.keywords)
      ? body.keywords.map((k: unknown) => String(k).trim()).filter(Boolean)
      : typeof body.keywords === 'string'
        ? body.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
        : [];
    const excludeKeywords = Array.isArray(body.exclude_keywords)
      ? body.exclude_keywords.map((k: unknown) => String(k).trim()).filter(Boolean)
      : typeof body.exclude_keywords === 'string'
        ? body.exclude_keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
        : [];
    const publicReplies = Array.isArray(body.public_replies)
      ? body.public_replies.map((r: unknown) => String(r).trim()).filter(Boolean)
      : [];
    const extraBubbles = Array.isArray(body.dm_extra_bubbles)
      ? body.dm_extra_bubbles.map((r: unknown) => String(r).trim()).filter(Boolean).slice(0, 2)
      : [];

    // Analyze keyword collisions & stopwords against existing campaigns
    const { data: existingRows } = await supabaseAdmin
      .from('instagram_campaigns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    const keywordAnalysis = analyzeCampaignKeywords(
      keywords,
      triggerSurface,
      body.media_id || null,
      (existingRows || []) as InstagramCampaign[]
    );

    const { data, error } = await supabaseAdmin
      .from('instagram_campaigns')
      .insert({
        workspace_id: workspaceId,
        name,
        playbook_id: body.playbook_id || null,
        trigger_surface: triggerSurface,
        media_id: body.media_id?.trim() || null,
        post_id: body.post_id || null,
        ad_id: body.ad_id?.trim() || null,
        trigger_mode: body.trigger_mode || (keywords.length > 0 ? 'fuzzy' : 'any'),
        keywords,
        exclude_keywords: excludeKeywords,
        ignore_sub_comments: Boolean(body.ignore_sub_comments),
        ignore_tag_only_comments: Boolean(body.ignore_tag_only_comments),
        dedup_user_post_hours: typeof body.dedup_user_post_hours === 'number' ? body.dedup_user_post_hours : 24,
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        max_total_sends: body.max_total_sends ? Number(body.max_total_sends) : null,
        public_replies: publicReplies,
        dm_opening_enabled: Boolean(body.dm_opening_enabled),
        dm_opening_text: body.dm_opening_text?.trim() || null,
        dm_opening_button_title: body.dm_opening_button_title?.trim() || 'Send it to me',
        dm_message: String(body.dm_message || '').trim(),
        dm_card_title: body.dm_card_title?.trim() || null,
        dm_card_subtitle: body.dm_card_subtitle?.trim() || null,
        dm_card_image_url: body.dm_card_image_url?.trim() || null,
        dm_cta_title: body.dm_cta_title?.trim() || null,
        dm_cta_url: body.dm_cta_url?.trim() || null,
        dm_extra_bubbles: extraBubbles,
        require_follow: Boolean(body.require_follow),
        follow_ask_text: body.follow_ask_text?.trim() || null,
        follow_verified_text: body.follow_verified_text?.trim() || null,
        max_follow_reminders: Math.max(1, Math.min(5, Number(body.max_follow_reminders || 2))),
        capture_email: Boolean(body.capture_email),
        capture_phone: Boolean(body.capture_phone),
        capture_prompt: body.capture_prompt?.trim() || null,
        capture_confirm_text: body.capture_confirm_text?.trim() || null,
        skip_if_already_captured: body.skip_if_already_captured !== false,
        send_email_delivery: Boolean(body.send_email_delivery),
        email_subject: body.email_subject?.trim() || null,
        email_body: body.email_body?.trim() || null,
        ab_variant_b_dm: body.ab_variant_b_dm?.trim() || null,
        ab_variant_b_cta_url: body.ab_variant_b_cta_url?.trim() || null,
        ab_split_pct: Math.max(0, Math.min(100, Number(body.ab_split_pct ?? 50))),
        nudge_enabled: Boolean(body.nudge_enabled),
        nudge_delay_minutes: Math.max(5, Math.min(1380, Number(body.nudge_delay_minutes ?? 180))),
        nudge_text: body.nudge_text?.trim() || null,
        closed_dm_public_fallback: body.closed_dm_public_fallback?.trim() || null,
        priority: Number(body.priority ?? 100),
        is_active: body.is_active !== false,
      })
      .select('*')
      .single();

    if (error) {
      logger.error('POST /api/instagram/campaigns DB error', { error: error.message });
      return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign: data, keywordAnalysis }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/instagram/campaigns error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
