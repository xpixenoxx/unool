/**
 * Workspace-Scoped Signal Data Loader
 *
 * Loads posts, variants, platform_posts, platform_connections, bio-link events,
 * SignalDM automation metrics, and workspace plan limits in parallel with
 * schema-resilient fallbacks and passes them to `computeSignalAnalytics()`.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getWorkspacePlanInfo } from '@/lib/plan-enforcement';
import {
  computeSignalAnalytics,
  type SignalAnalyticsPayload,
  type SignalAutomationSummaryInput,
  type SignalBioAnalyticsInput,
  type SignalConnectedAccountInput,
  type SignalFilterOptions,
  type SignalPostInput,
  type SignalRange,
} from '@/lib/analytics/signalEngine';
import { extractPostTelemetry } from '@/lib/analytics/postTelemetry';

export interface LoadedSignalWorkspace {
  analytics: SignalAnalyticsPayload;
  rawPosts: any[];
  rawVariantsByPost: Record<string, any[]>;
}

const VALID_RANGES = new Set<string>(['7d', '14d', '30d', '90d', '365d', 'all']);
const VALID_SORTS = new Set<string>(['newest', 'top_engagement', 'top_views', 'top_eng_rate', 'most_discussed']);
const VALID_ORIGINS = new Set<string>(['all', 'flightplan', 'studio']);

export function parseSignalFilterSearchParams(searchParams: URLSearchParams): SignalFilterOptions {
  const rawRange = searchParams.get('range') || '30d';
  const range: SignalRange = VALID_RANGES.has(rawRange) ? (rawRange as SignalRange) : '30d';
  const rawSort = searchParams.get('sort') || 'newest';
  const sort = VALID_SORTS.has(rawSort) ? (rawSort as SignalFilterOptions['sort']) : 'newest';
  const rawOrigin = searchParams.get('origin') || 'all';
  const origin = VALID_ORIGINS.has(rawOrigin) ? (rawOrigin as SignalFilterOptions['origin']) : 'all';

  return {
    range,
    platform: searchParams.get('platform') || 'all',
    accountId: searchParams.get('account') || 'all',
    status: searchParams.get('status') || 'all',
    hook: searchParams.get('hook') || 'all',
    format: searchParams.get('format') || 'all',
    origin,
    search: searchParams.get('search') || '',
    sort,
    timezone: searchParams.get('tz') || 'UTC',
    comparePeriod: searchParams.get('compare') !== 'false',
  };
}

export async function loadWorkspaceSignalAnalytics(
  workspaceId: string,
  options: SignalFilterOptions = {},
  fetchLimit = 300
): Promise<LoadedSignalWorkspace> {
  // Resolve plan info + core workspace queries in parallel
  const [planInfoRaw, postsRes, connsRes] = await Promise.all([
    getWorkspacePlanInfo(workspaceId).catch(() => null),
    supabaseAdmin
      .from('posts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['published', 'scheduled', 'draft', 'failed', 'publishing'])
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(fetchLimit),
    supabaseAdmin
      .from('platform_connections')
      .select('id, platform, platform_user_id, username, display_name, status, updated_at')
      .eq('workspace_id', workspaceId),
  ]);

  if (postsRes.error) {
    throw new Error(`Failed to fetch workspace posts: ${postsRes.error.message}`);
  }

  const rawPosts = postsRes.data || [];
  const postIds = rawPosts.map((p: any) => p.id);
  const rawConnections = connsRes.data || [];

  const retentionDays =
    typeof planInfoRaw?.limits?.analytics_retention_days === 'number'
      ? planInfoRaw.limits.analytics_retention_days
      : 30;
  const csvExportAllowed =
    planInfoRaw?.features?.csv_export === true || planInfoRaw?.planId === 'pro' || planInfoRaw?.planId === 'studio';

  const lookbackDays = retentionDays > 0 ? Math.min(365, retentionDays) : 90;
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch variants + analytics_events + automation logs + tracked clicks + contacts in parallel
  const [variantsRes, eventsRes, commentLogsRes, dmLogsRes, flaggedRes, trackedClicksRes, vaultLeadsRes] = await Promise.all([
    postIds.length > 0
      ? supabaseAdmin
          .from('post_variants')
          .select('*')
          .in('post_id', postIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from('analytics_events')
      .select('event_type, event_data, created_at, referrer')
      .eq('workspace_id', workspaceId)
      .in('event_type', ['profile_view', 'link_click', 'profile_cta_click'])
      .gte('created_at', sinceIso)
      .limit(5000),
    supabaseAdmin
      .from('instagram_comment_logs')
      .select('id, media_id, dm_sent, lead_score, auto_replied')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceIso)
      .limit(2000),
    supabaseAdmin
      .from('instagram_dm_logs')
      .select('id, auto_replied, lead_score, follow_verified, follow_status')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceIso)
      .limit(2000),
    supabaseAdmin
      .from('instagram_flagged_comments')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
    supabaseAdmin
      .from('tracked_link_clicks')
      .select('id, campaign_id')
      .eq('workspace_id', workspaceId)
      .gte('clicked_at', sinceIso)
      .limit(2000)
      .then((r) => r, () => ({ data: [], error: null })),
    supabaseAdmin
      .from('workspace_contacts')
      .select('id, email, phone, intent_score')
      .eq('workspace_id', workspaceId)
      .limit(2000)
      .then((r) => r, () => ({ data: [], error: null })),
  ]);

  if (variantsRes.error) {
    throw new Error(`Failed to fetch post variants: ${variantsRes.error.message}`);
  }

  const rawVariants = variantsRes.data || [];
  const variantIds = rawVariants.map((v: any) => v.id);

  const platformPostsByVariant: Record<string, any[]> = {};
  if (variantIds.length > 0) {
    const { data: pPosts } = await supabaseAdmin
      .from('platform_posts')
      .select('*')
      .in('post_variant_id', variantIds);

    for (const pp of pPosts || []) {
      if (!platformPostsByVariant[pp.post_variant_id]) {
        platformPostsByVariant[pp.post_variant_id] = [];
      }
      platformPostsByVariant[pp.post_variant_id].push(pp);
    }
  }

  const connectionById: Record<string, any> = {};
  for (const conn of rawConnections) {
    connectionById[conn.id] = conn;
  }

  // Group variants cleanly by post_id without collapsing multi-account variants
  const rawVariantsByPost: Record<string, any[]> = {};
  const variantsByPostInput: Record<string, SignalPostInput['variants']> = {};

  for (const v of rawVariants) {
    if (!rawVariantsByPost[v.post_id]) rawVariantsByPost[v.post_id] = [];
    if (!variantsByPostInput[v.post_id]) variantsByPostInput[v.post_id] = [];

    const ppList = platformPostsByVariant[v.id] || [];
    const primaryPp = ppList[0];
    const resolvedConnId = v.platform_connection_id || primaryPp?.platform_connection_id || null;
    const connMeta = resolvedConnId ? connectionById[resolvedConnId] : undefined;

    rawVariantsByPost[v.post_id].push({ v, primaryPp, connMeta, resolvedConnId });

    variantsByPostInput[v.post_id].push({
      id: v.id,
      platform: v.platform,
      platformConnectionId: resolvedConnId,
      platformAccountId: connMeta?.platform_user_id ?? null,
      accountUsername: connMeta?.username ?? null,
      accountDisplayName: connMeta?.display_name ?? null,
      accountLabel: connMeta?.display_name || connMeta?.username || null,
      status: v.status,
      adaptedContent: v.adapted_content || '',
      hashtagStrategy: Array.isArray(v.hashtag_strategy) ? v.hashtag_strategy : [],
      firstCommentHint: v.first_comment_hint ?? null,
      scheduledAt: v.scheduled_at ?? null,
      publishedAt: v.published_at ?? primaryPp?.published_at ?? null,
      platformPostId: primaryPp?.platform_post_id || v.platform_post_id || null,
      platformUrl: primaryPp?.platform_url || v.platform_url || null,
      error: v.error ? (typeof v.error === 'string' ? v.error : v.error.message || JSON.stringify(v.error)) : null,
      syncStatus: primaryPp?.sync_status ?? null,
      syncError: primaryPp?.sync_error ?? null,
      lastSyncedAt: primaryPp?.last_synced_at ?? primaryPp?.engagement?._lastSyncedAt ?? primaryPp?.engagement?.syncedAt ?? null,
      rawEngagement: primaryPp?.engagement ?? null,
    });
  }

  const postInputs: SignalPostInput[] = rawPosts.map((p: any) => {
    const pVariants = variantsByPostInput[p.id] || [];
    const rawVars = (rawVariantsByPost[p.id] || []).map((entry: any) => entry.v?.media_urls);
    const collectedMediaUrls = Array.from(
      new Set(
        rawVars.flatMap(list =>
          Array.isArray(list)
            ? list.map((item: any) => (typeof item === 'string' ? item : item?.url)).filter((u): u is string => typeof u === 'string' && u.length > 0)
            : []
        )
      )
    );
    const telemetry = extractPostTelemetry({
      content: p.content || '',
      mediaUrls: collectedMediaUrls,
      variantMediaUrls: rawVars,
      platforms: pVariants.map(v => v.platform),
      existingHookType: p.hook_type,
      existingHookFormulaId: p.hook_formula_id,
      existingHookScore: p.hook_score,
      existingWordCount: p.word_count,
      existingHasMedia: p.has_media,
      existingMediaCount: p.media_count,
      existingFormat: p.content_format,
    });

    return {
      id: p.id,
      content: p.content || '',
      status: p.status,
      scheduledAt: p.scheduled_at ?? null,
      publishedAt: p.published_at ?? null,
      createdAt: p.created_at,
      updatedAt: p.updated_at || p.created_at,
      aiOrigin: p.arc_id || p.adaptation_prompt_version === 'schedule-engine-v1'
        ? 'flightplan'
        : p.adaptation_prompt_version === 'direct-broadcast'
        ? 'quick-broadcast'
        : 'ai-composer',
      arcId: p.arc_id ?? null,
      arcBeat: p.arc_beat ?? null,
      hookType: telemetry.hookType,
      hookFormulaId: telemetry.hookFormulaId,
      hookScore: telemetry.hookScore,
      wordCount: telemetry.wordCount,
      hasMedia: telemetry.hasMedia,
      mediaCount: telemetry.mediaCount,
      contentFormat: telemetry.contentFormat,
      campaignTag: p.campaign_tag ?? null,
      mediaUrls: collectedMediaUrls,
      variants: pVariants,
    };
  });

  const connectedAccountInputs: SignalConnectedAccountInput[] = rawConnections.map((c: any) => ({
    id: c.id,
    platform: c.platform,
    platformAccountId: c.id,
    accountLabel: c.display_name || c.username || null,
    username: c.username ?? null,
    status: c.status || 'connected',
    updatedAt: c.updated_at ?? null,
  }));

  // Bio-profile funnel aggregation from analytics_events
  let profileViews = 0;
  let profileLinkClicks = 0;
  let profileCtaClicks = 0;
  const linkCounts = new Map<string, { label: string; url: string; clicks: number }>();
  const referrerCounts = new Map<string, number>();

  for (const ev of eventsRes.data || []) {
    const data = (ev.event_data || {}) as Record<string, unknown>;
    if (ev.event_type === 'profile_view') {
      profileViews++;
      const ref = (typeof data.utm_source === 'string' && data.utm_source) || ev.referrer || 'Direct';
      referrerCounts.set(ref, (referrerCounts.get(ref) || 0) + 1);
    } else if (ev.event_type === 'link_click' || ev.event_type === 'profile_cta_click') {
      if (ev.event_type === 'profile_cta_click') profileCtaClicks++;
      else profileLinkClicks++;
      const url = String(data.link_url || data.url || data.linkUrl || data.href || '').trim();
      const label = String(data.link_text || data.linkText || data.label || data.title || url || 'Link').trim();
      if (url) {
        const key = `${label}|||${url}`;
        const existing = linkCounts.get(key);
        if (existing) existing.clicks++;
        else linkCounts.set(key, { label, url, clicks: 1 });
      }
    }
  }

  const totalBioClicks = profileLinkClicks + profileCtaClicks;
  const bioAnalytics: SignalBioAnalyticsInput = {
    profileViews,
    profileLinkClicks,
    profileCtaClicks,
    ctrPct: profileViews > 0 ? Math.round((totalBioClicks / profileViews) * 1000) / 10 : null,
    topLinks: Array.from(linkCounts.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 6),
    topReferrers: Array.from(referrerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count })),
  };

  // Automation conversion summary (separated cleanly from post engagement)
  const commentLogs = !commentLogsRes.error && commentLogsRes.data ? commentLogsRes.data : [];
  const dmLogs = !dmLogsRes.error && dmLogsRes.data ? dmLogsRes.data : [];
  const trackedClicks = !trackedClicksRes.error && Array.isArray(trackedClicksRes.data) ? trackedClicksRes.data : [];
  const vaultContacts = !vaultLeadsRes.error && Array.isArray(vaultLeadsRes.data) ? vaultLeadsRes.data : [];

  // Closed-Loop Hook-to-Lead attribution: map Instagram media_id -> post hookType
  const hookByMediaId = new Map<string, string>();
  for (const post of postInputs) {
    for (const v of post.variants) {
      if (v.platform === 'instagram' && v.platformPostId) {
        hookByMediaId.set(v.platformPostId, post.hookType || 'direct');
      }
    }
  }
  const hookConversionMap = new Map<string, { hookType: string; dmsSent: number; clicks: number; highIntentLeads: number }>();
  for (const c of commentLogs as any[]) {
    if (!c.media_id) continue;
    const hType = hookByMediaId.get(String(c.media_id));
    if (!hType) continue;
    const bucket = hookConversionMap.get(hType) || { hookType: hType, dmsSent: 0, clicks: 0, highIntentLeads: 0 };
    if (c.dm_sent) bucket.dmsSent += 1;
    if (Number(c.lead_score || 0) >= 2) bucket.highIntentLeads += 1;
    hookConversionMap.set(hType, bucket);
  }
  const topConvertingHooks = Array.from(hookConversionMap.values())
    .sort((a, b) => b.highIntentLeads + b.dmsSent - (a.highIntentLeads + a.dmsSent))
    .slice(0, 4);

  const automationSummary: SignalAutomationSummaryInput = {
    commentReplies: commentLogs.length,
    dmSent: commentLogs.filter((c: any) => c.dm_sent).length + dmLogs.filter((d: any) => d.auto_replied).length,
    followGateUnlocked: dmLogs.filter((d: any) => d.follow_verified === true).length,
    highIntentLeads:
      commentLogs.filter((c: any) => Number(c.lead_score || 0) >= 2).length +
      dmLogs.filter((d: any) => Number(d.lead_score || 0) >= 2).length,
    flaggedCount: typeof flaggedRes.count === 'number' ? flaggedRes.count : 0,
    trackedClicks: trackedClicks.length,
    leadsCaptured: vaultContacts.filter((v: any) => Boolean(v.email || v.phone)).length,
    topConvertingHooks,
  };

  const analytics = computeSignalAnalytics({
    posts: postInputs,
    connectedAccounts: connectedAccountInputs,
    bioAnalytics,
    automationSummary,
    planInfo: {
      planId: planInfoRaw?.planId || 'spark',
      planName: planInfoRaw?.planName || 'Spark',
      retentionDays,
      csvExportAllowed,
    },
    options,
  });

  return {
    analytics,
    rawPosts,
    rawVariantsByPost,
  };
}
