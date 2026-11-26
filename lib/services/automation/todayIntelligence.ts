import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { diagnoseCampaigns, type CampaignDiagnostic, type CampaignFunnelMetrics } from './campaignDoctor';
import { buildDemandRadarClusters, type DemandCluster } from './demandRadar';
import type { InstagramCampaign } from './campaignMatcher';

export interface NextBestAction {
  id: string;
  priority: 'urgent' | 'high' | 'medium';
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  metricBadge?: string;
}

export interface ExpiringHotLead {
  contactId: string;
  username: string;
  fullName?: string | null;
  intentScore: number;
  isVip: boolean;
  email?: string | null;
  hoursRemaining: number;
  lastDmAt: string;
}

export interface WatchdogStatus {
  healthy: boolean;
  tokenExpiringDays: number | null;
  connectionStatus: string;
  deadLetterCount: number;
  aiQualityStops7d: number;
  warnings: string[];
}

export interface TodayIntelligencePayload {
  todayPulse: {
    repliesSentToday: number;
    dmsSentToday: number;
    leadsCapturedToday: number;
    clicksToday: number;
    followUnlocksToday: number;
    aiQualityStopsToday: number;
    estimatedHoursSaved7d: number;
  };
  surge: {
    isSurging: boolean;
    lastHourComments: number;
    baselineHourlyAvg: number;
    multiplier: number;
  };
  momentum: {
    score: number; // 0..100
    label: 'Building' | 'Growing' | 'Unstoppable';
    streakDays: number;
    breakdown: {
      consistency: number;
      conversion: number;
      responsiveness: number;
      growth: number;
    };
  };
  nextBestActions: NextBestAction[];
  expiringHotLeads: ExpiringHotLead[];
  campaignDiagnostics: CampaignDiagnostic[];
  demandRadar: DemandCluster[];
  watchdog: WatchdogStatus;
  recentWins: Array<{
    id: string;
    type: 'lead' | 'click' | 'reply' | 'vip' | 'quality_stop';
    label: string;
    timestamp: string;
  }>;
}

export async function loadTodayIntelligence(workspaceId: string): Promise<TodayIntelligencePayload> {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgoIso = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgoIso = new Date(now - 60 * 60 * 1000).toISOString();

  const safeQuery = async <T,>(p: PromiseLike<{ data?: T | null; count?: number | null; error?: unknown }>): Promise<{ data: T | null; count: number }> => {
    try {
      const res = await p;
      return { data: (res?.data as T) ?? null, count: typeof res?.count === 'number' ? res.count : 0 };
    } catch {
      return { data: null, count: 0 };
    }
  };

  const [
    comments7dRes,
    dms7dRes,
    contactsRes,
    clicks7dRes,
    campaignsRes,
    enrollmentsRes,
    couponsRes,
    deadLetterRes,
    igConnRes,
    feedbackRes,
    flaggedCommentsRes,
    flaggedDmsRes,
  ] = await Promise.all([
    safeQuery(
      supabaseAdmin
        .from('instagram_comment_logs')
        .select('id, comment_text, commenter_username, classification, auto_replied, dm_sent, lead_score, ai_stop_reason, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', fourteenDaysAgoIso)
        .order('created_at', { ascending: false })
        .limit(500)
    ),
    safeQuery(
      supabaseAdmin
        .from('instagram_dm_logs')
        .select('id, sender_id, sender_username, message_text, classification, auto_replied, follow_verified, lead_score, ai_stop_reason, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', fourteenDaysAgoIso)
        .order('created_at', { ascending: false })
        .limit(500)
    ),
    safeQuery(
      supabaseAdmin
        .from('workspace_contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_interaction_at', { ascending: false })
        .limit(200)
    ),
    safeQuery(
      supabaseAdmin
        .from('tracked_link_clicks')
        .select('id, campaign_id, ab_variant, clicked_at')
        .eq('workspace_id', workspaceId)
        .gte('clicked_at', sevenDaysAgoIso)
        .limit(1000)
    ),
    safeQuery(
      supabaseAdmin
        .from('instagram_campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('priority', { ascending: true })
        .limit(50)
    ),
    safeQuery(
      supabaseAdmin
        .from('campaign_enrollments')
        .select('id, campaign_id, ab_variant, follow_verified, lead_captured, dm_sent_at, link_clicked_at, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', fourteenDaysAgoIso)
        .limit(1000)
    ),
    safeQuery(
      supabaseAdmin
        .from('campaign_coupons')
        .select('id, campaign_id, claimed_at')
        .eq('workspace_id', workspaceId)
        .limit(1000)
    ),
    safeQuery(
      supabaseAdmin
        .from('instagram_outbound_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'needs_review')
    ),
    safeQuery(
      supabaseAdmin
        .from('platform_connections')
        .select('id, status, username, expires_at')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'instagram')
        .limit(1)
    ),
    safeQuery(
      supabaseAdmin
        .from('ai_reply_feedback')
        .select('id, action, stop_reason, inbound_text, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', sevenDaysAgoIso)
        .order('created_at', { ascending: false })
        .limit(200)
    ),
    safeQuery(
      supabaseAdmin
        .from('instagram_flagged_comments')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
    ),
    safeQuery(
      supabaseAdmin
        .from('instagram_flagged_dms')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
    ),
  ]);

  const comments = Array.isArray(comments7dRes.data) ? (comments7dRes.data as any[]) : [];
  const dms = Array.isArray(dms7dRes.data) ? (dms7dRes.data as any[]) : [];
  const contacts = Array.isArray(contactsRes.data) ? (contactsRes.data as any[]) : [];
  const clicks = Array.isArray(clicks7dRes.data) ? (clicks7dRes.data as any[]) : [];
  const campaigns = Array.isArray(campaignsRes.data) ? (campaignsRes.data as InstagramCampaign[]) : [];
  const enrollments = Array.isArray(enrollmentsRes.data) ? (enrollmentsRes.data as any[]) : [];
  const coupons = Array.isArray(couponsRes.data) ? (couponsRes.data as any[]) : [];
  const feedbackRows = Array.isArray(feedbackRes.data) ? (feedbackRes.data as any[]) : [];

  const todayMs = Date.parse(todayIso);
  const sevenDayMs = Date.parse(sevenDaysAgoIso);
  const oneHourMs = Date.parse(oneHourAgoIso);

  const repliesSentToday = comments.filter((c) => c.auto_replied && Date.parse(c.created_at) >= todayMs).length;
  const dmsSentToday =
    comments.filter((c) => c.dm_sent && Date.parse(c.created_at) >= todayMs).length +
    dms.filter((d) => d.auto_replied && Date.parse(d.created_at) >= todayMs).length;
  const leadsCapturedToday = contacts.filter(
    (c) => (c.email || c.phone) && c.consent_at && Date.parse(c.consent_at) >= todayMs
  ).length;
  const clicksToday = clicks.filter((cl) => Date.parse(cl.clicked_at) >= todayMs).length;
  const followUnlocksToday = dms.filter((d) => d.follow_verified && Date.parse(d.created_at) >= todayMs).length;
  const aiQualityStopsToday = feedbackRows.filter(
    (f) => f.action === 'quality_stopped' && Date.parse(f.created_at) >= todayMs
  ).length;
  const aiQualityStops7d = feedbackRows.filter((f) => f.action === 'quality_stopped').length;

  const autoHandled7d =
    comments.filter((c) => c.auto_replied && Date.parse(c.created_at) >= sevenDayMs).length +
    dms.filter((d) => d.auto_replied && Date.parse(d.created_at) >= sevenDayMs).length;
  // Conservative 45 seconds saved per automated reply/DM
  const estimatedHoursSaved7d = Math.round(((autoHandled7d * 45) / 3600) * 10) / 10;

  // Surge detection
  const comments7dCount = comments.filter((c) => Date.parse(c.created_at) >= sevenDayMs).length;
  const lastHourComments = comments.filter((c) => Date.parse(c.created_at) >= oneHourMs).length;
  const baselineHourlyAvg = Math.round((comments7dCount / 168) * 10) / 10;
  const multiplier = baselineHourlyAvg >= 1 ? Math.round((lastHourComments / baselineHourlyAvg) * 10) / 10 : lastHourComments >= 8 ? 3.5 : 1;
  const isSurging = lastHourComments >= 6 && multiplier >= 3;

  // Expiring 24h Hot Leads (last_dm_at between 18h and 24h ago, intent_score >= 55)
  const expiringHotLeads: ExpiringHotLead[] = [];
  for (const c of contacts) {
    if (!c.last_dm_at) continue;
    const ageHours = (now - Date.parse(c.last_dm_at)) / (1000 * 60 * 60);
    const hoursRemaining = Math.round((24 - ageHours) * 10) / 10;
    if (hoursRemaining > 0 && hoursRemaining <= 8 && (Number(c.intent_score || 0) >= 55 || c.is_vip)) {
      expiringHotLeads.push({
        contactId: c.id,
        username: c.username || c.platform_user_id,
        fullName: c.full_name,
        intentScore: Number(c.intent_score || 0),
        isVip: Boolean(c.is_vip),
        email: c.email,
        hoursRemaining,
        lastDmAt: c.last_dm_at,
      });
    }
  }
  expiringHotLeads.sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  // Campaign Funnel Metrics -> Campaign Doctor
  const metricsByCampaign: Record<string, CampaignFunnelMetrics> = {};
  for (const camp of campaigns) {
    const campEnrolls = enrollments.filter((e) => e.campaign_id === camp.id);
    const campClicks = clicks.filter((cl) => cl.campaign_id === camp.id);
    const campCoupons = coupons.filter((cp) => cp.campaign_id === camp.id);
    metricsByCampaign[camp.id] = {
      campaignId: camp.id,
      campaignName: camp.name,
      triggered: Math.max(camp.total_sends || 0, campEnrolls.length),
      dmSent: campEnrolls.filter((e) => e.dm_sent_at).length || camp.total_sends || 0,
      followVerified: campEnrolls.filter((e) => e.follow_verified).length,
      leadsCaptured: campEnrolls.filter((e) => e.lead_captured).length,
      linkClicks: campClicks.length,
      variantASends: campEnrolls.filter((e) => e.ab_variant === 'A').length,
      variantAClicks: campClicks.filter((cl) => cl.ab_variant === 'A').length,
      variantBSends: campEnrolls.filter((e) => e.ab_variant === 'B').length,
      variantBClicks: campClicks.filter((cl) => cl.ab_variant === 'B').length,
      availableCoupons: campCoupons.filter((cp) => !cp.claimed_at).length,
      totalCoupons: campCoupons.length,
    };
  }
  const campaignDiagnostics = diagnoseCampaigns(campaigns, metricsByCampaign);

  // Audience Demand Radar
  const demandRadar = buildDemandRadarClusters([
    ...comments.map((c) => ({ text: c.comment_text || '', classification: c.classification, createdAt: c.created_at })),
    ...dms.map((d) => ({ text: d.message_text || '', classification: d.classification, createdAt: d.created_at })),
  ]);

  // Watchdog health
  const igConn = Array.isArray(igConnRes.data) ? (igConnRes.data as any[])[0] : null;
  let tokenExpiringDays: number | null = null;
  const warnings: string[] = [];
  if (!igConn) {
    warnings.push('Connect your Instagram Business/Creator account to activate SignalDM.');
  } else if (igConn.status !== 'connected') {
    warnings.push(`Instagram connection is ${igConn.status} — reconnect to resume replies.`);
  } else if (igConn.expires_at) {
    tokenExpiringDays = Math.max(0, Math.round((Date.parse(igConn.expires_at) - now) / (1000 * 60 * 60 * 24)));
    if (tokenExpiringDays <= 7) {
      warnings.push(`Instagram token expires in ${tokenExpiringDays} day(s) — refresh recommended.`);
    }
  }
  const deadLetterCount = deadLetterRes.count;
  if (deadLetterCount > 0) {
    warnings.push(`${deadLetterCount} failed outbound job(s) waiting for 1-click Replay.`);
  }

  // Momentum Score (0..100)
  const activeDays = new Set(
    [...comments, ...dms]
      .filter((x) => Date.parse(x.created_at) >= sevenDayMs)
      .map((x) => new Date(x.created_at).toISOString().slice(0, 10))
  ).size;
  const consistency = Math.min(25, Math.round((activeDays / 7) * 25));
  const responsiveness = autoHandled7d > 0 ? Math.min(25, 10 + Math.round(Math.min(1, autoHandled7d / 20) * 15)) : 0;
  const leads7d = contacts.filter((c) => c.email || c.phone).length;
  const conversion = Math.min(25, leads7d * 4 + clicks.length * 2);
  const growth = Math.min(25, campaigns.filter((c) => c.is_active).length * 8 + dms.filter((d) => d.follow_verified).length * 3);
  const momentumScore = Math.max(0, Math.min(100, consistency + responsiveness + conversion + growth));
  const momentumLabel = momentumScore >= 75 ? 'Unstoppable' : momentumScore >= 40 ? 'Growing' : 'Building';

  // Ranked Next-Best-Actions (max 3 — zero clutter!)
  const nextBestActions: NextBestAction[] = [];
  const pendingTriage = flaggedCommentsRes.count + flaggedDmsRes.count;
  if (expiringHotLeads.length > 0) {
    nextBestActions.push({
      id: 'expiring_hot_leads',
      priority: 'urgent',
      title: `${expiringHotLeads.length} hot lead${expiringHotLeads.length > 1 ? 's' : ''} closing 24h DM window`,
      subtitle: `@${expiringHotLeads[0].username} (Intent ${expiringHotLeads[0].intentScore}/100) has ${expiringHotLeads[0].hoursRemaining}h left before Meta closes direct replies.`,
      ctaLabel: 'Open Leads CRM',
      href: '/dashboard/automation?tab=leads',
      metricBadge: `${expiringHotLeads[0].hoursRemaining}h left`,
    });
  }
  if (pendingTriage > 0) {
    nextBestActions.push({
      id: 'pending_triage',
      priority: 'high',
      title: `Review ${pendingTriage} item${pendingTriage > 1 ? 's' : ''} in Triage Queue`,
      subtitle: 'Your edits automatically train Unool AI to write in your exact tone.',
      ctaLabel: 'Open Triage',
      href: '/dashboard/automation?tab=inbox',
      metricBadge: `${pendingTriage} waiting`,
    });
  }
  if (campaigns.filter((c) => c.is_active).length === 0) {
    nextBestActions.push({
      id: 'launch_first_campaign',
      priority: 'high',
      title: 'Launch your first Keyword → DM Campaign',
      subtitle: 'Pick one of 6 proven playbooks (Lead Magnet, Price Drop, Giveaway) in 60 seconds.',
      ctaLabel: 'Launch Campaign',
      href: '/dashboard/automation?tab=campaigns',
      metricBadge: '60s setup',
    });
  } else if (campaignDiagnostics.length > 0) {
    const topDiag = campaignDiagnostics[0];
    nextBestActions.push({
      id: `diag_${topDiag.campaignId}`,
      priority: topDiag.severity === 'critical' ? 'urgent' : 'medium',
      title: topDiag.headline,
      subtitle: topDiag.suggestedAction,
      ctaLabel: 'Fix Campaign',
      href: '/dashboard/automation?tab=campaigns',
    });
  }
  if (demandRadar.length > 0 && nextBestActions.length < 3) {
    const topDemand = demandRadar[0];
    nextBestActions.push({
      id: `demand_${topDemand.id}`,
      priority: 'medium',
      title: `${topDemand.count} people asked about ${topDemand.topic}`,
      subtitle: `Turn this proven demand into your next Reel with 1-click auto-DM "${topDemand.suggestedKeyword}".`,
      ctaLabel: 'Draft in Studio',
      href: `/dashboard/composer?prompt=${encodeURIComponent(topDemand.suggestedPostHook)}&keyword=${encodeURIComponent(topDemand.suggestedKeyword)}`,
      metricBadge: `${topDemand.count} asks`,
    });
  }

  // Recent Wins timeline (for dopamine micro-proof!)
  const recentWins: TodayIntelligencePayload['recentWins'] = [];
  for (const c of contacts.slice(0, 6)) {
    if (c.email || c.phone) {
      recentWins.push({
        id: `lead_${c.id}`,
        type: c.is_vip ? 'vip' : 'lead',
        label: `Captured ${c.email || c.phone} from @${c.username || 'follower'}${c.is_vip ? ' (VIP)' : ''}`,
        timestamp: c.consent_at || c.last_interaction_at,
      });
    }
  }
  for (const f of feedbackRows.filter((x) => x.action === 'quality_stopped').slice(0, 4)) {
    recentWins.push({
      id: `stop_${f.id}`,
      type: 'quality_stop',
      label: `AI Quality Gate stopped a weak reply (${f.stop_reason || 'low confidence'})`,
      timestamp: f.created_at,
    });
  }
  recentWins.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return {
    todayPulse: {
      repliesSentToday,
      dmsSentToday,
      leadsCapturedToday,
      clicksToday,
      followUnlocksToday,
      aiQualityStopsToday,
      estimatedHoursSaved7d,
    },
    surge: {
      isSurging,
      lastHourComments,
      baselineHourlyAvg,
      multiplier,
    },
    momentum: {
      score: momentumScore,
      label: momentumLabel,
      streakDays: activeDays,
      breakdown: { consistency, conversion, responsiveness, growth },
    },
    nextBestActions: nextBestActions.slice(0, 3),
    expiringHotLeads: expiringHotLeads.slice(0, 8),
    campaignDiagnostics: campaignDiagnostics.slice(0, 6),
    demandRadar,
    watchdog: {
      healthy: warnings.length === 0,
      tokenExpiringDays,
      connectionStatus: igConn?.status || 'not_connected',
      deadLetterCount,
      aiQualityStops7d,
      warnings,
    },
    recentWins: recentWins.slice(0, 8),
  };
}
