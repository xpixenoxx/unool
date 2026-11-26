import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type CampaignTriggerSurface =
  | 'comment'
  | 'story_reply'
  | 'story_mention'
  | 'live_comment'
  | 'dm_keyword'
  | 'ad_referral'
  | 'reel_share';

export type CampaignTriggerMode = 'exact' | 'contains' | 'fuzzy' | 'any';

export interface InstagramCampaign {
  id: string;
  workspace_id: string;
  name: string;
  playbook_id?: string | null;
  trigger_surface: CampaignTriggerSurface;
  media_id?: string | null;
  post_id?: string | null;
  ad_id?: string | null;
  trigger_mode: CampaignTriggerMode;
  keywords: string[];
  exclude_keywords: string[];
  ignore_sub_comments: boolean;
  ignore_tag_only_comments: boolean;
  dedup_user_post_hours: number;
  starts_at?: string | null;
  ends_at?: string | null;
  max_total_sends?: number | null;
  total_sends: number;
  public_replies: string[];
  dm_opening_enabled: boolean;
  dm_opening_text?: string | null;
  dm_opening_button_title?: string | null;
  dm_message: string;
  dm_card_title?: string | null;
  dm_card_subtitle?: string | null;
  dm_card_image_url?: string | null;
  dm_cta_title?: string | null;
  dm_cta_url?: string | null;
  dm_extra_bubbles: string[];
  require_follow: boolean;
  follow_ask_text?: string | null;
  follow_verified_text?: string | null;
  max_follow_reminders: number;
  capture_email: boolean;
  capture_phone: boolean;
  capture_prompt?: string | null;
  capture_confirm_text?: string | null;
  skip_if_already_captured: boolean;
  send_email_delivery: boolean;
  email_subject?: string | null;
  email_body?: string | null;
  ab_variant_b_dm?: string | null;
  ab_variant_b_cta_url?: string | null;
  ab_split_pct: number;
  nudge_enabled: boolean;
  nudge_delay_minutes: number;
  nudge_text?: string | null;
  closed_dm_public_fallback?: string | null;
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignMatchInput {
  surface: CampaignTriggerSurface;
  text: string;
  mediaId?: string | null;
  adId?: string | null;
  parentId?: string | null;
  now?: Date;
}

export interface CampaignMatchResult {
  campaign: InstagramCampaign;
  matchedKeyword: string | null;
  matchType: 'exact' | 'contains' | 'fuzzy' | 'any' | 'ad_referral';
  tier: number;
}

// ─── 6 One-Click Playbook Presets (ahead of ManyChat / LinkDM) ───────────────

export interface CampaignPlaybookPreset {
  id: string;
  title: string;
  tagline: string;
  badge: string;
  defaults: Partial<InstagramCampaign>;
}

export const CAMPAIGN_PLAYBOOK_PRESETS: CampaignPlaybookPreset[] = [
  {
    id: 'reel_lead_magnet',
    title: 'Reel Comment → Lead Magnet + Email',
    tagline: 'Comment a keyword → Opening DM button → Follow check → Capture email → Deliver link + send email copy.',
    badge: 'Highest ROI',
    defaults: {
      name: 'Reel Lead Magnet Funnel',
      trigger_surface: 'comment',
      trigger_mode: 'fuzzy',
      keywords: ['GUIDE', 'SEND', 'LINK'],
      exclude_keywords: ['scam', 'fake', 'spam'],
      ignore_tag_only_comments: true,
      dedup_user_post_hours: 24,
      public_replies: [
        'Just dropped it in your DMs! Let me know what you build with it 🙌',
        'Sent it straight to your inbox — check your requests if it is not at the top!',
        'Just sent the full breakdown over to your DMs ✨',
      ],
      dm_opening_enabled: true,
      dm_opening_text: 'Hey! Ready for the full guide? Tap below and I will send it right over 👇',
      dm_opening_button_title: 'Send it to me',
      dm_message: 'Here is your instant access! Let me know if you have any questions once you open it 🙌',
      dm_cta_title: 'Open Resource',
      require_follow: true,
      capture_email: true,
      capture_prompt: 'Drop your best email below and I will send you a permanent copy + bonus checklist right away 👇',
      send_email_delivery: true,
      nudge_enabled: true,
      nudge_delay_minutes: 180,
      nudge_text: 'Hey! Just checking in — did the link open fine for you?',
    },
  },
  {
    id: 'product_price_drop',
    title: 'Comment "PRICE" → Rich Product Card + Coupon',
    tagline: 'Turns buyer comments into instant CTA cards with unique one-time promo codes and 3h click nudge.',
    badge: 'E-Commerce',
    defaults: {
      name: 'Product Drop + Unique Coupon',
      trigger_surface: 'comment',
      trigger_mode: 'fuzzy',
      keywords: ['PRICE', 'BUY', 'SHOP', 'LINK'],
      exclude_keywords: ['refund', 'scam'],
      ignore_tag_only_comments: true,
      public_replies: [
        'Sent you the direct link + your code in DMs! 🔥',
        'Just messaged you the full details + private link!',
        'Check your DMs — dropped the link right there for you 🙌',
      ],
      dm_message: 'Here is the direct link + your exclusive code {{coupon}}! Valid for the next 24h 🔥',
      dm_card_title: 'Shop Now — Exclusive Drop',
      dm_cta_title: 'Claim Offer',
      nudge_enabled: true,
      nudge_delay_minutes: 180,
      nudge_text: 'Quick heads-up — your exclusive code is still active if you wanted to grab it!',
    },
  },
  {
    id: 'story_reply_flash',
    title: 'Story Reply → Flash Offer / Waitlist',
    tagline: 'Replies to your Story trigger instant VIP DM delivery and capture email/phone without leaving IG.',
    badge: 'Story Trigger',
    defaults: {
      name: 'Story Reply Flash Funnel',
      trigger_surface: 'story_reply',
      trigger_mode: 'fuzzy',
      keywords: ['YES', 'IN', 'VIP', 'WAITLIST'],
      dm_message: 'You are in! Here is your early access link — glad you caught the story 🔥',
      dm_cta_title: 'Join Early Access',
      capture_email: true,
      capture_prompt: 'Drop your email so I can lock your early-bird spot before it goes public 👇',
    },
  },
  {
    id: 'story_mention_vip',
    title: 'Story Mention → Auto-Thank + VIP Tag',
    tagline: 'Automatically thanks everyone who tags your handle in their Story and rewards brand advocates.',
    badge: 'Viral Loop',
    defaults: {
      name: 'Story Mention VIP Thank-You',
      trigger_surface: 'story_mention',
      trigger_mode: 'any',
      keywords: [],
      dm_message: 'Seriously appreciate the Story shoutout! Means a ton 🙌 Here is a little thank-you from me:',
      dm_cta_title: 'Claim Thank-You',
    },
  },
  {
    id: 'giveaway_entry',
    title: 'Viral Giveaway + Fair Winner Picker',
    tagline: 'Comment to enter → Follow check → Capture email → 1-click cryptographically fair winner draw.',
    badge: 'Growth Spike',
    defaults: {
      name: 'Community Giveaway Funnel',
      trigger_surface: 'comment',
      trigger_mode: 'fuzzy',
      keywords: ['WIN', 'ENTER', 'GIVEAWAY'],
      ignore_tag_only_comments: false,
      dedup_user_post_hours: 168,
      public_replies: [
        'You are entered! Check your DMs to lock in your bonus entry 🎉',
        'Entry received! Sent your confirmation step in DMs 🙌',
        'Got you in the draw — check your DMs to finalize!',
      ],
      dm_message: 'You are officially entered in the giveaway! 🎉 Winner will be picked right here soon.',
      require_follow: true,
      capture_email: true,
      capture_prompt: 'Last step to lock your entry: drop your email so we can notify you if you win! 🎁',
    },
  },
  {
    id: 'live_drop',
    title: 'Instagram Live Keyword Drop',
    tagline: 'Viewers commenting a keyword during your Live immediately receive your offer link via Private Reply.',
    badge: 'Live Sales',
    defaults: {
      name: 'IG Live Instant Offer Drop',
      trigger_surface: 'live_comment',
      trigger_mode: 'fuzzy',
      keywords: ['LIVE', 'DEAL', 'LINK'],
      dm_message: 'Thanks for hanging out on the Live! Here is the exact link we just talked about 👇',
      dm_cta_title: 'Grab Live Offer',
    },
  },
];

// ─── Text Helpers & Levenshtein Fuzzy Matching ───────────────────────────────

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'you',
  'are',
  'this',
  'that',
  'with',
  'yes',
  'hey',
  'hi',
  'hello',
  'nice',
  'good',
  'great',
  'love',
  'wow',
  'cool',
]);

export function normalizeKeywordText(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s@]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isTagOnlyComment(text: string): boolean {
  const cleaned = (text || '').trim();
  if (!cleaned) return true;
  const withoutMentionsAndEmoji = cleaned
    .replace(/@[\w.]+/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
  return withoutMentionsAndEmoji.length === 0;
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 3;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function containsExclusion(normalizedText: string, excludeKeywords: string[]): boolean {
  if (!excludeKeywords || excludeKeywords.length === 0) return false;
  const tokens = normalizedText.split(' ').filter(Boolean);
  for (const ex of excludeKeywords) {
    const cleanEx = normalizeKeywordText(ex);
    if (!cleanEx) continue;
    if (cleanEx.includes(' ')) {
      if (normalizedText.includes(cleanEx)) return true;
    } else if (tokens.includes(cleanEx)) {
      return true;
    }
  }
  return false;
}

function matchKeywords(
  normalizedText: string,
  keywords: string[],
  mode: CampaignTriggerMode
): { matched: boolean; keyword: string | null; matchType: 'exact' | 'contains' | 'fuzzy' | 'any' } {
  if (mode === 'any') {
    return { matched: true, keyword: null, matchType: 'any' };
  }
  const cleanKeywords = (keywords || []).map(normalizeKeywordText).filter(Boolean);
  if (cleanKeywords.length === 0) {
    return { matched: false, keyword: null, matchType: mode };
  }

  // Exact full-text match first
  for (const kw of cleanKeywords) {
    if (normalizedText === kw) {
      return { matched: true, keyword: kw, matchType: 'exact' };
    }
  }
  if (mode === 'exact') {
    return { matched: false, keyword: null, matchType: 'exact' };
  }

  const tokens = normalizedText.split(' ').filter(Boolean);

  // Word-boundary contains match
  for (const kw of cleanKeywords) {
    if (kw.includes(' ')) {
      if (normalizedText.includes(kw)) {
        return { matched: true, keyword: kw, matchType: 'contains' };
      }
    } else if (tokens.includes(kw)) {
      return { matched: true, keyword: kw, matchType: 'contains' };
    }
  }

  // Fuzzy Levenshtein <= 1 match (for typos like "LIKN" -> "LINK", "GUDE" -> "GUIDE")
  if (mode === 'fuzzy') {
    for (const kw of cleanKeywords) {
      if (kw.includes(' ') || kw.length < 4) continue;
      for (const tok of tokens) {
        if (tok.length < 3) continue;
        if (levenshteinDistance(tok, kw) <= 1) {
          return { matched: true, keyword: kw, matchType: 'fuzzy' };
        }
      }
    }
  }

  return { matched: false, keyword: null, matchType: mode };
}

/**
 * Pure deterministic campaign matching waterfall:
 * Tier 1: Post-specific Exact
 * Tier 2: Post-specific Contains / Fuzzy
 * Tier 3: Post-specific Any
 * Tier 4: Global Keyword (Exact / Contains / Fuzzy)
 * Tier 5: Global Any (for story_mention / ad_referral / catch-all campaigns)
 * Returns null if no campaign matches (allowing seamless AI fallback).
 */
export function matchCampaignWaterfall(
  campaigns: InstagramCampaign[],
  input: CampaignMatchInput
): CampaignMatchResult | null {
  const nowMs = (input.now || new Date()).getTime();
  const normalizedText = normalizeKeywordText(input.text);
  const tagOnly = isTagOnlyComment(input.text);

  const candidates: CampaignMatchResult[] = [];

  for (const camp of campaigns) {
    if (!camp.is_active) continue;
    if (camp.trigger_surface !== input.surface) continue;

    // Schedule window check
    if (camp.starts_at && Date.parse(camp.starts_at) > nowMs) continue;
    if (camp.ends_at && Date.parse(camp.ends_at) < nowMs) continue;

    // Max sends cap check
    if (typeof camp.max_total_sends === 'number' && camp.max_total_sends > 0 && camp.total_sends >= camp.max_total_sends) {
      continue;
    }

    // Comment filters
    if (input.surface === 'comment') {
      if (camp.ignore_sub_comments && input.parentId) continue;
      if (camp.ignore_tag_only_comments && tagOnly) continue;
    }

    // Ad referral specific match
    if (input.surface === 'ad_referral' && camp.ad_id) {
      if (!input.adId || camp.ad_id !== input.adId) continue;
      candidates.push({ campaign: camp, matchedKeyword: camp.ad_id, matchType: 'ad_referral', tier: 1 });
      continue;
    }

    // Post scope check
    const isPostScoped = Boolean(camp.media_id && camp.media_id.trim());
    if (isPostScoped) {
      if (!input.mediaId || camp.media_id!.trim() !== input.mediaId.trim()) continue;
    }

    // Negative / exclude keywords check
    if (containsExclusion(normalizedText, camp.exclude_keywords || [])) continue;

    const kwRes = matchKeywords(normalizedText, camp.keywords || [], camp.trigger_mode);
    if (!kwRes.matched) continue;

    let tier = 5;
    if (isPostScoped) {
      if (kwRes.matchType === 'exact') tier = 1;
      else if (kwRes.matchType === 'contains' || kwRes.matchType === 'fuzzy') tier = 2;
      else tier = 3;
    } else {
      if (kwRes.matchType === 'exact' || kwRes.matchType === 'contains' || kwRes.matchType === 'fuzzy') {
        tier = 4;
      } else {
        tier = 5;
      }
    }

    candidates.push({
      campaign: camp,
      matchedKeyword: kwRes.keyword,
      matchType: kwRes.matchType,
      tier,
    });
  }

  if (candidates.length === 0) return null;

  const modeRank: Record<CampaignTriggerMode, number> = {
    exact: 1,
    contains: 2,
    fuzzy: 3,
    any: 4,
  };
  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const mDiff = (modeRank[a.campaign.trigger_mode] ?? 9) - (modeRank[b.campaign.trigger_mode] ?? 9);
    if (mDiff !== 0) return mDiff;
    return (a.campaign.priority ?? 100) - (b.campaign.priority ?? 100);
  });

  return candidates[0];
}

/**
 * Picks a rotating public reply from a campaign's variations, avoiding repeating
 * the most recently sent replies.
 */
export function pickRotatingPublicReply(
  variations: string[],
  recentReplies: string[] = []
): string | null {
  const clean = (variations || []).map((v) => v.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];

  const recentLower = new Set(recentReplies.slice(-5).map((r) => r.toLowerCase()));
  const fresh = clean.filter((v) => !recentLower.has(v.toLowerCase()));
  const pool = fresh.length > 0 ? fresh : clean;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Checks whether the current time falls inside the workspace's configured active hours.
 * Always returns true when activeHoursEnabled is false or unset.
 */
export function isWithinActiveHours(config: {
  activeHoursEnabled?: boolean;
  activeHoursStart?: string | null;
  activeHoursEnd?: string | null;
  activeHoursTimezone?: string | null;
}, now: Date = new Date()): boolean {
  if (!config.activeHoursEnabled) return true;
  const start = config.activeHoursStart || '09:00';
  const end = config.activeHoursEnd || '22:00';
  const tz = config.activeHoursTimezone || 'UTC';

  const parseMinutes = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
    return h * 60 + m;
  };

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const currentMin = hour * 60 + minute;
    const startMin = parseMinutes(start);
    const endMin = parseMinutes(end);

    if (startMin <= endMin) {
      return currentMin >= startMin && currentMin <= endMin;
    }
    // Overnight window (e.g., 22:00 -> 06:00)
    return currentMin >= startMin || currentMin <= endMin;
  } catch {
    return true;
  }
}

/**
 * Analyzes proposed campaign keywords for stopwords and collisions against existing active campaigns.
 */
export function analyzeCampaignKeywords(
  proposedKeywords: string[],
  surface: CampaignTriggerSurface,
  mediaId: string | null | undefined,
  existingCampaigns: InstagramCampaign[],
  editingCampaignId?: string
): { warnings: string[]; collisions: Array<{ keyword: string; campaignName: string }> } {
  const warnings: string[] = [];
  const collisions: Array<{ keyword: string; campaignName: string }> = [];

  for (const raw of proposedKeywords) {
    const kw = normalizeKeywordText(raw);
    if (!kw) continue;
    if (STOPWORDS.has(kw) || kw.length < 2) {
      warnings.push(`"${raw}" is very broad — it may trigger accidentally on casual comments.`);
    }
    for (const other of existingCampaigns) {
      if (!other.is_active || other.id === editingCampaignId) continue;
      if (other.trigger_surface !== surface) continue;
      const sameScope = (other.media_id || null) === (mediaId || null);
      if (!sameScope) continue;
      const otherKws = (other.keywords || []).map(normalizeKeywordText);
      if (otherKws.includes(kw)) {
        collisions.push({ keyword: raw, campaignName: other.name });
      }
    }
  }

  return { warnings, collisions };
}

/**
 * Loads active campaigns for a workspace (resilient to missing table / test mocks).
 */
export async function loadActiveWorkspaceCampaigns(
  workspaceId: string,
  surface?: CampaignTriggerSurface
): Promise<InstagramCampaign[]> {
  try {
    let query = supabaseAdmin
      .from('instagram_campaigns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (surface) {
      query = query.eq('trigger_surface', surface);
    }

    const { data, error } = await query.limit(100);
    if (error || !Array.isArray(data)) return [];
    return data as InstagramCampaign[];
  } catch (err) {
    logger.debug('loadActiveWorkspaceCampaigns degraded cleanly', {
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * Checks whether a user was already enrolled in this campaign on the same post within dedup_user_post_hours.
 */
export async function hasRecentCampaignEnrollment(
  workspaceId: string,
  campaignId: string,
  platformUserId: string,
  mediaId: string | null | undefined,
  dedupHours: number
): Promise<boolean> {
  if (!dedupHours || dedupHours <= 0 || !platformUserId) return false;
  try {
    const sinceIso = new Date(Date.now() - dedupHours * 60 * 60 * 1000).toISOString();
    let query = supabaseAdmin
      .from('campaign_enrollments')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('campaign_id', campaignId)
      .eq('platform_user_id', platformUserId)
      .gte('created_at', sinceIso);

    if (mediaId) {
      query = query.eq('media_id', mediaId);
    }

    const { data } = await query.limit(1);
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Picks A/B variant deterministically per user+campaign so re-deliveries get the same variant.
 */
export function selectAbVariant(
  campaign: Pick<InstagramCampaign, 'id' | 'ab_variant_b_dm' | 'ab_split_pct'>,
  userId: string
): 'A' | 'B' {
  if (!campaign.ab_variant_b_dm?.trim()) return 'A';
  const split = Math.max(0, Math.min(100, campaign.ab_split_pct ?? 50));
  let hash = 0;
  const seed = `${campaign.id}:${userId}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100;
  }
  return hash < split ? 'B' : 'A';
}
