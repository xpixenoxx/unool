/**
 * Canonical Signal Analytics Engine (Single Source of Truth)
 *
 * Powers Overview, Content & Hooks, Timing & Cadence, Channels & Funnel,
 * API routes (`/api/signal/analytics`, `/api/signal/resonance`, `/api/signal/export`),
 * and UI drill-downs using one unified set of verified formulas.
 */

import { extractExtendedEngagement } from '@/lib/services/analytics/normalize';
import {
  canonicalPlatformId,
  getPlatformCapability,
  type PlatformCapability,
} from '@/lib/analytics/platformCapabilities';
import {
  extractPostTelemetry,
  getWordCountBracket,
  HOOK_TYPE_META,
  type ContentFormat,
  type HookType,
  type WordCountBracket,
} from '@/lib/analytics/postTelemetry';

export type SignalRange = '7d' | '14d' | '30d' | '90d' | '365d' | 'all';
export type SignalSort = 'newest' | 'top_engagement' | 'top_views' | 'top_eng_rate' | 'most_discussed';
export type SignalOriginFilter = 'all' | 'flightplan' | 'studio';
export type SampleConfidence = 'low' | 'directional' | 'established';

export interface SignalVariantInput {
  id: string;
  platform: string;
  platformConnectionId?: string | null;
  platformAccountId?: string | null;
  accountUsername?: string | null;
  accountDisplayName?: string | null;
  accountLabel?: string | null;
  status: string;
  adaptedContent?: string;
  hashtagStrategy?: string[];
  firstCommentHint?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  platformPostId?: string | null;
  platformUrl?: string | null;
  error?: string | null;
  syncStatus?: string | null;
  syncError?: string | null;
  lastSyncedAt?: string | null;
  rawEngagement?: Record<string, unknown> | null;
}

export interface SignalPostInput {
  id: string;
  content: string;
  status: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  aiOrigin?: string | null;
  arcId?: string | null;
  arcBeat?: string | null;
  hookType?: string | null;
  hookFormulaId?: number | null;
  hookScore?: number | null;
  wordCount?: number | null;
  hasMedia?: boolean | null;
  mediaCount?: number | null;
  contentFormat?: string | null;
  campaignTag?: string | null;
  mediaUrls?: unknown[];
  variants: SignalVariantInput[];
}

export interface SignalConnectedAccountInput {
  id: string;
  platform: string;
  platformAccountId?: string | null;
  accountLabel?: string | null;
  username?: string | null;
  status: string;
  updatedAt?: string | null;
}

export interface SignalBioAnalyticsInput {
  profileViews: number;
  profileLinkClicks: number;
  profileCtaClicks: number;
  ctrPct: number | null;
  topLinks: Array<{ label: string; url: string; clicks: number }>;
  topReferrers: Array<{ source: string; count: number }>;
}

export interface SignalAutomationSummaryInput {
  commentReplies: number;
  dmSent: number;
  followGateUnlocked: number;
  highIntentLeads: number;
  flaggedCount: number;
}

export interface SignalPlanContextInput {
  planId: string;
  planName: string;
  retentionDays: number; // -1 = unlimited
  csvExportAllowed: boolean;
}

export interface SignalFilterOptions {
  range?: SignalRange;
  platform?: string;
  accountId?: string;
  status?: string;
  hook?: string;
  format?: string;
  origin?: SignalOriginFilter;
  search?: string;
  sort?: SignalSort;
  timezone?: string;
  comparePeriod?: boolean;
  now?: Date;
}

export interface EnrichedVariantMetrics {
  id: string;
  platform: string;
  canonicalPlatform: string;
  platformAccountId: string | null;
  accountLabel: string | null;
  status: string;
  adaptedContent: string;
  hashtagStrategy: string[];
  firstCommentHint: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  platformUrl: string | null;
  error: string | null;
  syncStatus: string;
  syncError: string | null;
  lastSyncedAt: string | null;
  capability: PlatformCapability;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  views: number | null; // null when platform API does not expose views
  totalEngagements: number;
  engagementRate: number | null; // null unless views !== null && views > 0
  hasRealData: boolean;
  rawExtras: Record<string, number | string | boolean>;
}

export interface EnrichedSignalPost {
  id: string;
  content: string;
  status: string;
  effectiveStatus: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  aiOrigin: string | null;
  arcId: string | null;
  arcBeat: string | null;
  campaignTag: string | null;
  originKind: 'flightplan' | 'studio';
  hookType: HookType;
  hookLabel: string;
  hookColor: string;
  hookFormulaId: number | null;
  hookScore: number;
  wordCount: number;
  wordCountBracket: WordCountBracket;
  hasMedia: boolean;
  mediaCount: number;
  contentFormat: ContentFormat;
  mediaUrls: unknown[];
  goldenHourRemainingMin: number;
  isGoldenHour: boolean;
  variants: EnrichedVariantMetrics[];
  scopedEngagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    views: number | null;
    totalEngagements: number;
    engagementRate: number | null;
    hasRealData: boolean;
    hasViewCapableVariant: boolean;
    lastSyncedAt: string | null;
  };
}

export interface ChannelRollup {
  key: string; // `${platform}::${accountId || 'default'}`
  platform: string;
  label: string;
  platformAccountId: string | null;
  accountLabel: string | null;
  connectionStatus: string;
  capability: PlatformCapability;
  variantCount: number;
  publishedCount: number;
  failedCount: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  views: number | null;
  totalEngagements: number;
  avgEngagementsPerPost: number;
  weightedEngagementRate: number | null;
  lastSyncedAt: string | null;
}

export interface HookPerformanceRow {
  hookType: HookType;
  label: string;
  color: string;
  publishedCount: number;
  totalEngagements: number;
  avgEngagements: number;
  medianEngagements: number;
  avgViews: number | null;
  shareOfPublishedPct: number;
  confidence: SampleConfidence;
  bestPostId: string | null;
}

export interface WordBracketRow {
  id: WordCountBracket;
  label: string;
  rangeLabel: string;
  publishedCount: number;
  avgEngagements: number;
  medianEngagements: number;
  avgViews: number | null;
}

export interface TimingCell {
  dayIndex: number; // 0 = Sun .. 6 = Sat
  hour: number;     // 0..23
  count: number;
  totalEngagements: number;
  avgEngagements: number;
  totalViews: number;
  postIds: string[];
}

export interface DeterministicRecommendation {
  id: string;
  category: 'hook' | 'timing' | 'media' | 'channel' | 'funnel' | 'operations';
  title: string;
  detail: string;
  sampleSize: number;
  confidence: SampleConfidence;
  badge: 'Rule-based';
  actionLabel: string;
  actionHref: string;
}

export interface SignalAnalyticsPayload {
  meta: {
    timezone: string;
    requestedRange: SignalRange;
    effectiveRange: SignalRange;
    requestedDays: number;
    effectiveDays: number;
    retentionDays: number;
    truncatedByPlan: boolean;
    planId: string;
    planName: string;
    csvExportAllowed: boolean;
    comparePeriod: boolean;
    generatedAt: string;
  };
  syncHealth: {
    status: 'no_accounts' | 'healthy' | 'partial' | 'pending' | 'degraded';
    connectedAccountCount: number;
    expiredAccountCount: number;
    totalPublishedVariants: number;
    syncedVariants: number;
    pendingVariants: number;
    unsupportedVariants: number;
    erroredOrRateLimitedVariants: number;
    lastSyncedAt: string | null;
  };
  operational: {
    totalPosts: number;
    publishedPosts: number;
    publishingPosts: number;
    scheduledPosts: number;
    draftPosts: number;
    failedPosts: number;
    partialFailurePosts: number;
    overdueScheduledPosts: number;
  };
  kpis: {
    views: { value: number; priorValue: number; deltaPct: number; eligibleVariants: number };
    totalEngagements: { value: number; priorValue: number; deltaPct: number };
    avgEngagementsPerPost: {
      value: number;
      median: number;
      sampleSize: number;
      priorValue: number;
      deltaPct: number;
    };
    weightedEngagementRate: {
      value: number | null;
      numeratorEngagements: number;
      denominatorViews: number;
      eligibleVariants: number;
      priorValue: number | null;
    };
    publishedCount: { value: number; priorValue: number; deltaPct: number };
    momentumPct: { value: number; currAvg: number; prevAvg: number; sampleSize: number };
    resonanceScore: {
      value: number | null;
      components: {
        engagementVolume: number;
        viewReach: number;
        consistency: number;
        momentum: number;
      } | null;
    };
  };
  dailySeries: Array<{
    date: string;
    label: string;
    views: number;
    engagements: number;
    posts: number;
    prevViews: number;
    prevEngagements: number;
  }>;
  channelBreakdown: ChannelRollup[];
  hookBreakdown: HookPerformanceRow[];
  wordCountBrackets: WordBracketRow[];
  mediaComparison: {
    withMediaCount: number;
    withoutMediaCount: number;
    withMediaAvg: number;
    withoutMediaAvg: number;
    liftPct: number | null;
    confidence: SampleConfidence;
  };
  timing: {
    timezone: string;
    publishedSampleCount: number;
    dayNames: string[];
    dayStats: Array<{ dayIndex: number; label: string; count: number; avgEngagements: number; medianEngagements: number }>;
    hourStats: Array<{ hour: number; label: string; count: number; avgEngagements: number }>;
    bestSlots: Array<{ dayIndex: number; dayName: string; hour: number; hourLabel: string; count: number; avgEngagements: number; confidence: SampleConfidence }>;
    heatmap: TimingCell[][]; // 7 rows x 24 cols
  };
  funnels: {
    bioProfile: SignalBioAnalyticsInput;
    automation: SignalAutomationSummaryInput;
  };
  recommendations: DeterministicRecommendation[];
  posts: EnrichedSignalPost[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function validateTimezone(tz?: string | null): string {
  const candidate = (tz || '').trim();
  if (!candidate) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return 'UTC';
  }
}

export function getZonedParts(isoOrDate: string | Date, timeZone: string): {
  dateKey: string;
  dayIndex: number;
  hour: number;
} {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) {
    return { dateKey: '1970-01-01', dayIndex: 0, hour: 0 };
  }
  const safeTz = validateTimezone(timeZone);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  let year = '1970';
  let month = '01';
  let day = '01';
  let weekday = 'Sun';
  let hourNum = 0;

  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'day') day = part.value;
    else if (part.type === 'weekday') weekday = part.value;
    else if (part.type === 'hour') {
      const parsed = parseInt(part.value, 10);
      hourNum = Number.isFinite(parsed) ? (parsed === 24 ? 0 : parsed) : 0;
    }
  }

  return {
    dateKey: `${year}-${month}-${day}`,
    dayIndex: SHORT_WEEKDAY_TO_INDEX[weekday] ?? 0,
    hour: Math.max(0, Math.min(23, hourNum)),
  };
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

export function confidenceForSample(n: number): SampleConfidence {
  if (n >= 10) return 'established';
  if (n >= 3) return 'directional';
  return 'low';
}

export function calcDeltaPct(current: number, previous: number): number {
  if (previous > 0) {
    return Math.round(((current - previous) / previous) * 100);
  }
  return current > 0 ? 100 : 0;
}

export function rangeToDays(range: SignalRange): number {
  switch (range) {
    case '7d':
      return 7;
    case '14d':
      return 14;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '365d':
      return 365;
    case 'all':
    default:
      return 3650;
  }
}

export function clampRangeToRetention(
  requestedRange: SignalRange,
  retentionDays: number
): {
  requestedRange: SignalRange;
  effectiveRange: SignalRange;
  requestedDays: number;
  effectiveDays: number;
  truncatedByPlan: boolean;
} {
  const requestedDays = rangeToDays(requestedRange);
  if (!retentionDays || retentionDays <= 0 || requestedDays <= retentionDays) {
    return {
      requestedRange,
      effectiveRange: requestedRange,
      requestedDays,
      effectiveDays: requestedDays,
      truncatedByPlan: false,
    };
  }
  let effectiveRange: SignalRange = requestedRange;
  if (retentionDays <= 30) effectiveRange = '30d';
  else if (retentionDays <= 90) effectiveRange = '90d';
  else if (retentionDays <= 365) effectiveRange = '365d';

  return {
    requestedRange,
    effectiveRange,
    requestedDays,
    effectiveDays: retentionDays,
    truncatedByPlan: true,
  };
}

function extractRawExtras(raw: Record<string, unknown>): Record<string, number | string | boolean> {
  const extras: Record<string, number | string | boolean> = {};
  const candidateKeys = [
    'readingTimeMinutes',
    'downvotes',
    'upvoteRatio',
    'score',
    'sent',
    'to_send',
    'engagedUsers',
    'pageViews',
    'reach',
    'outboundClicks',
    'retweets',
    'quotes',
    'replies',
  ];
  for (const key of candidateKeys) {
    const val = raw[key];
    if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') {
      extras[key] = val;
    }
  }
  return extras;
}

function parseTimestamp(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function resolvePostEffectiveTimestamp(post: SignalPostInput): number {
  const publishedMs =
    parseTimestamp(post.publishedAt) ??
    post.variants
      .map(v => parseTimestamp(v.publishedAt))
      .find((t): t is number => t !== null) ??
    null;

  if (publishedMs !== null) return publishedMs;
  return parseTimestamp(post.scheduledAt) ?? parseTimestamp(post.createdAt) ?? 0;
}

function resolveVariantMetrics(
  variant: SignalVariantInput,
  accountLookup: Map<string, SignalConnectedAccountInput>
): EnrichedVariantMetrics {
  const canon = canonicalPlatformId(variant.platform);
  const capability = getPlatformCapability(canon);
  const raw = (variant.rawEngagement || {}) as Record<string, unknown>;
  const normalized = extractExtendedEngagement(raw);

  const likes = capability.supportedMetrics.likes ? normalized.likes : 0;
  const comments = capability.supportedMetrics.comments ? normalized.comments : 0;
  const shares = capability.supportedMetrics.shares ? normalized.shares : 0;
  const saves = capability.supportedMetrics.saves ? normalized.saves : 0;
  const clicks = capability.supportedMetrics.clicks ? normalized.clicks : 0;

  const views: number | null = capability.supportedMetrics.views ? normalized.views : null;
  const totalEngagements = likes + comments + shares + saves + clicks;
  const engagementRate =
    views !== null && views > 0
      ? Math.round((totalEngagements / views) * 10000) / 100
      : null;

  const lastSyncedAt =
    variant.lastSyncedAt ||
    (typeof raw._lastSyncedAt === 'string' ? raw._lastSyncedAt : null);

  let syncStatus = variant.syncStatus || 'pending';
  if (capability.telemetryTier === 'publish_only') {
    syncStatus = 'unsupported';
  } else if (syncStatus === 'pending' && lastSyncedAt) {
    syncStatus = raw._syncError ? 'error' : 'synced';
  }

  const accountIdKey = variant.platformConnectionId || variant.platformAccountId || null;
  const acct = accountIdKey
    ? accountLookup.get(`${canon}::${accountIdKey}`) || accountLookup.get(`${canon}::id::${accountIdKey}`)
    : undefined;

  return {
    id: variant.id,
    platform: variant.platform,
    canonicalPlatform: canon,
    platformAccountId: accountIdKey,
    accountLabel:
      variant.accountLabel ||
      variant.accountDisplayName ||
      variant.accountUsername ||
      acct?.accountLabel ||
      acct?.username ||
      null,
    status: variant.status,
    adaptedContent: variant.adaptedContent || '',
    hashtagStrategy: Array.isArray(variant.hashtagStrategy) ? variant.hashtagStrategy : [],
    firstCommentHint: variant.firstCommentHint ?? null,
    scheduledAt: variant.scheduledAt ?? null,
    publishedAt: variant.publishedAt ?? null,
    platformPostId: variant.platformPostId ?? null,
    platformUrl: variant.platformUrl ?? null,
    error: variant.error ?? null,
    syncStatus,
    syncError: variant.syncError ?? (typeof raw._syncError === 'string' ? raw._syncError : null),
    lastSyncedAt,
    capability,
    likes,
    comments,
    shares,
    saves,
    clicks,
    views,
    totalEngagements,
    engagementRate,
    hasRealData: normalized.hasRealData || (views !== null && views > 0) || totalEngagements > 0,
    rawExtras: extractRawExtras(raw),
  };
}

function sanitizeSearch(raw?: string): string {
  return (raw || '').trim().toLowerCase();
}

export function computeSignalAnalytics(input: {
  posts: SignalPostInput[];
  connectedAccounts: SignalConnectedAccountInput[];
  bioAnalytics?: SignalBioAnalyticsInput;
  automationSummary?: SignalAutomationSummaryInput;
  planInfo?: SignalPlanContextInput;
  options?: SignalFilterOptions;
}): SignalAnalyticsPayload {
  const options = input.options || {};
  const now = options.now || new Date();
  const nowMs = now.getTime();
  const timezone = validateTimezone(options.timezone);
  const requestedRange: SignalRange = options.range || '30d';
  const plan: SignalPlanContextInput = input.planInfo || {
    planId: 'spark',
    planName: 'Spark',
    retentionDays: -1,
    csvExportAllowed: true,
  };

  const rangeMeta = clampRangeToRetention(requestedRange, plan.retentionDays);
  const effectiveDays = rangeMeta.effectiveDays;
  const comparePeriod = Boolean(options.comparePeriod);

  const windowMs = effectiveDays * 24 * 60 * 60 * 1000;
  const windowStartMs = rangeMeta.effectiveRange === 'all' && plan.retentionDays <= 0
    ? 0
    : nowMs - windowMs;
  const prevWindowStartMs = windowStartMs > 0 ? Math.max(0, windowStartMs - windowMs) : 0;

  const filterPlatform = options.platform && options.platform !== 'all'
    ? canonicalPlatformId(options.platform)
    : null;
  const filterAccount = options.accountId && options.accountId !== 'all'
    ? options.accountId
    : null;
  const filterStatus = options.status && options.status !== 'all' ? options.status : null;
  const filterHook = options.hook && options.hook !== 'all' ? options.hook : null;
  const filterFormat = options.format && options.format !== 'all' ? options.format : null;
  const filterOrigin: SignalOriginFilter = options.origin || 'all';
  const searchQuery = sanitizeSearch(options.search);
  const sortMode: SignalSort = options.sort || 'newest';

  const accountLookup = new Map<string, SignalConnectedAccountInput>();
  for (const acct of input.connectedAccounts) {
    const canon = canonicalPlatformId(acct.platform);
    if (acct.platformAccountId) {
      accountLookup.set(`${canon}::${acct.platformAccountId}`, acct);
    }
    accountLookup.set(`${canon}::id::${acct.id}`, acct);
  }

  // Step 1: Enrich all posts deterministically
  const enrichedAll: EnrichedSignalPost[] = input.posts.map(post => {
    const variants = post.variants.map(v => resolveVariantMetrics(v, accountLookup));
    const hasPublishedVariant = variants.some(v => v.status === 'published');
    const hasPublishingVariant = variants.some(v => v.status === 'publishing');
    const hasFailedVariant = variants.some(v => v.status === 'failed');

    let effectiveStatus = post.status;
    if (post.status === 'published' || hasPublishedVariant) {
      effectiveStatus = 'published';
    } else if (post.status === 'publishing' || hasPublishingVariant) {
      effectiveStatus = 'publishing';
    } else if (post.status === 'failed' || (hasFailedVariant && variants.every(v => v.status === 'failed' || v.status === 'cancelled'))) {
      effectiveStatus = 'failed';
    }

    const telemetry = extractPostTelemetry({
      content: post.content,
      mediaUrls: post.mediaUrls,
      variantMediaUrls: [],
      platforms: variants.map(v => v.canonicalPlatform),
      existingHookType: post.hookType,
      existingHookFormulaId: post.hookFormulaId,
      existingHookScore: post.hookScore,
      existingWordCount: post.wordCount,
      existingHasMedia: post.hasMedia,
      existingMediaCount: post.mediaCount,
      existingFormat: post.contentFormat,
    });

    const hookMeta = HOOK_TYPE_META[telemetry.hookType];

    // Golden Hour from published_at ?? createdAt
    const publishedRef =
      post.publishedAt ||
      variants.find(v => v.status === 'published' && v.publishedAt)?.publishedAt ||
      post.createdAt;
    const refMs = parseTimestamp(publishedRef) ?? nowMs;
    const ageHours = Math.max(0, (nowMs - refMs) / (1000 * 60 * 60));
    const isGoldenHour = effectiveStatus === 'published' && ageHours < 1;
    const goldenHourRemainingMin = isGoldenHour ? Math.max(1, Math.round((1 - ageHours) * 60)) : 0;

    // Scoped engagement respects active platform/account filter cleanly
    const scopedVariants = variants.filter(v => {
      if (filterPlatform && v.canonicalPlatform !== filterPlatform) return false;
      if (filterAccount && v.platformAccountId !== filterAccount && v.id !== filterAccount) return false;
      return true;
    });

    const likes = scopedVariants.reduce((s, v) => s + v.likes, 0);
    const comments = scopedVariants.reduce((s, v) => s + v.comments, 0);
    const shares = scopedVariants.reduce((s, v) => s + v.shares, 0);
    const saves = scopedVariants.reduce((s, v) => s + v.saves, 0);
    const clicks = scopedVariants.reduce((s, v) => s + v.clicks, 0);
    const viewVariants = scopedVariants.filter(v => v.views !== null);
    const viewsSum = viewVariants.reduce((s, v) => s + (v.views ?? 0), 0);
    const hasViewCapableVariant = viewVariants.length > 0;
    const totalEngagements = likes + comments + shares + saves + clicks;

    const engVariantsWithViews = viewVariants.filter(v => (v.views ?? 0) > 0);
    const rateNum = engVariantsWithViews.reduce((s, v) => s + v.totalEngagements, 0);
    const rateDen = engVariantsWithViews.reduce((s, v) => s + (v.views ?? 0), 0);
    const engagementRate = rateDen > 0 ? Math.round((rateNum / rateDen) * 10000) / 100 : null;

    const lastSyncedAt =
      scopedVariants
        .map(v => v.lastSyncedAt)
        .filter((s): s is string => Boolean(s))
        .sort()
        .pop() ?? null;

    const originKind: 'flightplan' | 'studio' =
      post.arcId || post.aiOrigin === 'flightplan' ? 'flightplan' : 'studio';

    return {
      id: post.id,
      content: post.content,
      status: post.status,
      effectiveStatus,
      scheduledAt: post.scheduledAt ?? null,
      publishedAt: publishedRef || null,
      createdAt: post.createdAt,
      aiOrigin: post.aiOrigin ?? null,
      arcId: post.arcId ?? null,
      arcBeat: post.arcBeat ?? null,
      campaignTag: post.campaignTag ?? null,
      originKind,
      hookType: telemetry.hookType,
      hookLabel: hookMeta.label,
      hookColor: hookMeta.color,
      hookFormulaId: telemetry.hookFormulaId,
      hookScore: telemetry.hookScore,
      wordCount: telemetry.wordCount,
      wordCountBracket: getWordCountBracket(telemetry.wordCount).id,
      hasMedia: telemetry.hasMedia,
      mediaCount: telemetry.mediaCount,
      contentFormat: telemetry.contentFormat,
      mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
      goldenHourRemainingMin,
      isGoldenHour,
      variants,
      scopedEngagement: {
        likes,
        comments,
        shares,
        saves,
        clicks,
        views: hasViewCapableVariant ? viewsSum : null,
        totalEngagements,
        engagementRate,
        hasRealData: scopedVariants.some(v => v.hasRealData),
        hasViewCapableVariant,
        lastSyncedAt,
      },
    };
  });

  // Step 2: Filter helper matching non-date filters (for period comparison)
  const matchesAttributeFilters = (p: EnrichedSignalPost, includeStatusFilter = true): boolean => {
    if (filterPlatform && !p.variants.some(v => v.canonicalPlatform === filterPlatform)) return false;
    if (filterAccount && !p.variants.some(v => v.platformAccountId === filterAccount || v.id === filterAccount)) return false;
    if (includeStatusFilter && filterStatus && p.effectiveStatus !== filterStatus) return false;
    if (filterHook && p.hookType !== filterHook) return false;
    if (filterFormat && p.contentFormat !== filterFormat) return false;
    if (filterOrigin !== 'all' && p.originKind !== filterOrigin) return false;
    if (searchQuery) {
      const inMain = p.content.toLowerCase().includes(searchQuery);
      const inVariant = p.variants.some(v => (v.adaptedContent || '').toLowerCase().includes(searchQuery));
      if (!inMain && !inVariant) return false;
    }
    return true;
  };

  // Current window posts matching all attribute filters
  const currentWindowAllStatus = enrichedAll.filter(p => {
    if (!matchesAttributeFilters(p, false)) return false;
    const ts = resolvePostEffectiveTimestamp(p);
    // Keep operational scheduled / publishing / draft posts visible in feed regardless of age if in range=all or created recently
    if (p.effectiveStatus === 'scheduled' || p.effectiveStatus === 'publishing') {
      return ts >= windowStartMs || (parseTimestamp(p.createdAt) ?? 0) >= windowStartMs;
    }
    return ts >= windowStartMs;
  });

  const filteredPostsForFeed = currentWindowAllStatus.filter(p => matchesAttributeFilters(p, true));

  // Published posts strictly inside current window vs previous equal window
  const currentPublishedPosts = currentWindowAllStatus.filter(p => p.effectiveStatus === 'published');
  const previousPublishedPosts =
    windowStartMs > 0
      ? enrichedAll.filter(p => {
          if (!matchesAttributeFilters(p, false)) return false;
          if (p.effectiveStatus !== 'published') return false;
          const ts = resolvePostEffectiveTimestamp(p);
          return ts >= prevWindowStartMs && ts < windowStartMs;
        })
      : [];

  // Operational pipeline counts
  const operational = {
    totalPosts: currentWindowAllStatus.length,
    publishedPosts: currentPublishedPosts.length,
    publishingPosts: currentWindowAllStatus.filter(p => p.effectiveStatus === 'publishing').length,
    scheduledPosts: currentWindowAllStatus.filter(p => p.effectiveStatus === 'scheduled').length,
    draftPosts: currentWindowAllStatus.filter(p => p.effectiveStatus === 'draft').length,
    failedPosts: currentWindowAllStatus.filter(p => p.effectiveStatus === 'failed').length,
    partialFailurePosts: currentWindowAllStatus.filter(
      p => p.effectiveStatus === 'published' && p.variants.some(v => v.status === 'failed')
    ).length,
    overdueScheduledPosts: currentWindowAllStatus.filter(p => {
      if (p.effectiveStatus !== 'scheduled' || !p.scheduledAt) return false;
      const schedMs = parseTimestamp(p.scheduledAt);
      return schedMs !== null && schedMs < nowMs - 5 * 60 * 1000;
    }).length,
  };

  // Helper to get scoped variants matching active platform/account filter for a published post
  const getScopedPublishedVariants = (p: EnrichedSignalPost): EnrichedVariantMetrics[] =>
    p.variants.filter(v => {
      if (v.status !== 'published') return false;
      if (filterPlatform && v.canonicalPlatform !== filterPlatform) return false;
      if (filterAccount && v.platformAccountId !== filterAccount) return false;
      return true;
    });

  // Aggregate KPI totals over strict published cohort
  const computeWindowTotals = (cohort: EnrichedSignalPost[]) => {
    let views = 0;
    let totalEngagements = 0;
    let viewVariantsCount = 0;
    let rateNumerator = 0;
    let rateDenominator = 0;
    let rateEligibleVariants = 0;
    const perPostTotals: number[] = [];

    for (const post of cohort) {
      const variants = getScopedPublishedVariants(post);
      let postEng = 0;
      for (const v of variants) {
        totalEngagements += v.totalEngagements;
        postEng += v.totalEngagements;
        if (v.views !== null) {
          views += v.views;
          viewVariantsCount++;
          if (v.views > 0) {
            rateNumerator += v.totalEngagements;
            rateDenominator += v.views;
            rateEligibleVariants++;
          }
        }
      }
      perPostTotals.push(postEng);
    }

    const avgPerPost =
      cohort.length > 0 ? Math.round((totalEngagements / cohort.length) * 10) / 10 : 0;
    const medPerPost = median(perPostTotals);
    const weightedEr =
      rateDenominator > 0 ? Math.round((rateNumerator / rateDenominator) * 10000) / 100 : null;

    return {
      views,
      viewVariantsCount,
      totalEngagements,
      avgPerPost,
      medPerPost,
      weightedEr,
      rateNumerator,
      rateDenominator,
      rateEligibleVariants,
    };
  };

  const currTotals = computeWindowTotals(currentPublishedPosts);
  const prevTotals = computeWindowTotals(previousPublishedPosts);

  const momentumPctVal =
    prevTotals.avgPerPost > 0
      ? Math.round(((currTotals.avgPerPost - prevTotals.avgPerPost) / prevTotals.avgPerPost) * 100)
      : currTotals.avgPerPost > 0 && previousPublishedPosts.length === 0
        ? (currTotals.totalEngagements > 0 ? 100 : 0)
        : 0;

  // Chronological intra-period fallback when user chose `all` and there is no prior window
  let effectiveMomentum = momentumPctVal;
  let effectivePrevAvg = prevTotals.avgPerPost;
  if (windowStartMs === 0 && currentPublishedPosts.length >= 4) {
    const chronoAsc = [...currentPublishedPosts].sort(
      (a, b) => resolvePostEffectiveTimestamp(a) - resolvePostEffectiveTimestamp(b)
    );
    const half = Math.floor(chronoAsc.length / 2);
    const olderHalf = chronoAsc.slice(0, half);
    const newerHalf = chronoAsc.slice(half);
    const olderAvg =
      olderHalf.reduce((s, p) => s + p.scopedEngagement.totalEngagements, 0) / Math.max(olderHalf.length, 1);
    const newerAvg =
      newerHalf.reduce((s, p) => s + p.scopedEngagement.totalEngagements, 0) / Math.max(newerHalf.length, 1);
    effectivePrevAvg = Math.round(olderAvg * 10) / 10;
    effectiveMomentum = olderAvg > 0 ? Math.round(((newerAvg - olderAvg) / olderAvg) * 100) : newerAvg > 0 ? 100 : 0;
  }

  // Resonance composite score (strictly null when 0 published posts)
  let resonanceScoreObj: SignalAnalyticsPayload['kpis']['resonanceScore'] = {
    value: null,
    components: null,
  };
  if (currentPublishedPosts.length > 0) {
    const engagementVolume = Math.min(45, Math.round(Math.log10(currTotals.totalEngagements + 1) * 15));
    const viewReach = Math.min(25, Math.round(Math.log10(currTotals.views + 1) * 6.5));
    const uniquePublishDays = new Set(
      currentPublishedPosts.map(p => getZonedParts(new Date(resolvePostEffectiveTimestamp(p)), timezone).dateKey)
    ).size;
    const expectedActiveDays = Math.max(1, Math.min(effectiveDays, 12));
    const consistency = Math.min(15, Math.round((uniquePublishDays / expectedActiveDays) * 15));
    const momentum = effectiveMomentum > 0 ? Math.min(15, Math.round(effectiveMomentum / 8) + 5) : effectiveMomentum === 0 ? 5 : 0;
    const totalResonance = Math.max(1, Math.min(100, engagementVolume + viewReach + consistency + momentum));
    resonanceScoreObj = {
      value: totalResonance,
      components: { engagementVolume, viewReach, consistency, momentum },
    };
  }

  // Daily time series in user's selected timezone (up to 90 daily buckets cleanly rendered, or adaptive)
  const seriesDays = Math.min(effectiveDays, 90);
  const dailyMap = new Map<string, { views: number; engagements: number; posts: number; prevViews: number; prevEngagements: number; label: string }>();
  const dayKeysOrder: string[] = [];

  for (let i = seriesDays - 1; i >= 0; i--) {
    const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
    const { dateKey } = getZonedParts(d, timezone);
    const parts = dateKey.split('-');
    const label = `${parts[1]}/${parts[2]}`;
    if (!dailyMap.has(dateKey)) {
      dayKeysOrder.push(dateKey);
      dailyMap.set(dateKey, { views: 0, engagements: 0, posts: 0, prevViews: 0, prevEngagements: 0, label });
    }
  }

  for (const post of currentPublishedPosts) {
    const ts = resolvePostEffectiveTimestamp(post);
    const { dateKey } = getZonedParts(new Date(ts), timezone);
    const bucket = dailyMap.get(dateKey);
    if (bucket) {
      bucket.posts++;
      for (const v of getScopedPublishedVariants(post)) {
        bucket.engagements += v.totalEngagements;
        if (v.views !== null) bucket.views += v.views;
      }
    }
  }

  if (previousPublishedPosts.length > 0 && windowStartMs > 0) {
    // Shift previous window posts forward by windowMs to overlay cleanly day-by-day
    for (const post of previousPublishedPosts) {
      const ts = resolvePostEffectiveTimestamp(post) + windowMs;
      const { dateKey } = getZonedParts(new Date(ts), timezone);
      const bucket = dailyMap.get(dateKey);
      if (bucket) {
        for (const v of getScopedPublishedVariants(post)) {
          bucket.prevEngagements += v.totalEngagements;
          if (v.views !== null) bucket.prevViews += v.views;
        }
      }
    }
  }

  const dailySeries = dayKeysOrder.map(date => {
    const b = dailyMap.get(date)!;
    return { date, ...b };
  });

  // Channel & Account breakdown (strictly variant-level attribution)
  const channelMap = new Map<string, {
    key: string;
    platform: string;
    platformAccountId: string | null;
    accountLabel: string | null;
    connectionStatus: string;
    capability: PlatformCapability;
    variantCount: number;
    publishedCount: number;
    failedCount: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    views: number;
    hasViewMetrics: boolean;
    totalEngagements: number;
    rateNum: number;
    rateDen: number;
    lastSyncedAt: string | null;
  }>();

  // Seed with connected accounts so zero-post channels remain visible & transparent
  for (const acct of input.connectedAccounts) {
    const canon = canonicalPlatformId(acct.platform);
    if (filterPlatform && canon !== filterPlatform) continue;
    if (filterAccount && acct.platformAccountId !== filterAccount && acct.id !== filterAccount) continue;
    const key = `${canon}::${acct.platformAccountId || 'default'}`;
    if (!channelMap.has(key)) {
      channelMap.set(key, {
        key,
        platform: canon,
        platformAccountId: acct.platformAccountId ?? null,
        accountLabel: acct.accountLabel || acct.username || null,
        connectionStatus: acct.status || 'connected',
        capability: getPlatformCapability(canon),
        variantCount: 0,
        publishedCount: 0,
        failedCount: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
        views: 0,
        hasViewMetrics: false,
        totalEngagements: 0,
        rateNum: 0,
        rateDen: 0,
        lastSyncedAt: null,
      });
    }
  }

  for (const post of currentWindowAllStatus) {
    for (const v of post.variants) {
      if (filterPlatform && v.canonicalPlatform !== filterPlatform) continue;
      if (filterAccount && v.platformAccountId !== filterAccount) continue;
      const key = `${v.canonicalPlatform}::${v.platformAccountId || 'default'}`;
      let entry = channelMap.get(key);
      if (!entry) {
        const acct = v.platformAccountId
          ? accountLookup.get(`${v.canonicalPlatform}::${v.platformAccountId}`)
          : input.connectedAccounts.find(a => canonicalPlatformId(a.platform) === v.canonicalPlatform);
        entry = {
          key,
          platform: v.canonicalPlatform,
          platformAccountId: v.platformAccountId,
          accountLabel: v.accountLabel || acct?.accountLabel || acct?.username || null,
          connectionStatus: acct?.status || 'connected',
          capability: v.capability,
          variantCount: 0,
          publishedCount: 0,
          failedCount: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          clicks: 0,
          views: 0,
          hasViewMetrics: false,
          totalEngagements: 0,
          rateNum: 0,
          rateDen: 0,
          lastSyncedAt: null,
        };
        channelMap.set(key, entry);
      }
      entry.variantCount++;
      if (v.status === 'failed') entry.failedCount++;
      if (v.status === 'published') {
        entry.publishedCount++;
        entry.likes += v.likes;
        entry.comments += v.comments;
        entry.shares += v.shares;
        entry.saves += v.saves;
        entry.clicks += v.clicks;
        entry.totalEngagements += v.totalEngagements;
        if (v.views !== null) {
          entry.views += v.views;
          entry.hasViewMetrics = true;
          if (v.views > 0) {
            entry.rateNum += v.totalEngagements;
            entry.rateDen += v.views;
          }
        }
        if (v.lastSyncedAt && (!entry.lastSyncedAt || v.lastSyncedAt > entry.lastSyncedAt)) {
          entry.lastSyncedAt = v.lastSyncedAt;
        }
      }
    }
  }

  const channelBreakdown: ChannelRollup[] = Array.from(channelMap.values())
    .map(c => ({
      key: c.key,
      platform: c.platform,
      label: c.capability.label,
      platformAccountId: c.platformAccountId,
      accountLabel: c.accountLabel,
      connectionStatus: c.connectionStatus,
      capability: c.capability,
      variantCount: c.variantCount,
      publishedCount: c.publishedCount,
      failedCount: c.failedCount,
      likes: c.likes,
      comments: c.comments,
      shares: c.shares,
      saves: c.saves,
      clicks: c.clicks,
      views: c.capability.supportedMetrics.views ? c.views : null,
      totalEngagements: c.totalEngagements,
      avgEngagementsPerPost: c.publishedCount > 0 ? Math.round((c.totalEngagements / c.publishedCount) * 10) / 10 : 0,
      weightedEngagementRate: c.rateDen > 0 ? Math.round((c.rateNum / c.rateDen) * 10000) / 100 : null,
      lastSyncedAt: c.lastSyncedAt,
    }))
    .sort((a, b) => b.totalEngagements - a.totalEngagements || b.publishedCount - a.publishedCount);

  // Hook breakdown (published cohort only)
  const hookGroups = new Map<HookType, { posts: EnrichedSignalPost[] }>();
  for (const post of currentPublishedPosts) {
    const g = hookGroups.get(post.hookType) || { posts: [] };
    g.posts.push(post);
    hookGroups.set(post.hookType, g);
  }

  const hookBreakdown: HookPerformanceRow[] = Array.from(hookGroups.entries())
    .map(([hookType, { posts }]) => {
      const meta = HOOK_TYPE_META[hookType];
      const engValues = posts.map(p => p.scopedEngagement.totalEngagements);
      const totalEng = engValues.reduce((s, v) => s + v, 0);
      const viewPosts = posts.filter(p => p.scopedEngagement.views !== null);
      const avgViews =
        viewPosts.length > 0
          ? Math.round(viewPosts.reduce((s, p) => s + (p.scopedEngagement.views ?? 0), 0) / viewPosts.length)
          : null;
      const bestPost = [...posts].sort(
        (a, b) => b.scopedEngagement.totalEngagements - a.scopedEngagement.totalEngagements
      )[0];

      return {
        hookType,
        label: meta.label,
        color: meta.color,
        publishedCount: posts.length,
        totalEngagements: totalEng,
        avgEngagements: Math.round((totalEng / posts.length) * 10) / 10,
        medianEngagements: median(engValues),
        avgViews,
        shareOfPublishedPct: Math.round((posts.length / Math.max(currentPublishedPosts.length, 1)) * 100),
        confidence: confidenceForSample(posts.length),
        bestPostId: bestPost?.id ?? null,
      };
    })
    .sort((a, b) => b.avgEngagements - a.avgEngagements || b.publishedCount - a.publishedCount);

  // Word-count brackets (published cohort only)
  const bracketOrder: WordCountBracket[] = ['short', 'punchy', 'structured', 'deep'];
  const wordCountBrackets: WordBracketRow[] = bracketOrder.map(bracketId => {
    const sample = getWordCountBracket(
      bracketId === 'short' ? 10 : bracketId === 'punchy' ? 50 : bracketId === 'structured' ? 110 : 200
    );
    const matching = currentPublishedPosts.filter(p => p.wordCountBracket === bracketId);
    const engs = matching.map(p => p.scopedEngagement.totalEngagements);
    const viewMatching = matching.filter(p => p.scopedEngagement.views !== null);
    return {
      id: bracketId,
      label: sample.label,
      rangeLabel: sample.rangeLabel,
      publishedCount: matching.length,
      avgEngagements: matching.length > 0 ? Math.round((engs.reduce((s, v) => s + v, 0) / matching.length) * 10) / 10 : 0,
      medianEngagements: median(engs),
      avgViews:
        viewMatching.length > 0
          ? Math.round(viewMatching.reduce((s, p) => s + (p.scopedEngagement.views ?? 0), 0) / viewMatching.length)
          : null,
    };
  });

  // Media vs text comparison (published cohort only; lift null if either cohort empty)
  const withMedia = currentPublishedPosts.filter(p => p.hasMedia);
  const withoutMedia = currentPublishedPosts.filter(p => !p.hasMedia);
  const withMediaAvg =
    withMedia.length > 0
      ? Math.round(
          (withMedia.reduce((s, p) => s + p.scopedEngagement.totalEngagements, 0) / withMedia.length) * 10
        ) / 10
      : 0;
  const withoutMediaAvg =
    withoutMedia.length > 0
      ? Math.round(
          (withoutMedia.reduce((s, p) => s + p.scopedEngagement.totalEngagements, 0) / withoutMedia.length) * 10
        ) / 10
      : 0;
  const mediaLiftPct =
    withMedia.length > 0 && withoutMedia.length > 0 && withoutMediaAvg > 0
      ? Math.round(((withMediaAvg - withoutMediaAvg) / withoutMediaAvg) * 100)
      : null;

  // Timing 7x24 matrix in user's selected timezone (strictly published timestamps)
  const heatmap: TimingCell[][] = Array.from({ length: 7 }, (_, dayIndex) =>
    Array.from({ length: 24 }, (_, hour) => ({
      dayIndex,
      hour,
      count: 0,
      totalEngagements: 0,
      avgEngagements: 0,
      totalViews: 0,
      postIds: [],
    }))
  );
  const dayEngBuckets: number[][] = Array.from({ length: 7 }, () => []);
  const hourBuckets = Array.from({ length: 24 }, () => ({ count: 0, totalEng: 0 }));

  for (const post of currentPublishedPosts) {
    const refIso = post.publishedAt || post.createdAt;
    const { dayIndex, hour } = getZonedParts(refIso, timezone);
    const cell = heatmap[dayIndex][hour];
    cell.count++;
    cell.totalEngagements += post.scopedEngagement.totalEngagements;
    cell.totalViews += post.scopedEngagement.views ?? 0;
    cell.postIds.push(post.id);

    dayEngBuckets[dayIndex].push(post.scopedEngagement.totalEngagements);
    hourBuckets[hour].count++;
    hourBuckets[hour].totalEng += post.scopedEngagement.totalEngagements;
  }

  const allSlots: TimingCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const cell = heatmap[d][h];
      cell.avgEngagements = cell.count > 0 ? Math.round((cell.totalEngagements / cell.count) * 10) / 10 : 0;
      if (cell.count > 0) allSlots.push(cell);
    }
  }

  const formatHourLabel = (hour: number) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:00 ${suffix}`;
  };

  const bestSlots = allSlots
    .sort((a, b) => {
      // Prioritize cells with >=2 posts if available, then avgEngagements
      const aEstablished = a.count >= 2 ? 1 : 0;
      const bEstablished = b.count >= 2 ? 1 : 0;
      if (aEstablished !== bEstablished) return bEstablished - aEstablished;
      return b.avgEngagements - a.avgEngagements || b.count - a.count;
    })
    .slice(0, 4)
    .map(c => ({
      dayIndex: c.dayIndex,
      dayName: DAY_NAMES[c.dayIndex],
      hour: c.hour,
      hourLabel: formatHourLabel(c.hour),
      count: c.count,
      avgEngagements: c.avgEngagements,
      confidence: confidenceForSample(c.count),
    }));

  const dayStats = DAY_NAMES.map((label, dayIndex) => {
    const vals = dayEngBuckets[dayIndex];
    const sum = vals.reduce((s, v) => s + v, 0);
    return {
      dayIndex,
      label,
      count: vals.length,
      avgEngagements: vals.length > 0 ? Math.round((sum / vals.length) * 10) / 10 : 0,
      medianEngagements: median(vals),
    };
  });

  const hourStats = hourBuckets.map((b, hour) => ({
    hour,
    label: formatHourLabel(hour),
    count: b.count,
    avgEngagements: b.count > 0 ? Math.round((b.totalEng / b.count) * 10) / 10 : 0,
  }));

  // Sync Health summary
  const allPublishedVariants = currentPublishedPosts.flatMap(p => getScopedPublishedVariants(p));
  const syncedVariants = allPublishedVariants.filter(v => v.syncStatus === 'synced').length;
  const unsupportedVariants = allPublishedVariants.filter(v => v.syncStatus === 'unsupported').length;
  const pendingVariants = allPublishedVariants.filter(v => v.syncStatus === 'pending').length;
  const erroredVariants = allPublishedVariants.filter(
    v => v.syncStatus === 'error' || v.syncStatus === 'rate_limited' || v.syncStatus === 'token_expired'
  ).length;
  const expiredAccounts = input.connectedAccounts.filter(
    a => a.status === 'expired' || a.status === 'revoked'
  ).length;
  const lastSyncedAt =
    allPublishedVariants
      .map(v => v.lastSyncedAt)
      .filter((s): s is string => Boolean(s))
      .sort()
      .pop() ?? null;

  let syncHealthStatus: SignalAnalyticsPayload['syncHealth']['status'] = 'healthy';
  if (input.connectedAccounts.length === 0) syncHealthStatus = 'no_accounts';
  else if (erroredVariants > 0 || expiredAccounts > 0) syncHealthStatus = syncedVariants > 0 ? 'partial' : 'degraded';
  else if (allPublishedVariants.length > 0 && syncedVariants === 0 && pendingVariants > 0) syncHealthStatus = 'pending';

  // Deterministic, evidence-cited recommendations
  const recommendations: DeterministicRecommendation[] = [];

  if (operational.failedPosts > 0 || operational.partialFailurePosts > 0 || expiredAccounts > 0) {
    recommendations.push({
      id: 'rec-ops-recovery',
      category: 'operations',
      title:
        expiredAccounts > 0
          ? `${expiredAccounts} connected account${expiredAccounts > 1 ? 's' : ''} need token reconnection`
          : `${operational.failedPosts + operational.partialFailurePosts} post${operational.failedPosts + operational.partialFailurePosts > 1 ? 's' : ''} had delivery issues`,
      detail:
        expiredAccounts > 0
          ? 'Expired platform tokens block both scheduled publishing and engagement metrics polling until re-authenticated.'
          : 'Inspect failed variants inside Content & Hooks to view sanitized upstream errors and retry delivery.',
      sampleSize: operational.failedPosts + operational.partialFailurePosts + expiredAccounts,
      confidence: 'established',
      badge: 'Rule-based',
      actionLabel: expiredAccounts > 0 ? 'Reconnect Accounts' : 'Inspect Failed Posts',
      actionHref: expiredAccounts > 0 ? '/onboarding/connect' : '/dashboard/signal?view=content&status=failed',
    });
  }

  if (hookBreakdown.length >= 2 && currentPublishedPosts.length >= 3) {
    const topHook = hookBreakdown[0];
    const runnerHook = hookBreakdown[hookBreakdown.length - 1];
    recommendations.push({
      id: 'rec-hook-winner',
      category: 'hook',
      title: `${topHook.label} hooks average ${topHook.avgEngagements} engagements`,
      detail:
        runnerHook.avgEngagements > 0
          ? `Across ${topHook.publishedCount} published posts, ${topHook.label} openers outperformed ${runnerHook.label} (${runnerHook.avgEngagements} avg).`
          : `Lead with ${topHook.label} framing based on your highest-performing cohort (n=${topHook.publishedCount}).`,
      sampleSize: topHook.publishedCount,
      confidence: topHook.confidence,
      badge: 'Rule-based',
      actionLabel: 'Draft this Hook in Studio',
      actionHref: `/dashboard/composer?hookStyle=${encodeURIComponent(topHook.hookType)}&suggestedHook=${encodeURIComponent(HOOK_TYPE_META[topHook.hookType].sampleStarter)}`,
    });
  }

  if (mediaLiftPct !== null && withMedia.length >= 2 && withoutMedia.length >= 2) {
    const winnerMedia = mediaLiftPct >= 0;
    recommendations.push({
      id: 'rec-media-lift',
      category: 'media',
      title: winnerMedia
        ? `Posts with media drive +${mediaLiftPct}% more engagement`
        : `Text-only posts outperform media posts by ${Math.abs(mediaLiftPct)}%`,
      detail: `Measured across ${withMedia.length} media posts (${withMediaAvg} avg) vs ${withoutMedia.length} text posts (${withoutMediaAvg} avg) in ${rangeMeta.effectiveRange}.`,
      sampleSize: withMedia.length + withoutMedia.length,
      confidence: confidenceForSample(Math.min(withMedia.length, withoutMedia.length)),
      badge: 'Rule-based',
      actionLabel: 'Create New Post',
      actionHref: '/dashboard/composer',
    });
  }

  if (bestSlots.length > 0 && currentPublishedPosts.length >= 3) {
    const topSlot = bestSlots[0];
    recommendations.push({
      id: 'rec-best-slot',
      category: 'timing',
      title: `Peak observed window: ${topSlot.dayName} at ${topSlot.hourLabel} (${timezone})`,
      detail: `Posts published in this slot averaged ${topSlot.avgEngagements} engagements across n=${topSlot.count} post${topSlot.count > 1 ? 's' : ''}.`,
      sampleSize: topSlot.count,
      confidence: topSlot.confidence,
      badge: 'Rule-based',
      actionLabel: 'Schedule Slot in Flight Plan',
      actionHref: `/dashboard/flightplan?slotDay=${topSlot.dayIndex}&slotHour=${topSlot.hour}&tz=${encodeURIComponent(timezone)}&source=signal`,
    });
  }

  const bio = input.bioAnalytics || {
    profileViews: 0,
    profileLinkClicks: 0,
    profileCtaClicks: 0,
    ctrPct: null,
    topLinks: [],
    topReferrers: [],
  };
  const auto = input.automationSummary || {
    commentReplies: 0,
    dmSent: 0,
    followGateUnlocked: 0,
    highIntentLeads: 0,
    flaggedCount: 0,
  };

  if (bio.profileViews >= 10 && bio.profileLinkClicks === 0) {
    recommendations.push({
      id: 'rec-bio-ctr',
      category: 'funnel',
      title: `${bio.profileViews} bio visits recorded with 0 link clicks`,
      detail: 'Your public Unool profile is receiving visitors without CTA conversion. Review headline or link button placement.',
      sampleSize: bio.profileViews,
      confidence: 'established',
      badge: 'Rule-based',
      actionLabel: 'Edit Profile Links',
      actionHref: '/dashboard/presence',
    });
  }

  // Sort filtered posts cleanly for UI & export
  const sortedPosts = [...filteredPostsForFeed].sort((a, b) => {
    switch (sortMode) {
      case 'top_engagement':
        return b.scopedEngagement.totalEngagements - a.scopedEngagement.totalEngagements;
      case 'top_views':
        return (b.scopedEngagement.views ?? -1) - (a.scopedEngagement.views ?? -1);
      case 'top_eng_rate':
        return (b.scopedEngagement.engagementRate ?? -1) - (a.scopedEngagement.engagementRate ?? -1);
      case 'most_discussed':
        return b.scopedEngagement.comments - a.scopedEngagement.comments;
      case 'newest':
      default:
        return resolvePostEffectiveTimestamp(b) - resolvePostEffectiveTimestamp(a);
    }
  });

  return {
    meta: {
      timezone,
      requestedRange: rangeMeta.requestedRange,
      effectiveRange: rangeMeta.effectiveRange,
      requestedDays: rangeMeta.requestedDays,
      effectiveDays: rangeMeta.effectiveDays,
      retentionDays: plan.retentionDays,
      truncatedByPlan: rangeMeta.truncatedByPlan,
      planId: plan.planId,
      planName: plan.planName,
      csvExportAllowed: plan.csvExportAllowed,
      comparePeriod,
      generatedAt: now.toISOString(),
    },
    syncHealth: {
      status: syncHealthStatus,
      connectedAccountCount: input.connectedAccounts.length,
      expiredAccountCount: expiredAccounts,
      totalPublishedVariants: allPublishedVariants.length,
      syncedVariants,
      pendingVariants,
      unsupportedVariants,
      erroredOrRateLimitedVariants: erroredVariants,
      lastSyncedAt,
    },
    operational,
    kpis: {
      views: {
        value: currTotals.views,
        priorValue: prevTotals.views,
        deltaPct: calcDeltaPct(currTotals.views, prevTotals.views),
        eligibleVariants: currTotals.viewVariantsCount,
      },
      totalEngagements: {
        value: currTotals.totalEngagements,
        priorValue: prevTotals.totalEngagements,
        deltaPct: calcDeltaPct(currTotals.totalEngagements, prevTotals.totalEngagements),
      },
      avgEngagementsPerPost: {
        value: currTotals.avgPerPost,
        median: currTotals.medPerPost,
        sampleSize: currentPublishedPosts.length,
        priorValue: effectivePrevAvg,
        deltaPct: calcDeltaPct(currTotals.avgPerPost, effectivePrevAvg),
      },
      weightedEngagementRate: {
        value: currTotals.weightedEr,
        numeratorEngagements: currTotals.rateNumerator,
        denominatorViews: currTotals.rateDenominator,
        eligibleVariants: currTotals.rateEligibleVariants,
        priorValue: prevTotals.weightedEr,
      },
      publishedCount: {
        value: currentPublishedPosts.length,
        priorValue: previousPublishedPosts.length,
        deltaPct: calcDeltaPct(currentPublishedPosts.length, previousPublishedPosts.length),
      },
      momentumPct: {
        value: effectiveMomentum,
        currAvg: currTotals.avgPerPost,
        prevAvg: effectivePrevAvg,
        sampleSize: currentPublishedPosts.length,
      },
      resonanceScore: resonanceScoreObj,
    },
    dailySeries,
    channelBreakdown,
    hookBreakdown,
    wordCountBrackets,
    mediaComparison: {
      withMediaCount: withMedia.length,
      withoutMediaCount: withoutMedia.length,
      withMediaAvg,
      withoutMediaAvg,
      liftPct: mediaLiftPct,
      confidence: confidenceForSample(Math.min(withMedia.length, withoutMedia.length)),
    },
    timing: {
      timezone,
      publishedSampleCount: currentPublishedPosts.length,
      dayNames: DAY_NAMES,
      dayStats,
      hourStats,
      bestSlots,
      heatmap,
    },
    funnels: {
      bioProfile: bio,
      automation: auto,
    },
    recommendations,
    posts: sortedPosts,
  };
}

/**
 * Neutralize spreadsheet formula injection (=, +, -, @, tab, CR) and RFC-4180 quote CSV values.
 */
export function sanitizeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  const needsPrefix = /^[=+\-@\t\r]/.test(str);
  const safe = needsPrefix ? `'${str}` : str;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function serializeSignalPostsToCsv(payload: SignalAnalyticsPayload): string {
  const headers = [
    'post_id',
    'variant_id',
    'published_at',
    'post_status',
    'origin',
    'hook_style',
    'word_count',
    'has_media',
    'platform',
    'account_label',
    'variant_status',
    'views',
    'likes_reactions',
    'comments',
    'shares_reposts',
    'saves',
    'clicks',
    'total_engagements',
    'engagement_rate_pct',
    'sync_status',
    'platform_url',
    'content_preview',
  ];

  const rows: string[] = [headers.join(',')];

  for (const post of payload.posts) {
    if (post.variants.length === 0) {
      rows.push(
        [
          post.id,
          '',
          post.publishedAt || post.createdAt,
          post.effectiveStatus,
          post.originKind,
          post.hookType,
          post.wordCount,
          post.hasMedia,
          '',
          '',
          post.effectiveStatus,
          'N/A',
          0,
          0,
          0,
          0,
          0,
          0,
          'N/A',
          'pending',
          '',
          post.content.replace(/\s+/g, ' ').slice(0, 140),
        ]
          .map(sanitizeCsvCell)
          .join(',')
      );
      continue;
    }

    for (const v of post.variants) {
      rows.push(
        [
          post.id,
          v.id,
          v.publishedAt || post.publishedAt || post.createdAt,
          post.effectiveStatus,
          post.originKind,
          post.hookType,
          post.wordCount,
          post.hasMedia,
          v.canonicalPlatform,
          v.accountLabel || v.platformAccountId || 'default',
          v.status,
          v.views === null ? 'N/A' : v.views,
          v.likes,
          v.comments,
          v.shares,
          v.saves,
          v.clicks,
          v.totalEngagements,
          v.engagementRate === null ? 'N/A' : v.engagementRate,
          v.syncStatus,
          v.platformUrl || '',
          (v.adaptedContent || post.content).replace(/\s+/g, ' ').slice(0, 140),
        ]
          .map(sanitizeCsvCell)
          .join(',')
      );
    }
  }

  return rows.join('\r\n');
}
