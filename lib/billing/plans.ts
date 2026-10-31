// ============================================================
// PLAN DEFINITIONS — DB-backed with hardcoded fallback
// Admin edits at /admin/plans → saved to Supabase `plans` table
// → reflected on homepage, billing page, and Cashfree payments.
//
// SECURITY: Client NEVER sends prices. Server resolves from here.
// ============================================================

import { createClient } from '@supabase/supabase-js';

export type PlanId = 'spark' | 'creator' | 'pro' | 'studio';
export type BillingCycle = 'monthly' | 'annual';
export type Currency = 'INR' | 'USD';

export interface PlanPricing {
  monthly: number;       // Amount in smallest unit (paise for INR, cents for USD)
  annual: number;        // Total annual amount in smallest unit
  annualMonthly: number; // Monthly equivalent when paid annually (display only)
}

export interface PlanLimits {
  posts_per_month: number;
  channels: number;
  ai_credits_per_month: number;
  ig_comments_per_month: number;
  linkedin_comments_per_month: number;
  team_seats: number;
  brand_voices: number;
  analytics_retention_days: number;
  workspaces: number;
}

export interface PlanFeatures {
  custom_domain: boolean;
  badge_removal: boolean;
  dm_concierge: boolean;
  dm_concierge_full: boolean;
  lead_scoring: boolean;
  follow_to_unlock: boolean;
  flightplan_ai: boolean;
  first_comment: boolean;
  content_humanizer: boolean;
  auto_hide_spam: boolean;
  csv_export: boolean;
  white_label: boolean;
  api_access: boolean;
  approval_workflows: boolean;
  priority_support: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  pricing: Record<Currency, PlanPricing>;
  limits: PlanLimits;
  features: PlanFeatures;
  sortOrder: number;
  isFreeTier: boolean;
  templateCount: number;
}

// NOTE: Pixenox is NOT GST-registered yet.
export const GST_ENABLED = false;
export const GST_RATE = 0.18;

// ── HARDCODED FALLBACK (used if DB is unavailable) ──────────────
// These values are the ground truth. The DB is kept in sync via
// /admin/plans. If DB returns nothing, we fall back to these.

export const PLANS_FALLBACK: Record<PlanId, PlanDefinition> = {
  spark: {
    id: 'spark',
    name: 'Spark',
    tagline: 'Free forever — your profile, your identity.',
    pricing: {
      INR: { monthly: 0, annual: 0, annualMonthly: 0 },
      USD: { monthly: 0, annual: 0, annualMonthly: 0 },
    },
    limits: {
      posts_per_month: 15,
      channels: 2,
      ai_credits_per_month: 25,
      ig_comments_per_month: 250,
      linkedin_comments_per_month: 50,
      team_seats: 1,
      brand_voices: 0,
      analytics_retention_days: 30,
      workspaces: 1,
    },
    features: {
      custom_domain: false, badge_removal: false, dm_concierge: false,
      dm_concierge_full: false, lead_scoring: false, follow_to_unlock: true,
      flightplan_ai: false, first_comment: false, content_humanizer: false,
      auto_hide_spam: false, csv_export: false, white_label: false,
      api_access: false, approval_workflows: false, priority_support: false,
    },
    sortOrder: 0,
    isFreeTier: true,
    templateCount: 5,
  },

  creator: {
    id: 'creator',
    name: 'Creator',
    tagline: 'Professional brand, zero third-party branding.',
    pricing: {
      INR: { monthly: 79900, annual: 799000, annualMonthly: 66600 },
      USD: { monthly: 900, annual: 9000, annualMonthly: 750 },
    },
    limits: {
      posts_per_month: -1,
      channels: 4,
      ai_credits_per_month: 150,
      ig_comments_per_month: 500,
      linkedin_comments_per_month: 250,
      team_seats: 1,
      brand_voices: 1,
      analytics_retention_days: 90,
      workspaces: 1,
    },
    features: {
      custom_domain: false, badge_removal: true, dm_concierge: true,
      dm_concierge_full: false, lead_scoring: false, follow_to_unlock: true,
      flightplan_ai: false, first_comment: false, content_humanizer: false,
      auto_hide_spam: true, csv_export: false, white_label: false,
      api_access: false, approval_workflows: false, priority_support: false,
    },
    sortOrder: 1,
    isFreeTier: false,
    templateCount: 16,
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'The full engine for serious creators.',
    pricing: {
      INR: { monthly: 199900, annual: 1999000, annualMonthly: 166600 },
      USD: { monthly: 2400, annual: 24000, annualMonthly: 2000 },
    },
    limits: {
      posts_per_month: -1,
      channels: 8,
      ai_credits_per_month: 500,
      ig_comments_per_month: 3000,
      linkedin_comments_per_month: 1500,
      team_seats: 3,
      brand_voices: 5,
      analytics_retention_days: 365,
      workspaces: 1,
    },
    features: {
      custom_domain: true, badge_removal: true, dm_concierge: true,
      dm_concierge_full: true, lead_scoring: true, follow_to_unlock: true,
      flightplan_ai: true, first_comment: true, content_humanizer: true,
      auto_hide_spam: true, csv_export: true, white_label: false,
      api_access: false, approval_workflows: false, priority_support: true,
    },
    sortOrder: 2,
    isFreeTier: false,
    templateCount: 16,
  },

  studio: {
    id: 'studio',
    name: 'Studio',
    tagline: 'Multi-brand agency powerhouse.',
    pricing: {
      INR: { monthly: 499900, annual: 4999000, annualMonthly: 416600 },
      USD: { monthly: 5900, annual: 59000, annualMonthly: 4917 },
    },
    limits: {
      posts_per_month: -1,
      channels: -1,
      ai_credits_per_month: -1,
      ig_comments_per_month: -1,
      linkedin_comments_per_month: -1,
      team_seats: 10,
      brand_voices: -1,
      analytics_retention_days: -1,
      workspaces: 3,
    },
    features: {
      custom_domain: true, badge_removal: true, dm_concierge: true,
      dm_concierge_full: true, lead_scoring: true, follow_to_unlock: true,
      flightplan_ai: true, first_comment: true, content_humanizer: true,
      auto_hide_spam: true, csv_export: true, white_label: true,
      api_access: true, approval_workflows: true, priority_support: true,
    },
    sortOrder: 3,
    isFreeTier: false,
    templateCount: 16,
  },
};

// ── In-memory cache (5-minute TTL) ─────────────────────────────
let planCache: Record<PlanId, PlanDefinition> | null = null;
let planCacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Map a Supabase `plans` row to a PlanDefinition, merging INR from features JSONB */
function rowToPlanDefinition(row: Record<string, unknown>): PlanDefinition | null {
  const id = row.id as string;
  if (!id) return null;

  const fallback = PLANS_FALLBACK[id as PlanId];
  if (!fallback) return null; // Unknown plan id — skip

  const features = (row.features as Record<string, unknown>) || {};
  const limits = (row.limits as Record<string, unknown>) || {};

  // INR prices from features JSONB (paise). Fall back to hardcoded if absent.
  const monthlyInr = typeof features.price_monthly_inr === 'number'
    ? features.price_monthly_inr
    : fallback.pricing.INR.monthly;
  const yearlyInr = typeof features.price_yearly_inr === 'number'
    ? features.price_yearly_inr
    : fallback.pricing.INR.annual;
  const annualMonthlyInr = typeof features.price_annual_monthly_inr === 'number'
    ? features.price_annual_monthly_inr
    : fallback.pricing.INR.annualMonthly;

  // USD prices from dedicated columns (cents)
  const monthlyUsd = typeof row.price_monthly_usd === 'number'
    ? row.price_monthly_usd
    : fallback.pricing.USD.monthly;
  const yearlyUsd = typeof row.price_yearly_usd === 'number'
    ? row.price_yearly_usd
    : fallback.pricing.USD.annual;

  // Merge plan limits from JSONB, with fallback defaults
  const mergedLimits: PlanLimits = {
    posts_per_month: typeof limits.posts_per_month === 'number' ? limits.posts_per_month : fallback.limits.posts_per_month,
    channels: typeof limits.channels === 'number' ? limits.channels : fallback.limits.channels,
    ai_credits_per_month: typeof limits.ai_credits_per_month === 'number' ? limits.ai_credits_per_month : fallback.limits.ai_credits_per_month,
    ig_comments_per_month: typeof limits.ig_comments_per_month === 'number' ? limits.ig_comments_per_month : fallback.limits.ig_comments_per_month,
    linkedin_comments_per_month: typeof limits.linkedin_comments_per_month === 'number' ? limits.linkedin_comments_per_month : fallback.limits.linkedin_comments_per_month,
    team_seats: typeof limits.team_seats === 'number' ? limits.team_seats : fallback.limits.team_seats,
    brand_voices: typeof limits.brand_voices === 'number' ? limits.brand_voices : fallback.limits.brand_voices,
    analytics_retention_days: typeof limits.analytics_retention_days === 'number' ? limits.analytics_retention_days : fallback.limits.analytics_retention_days,
    workspaces: typeof limits.workspaces === 'number' ? limits.workspaces : fallback.limits.workspaces,
  };

  return {
    id: id as PlanId,
    name: (row.name as string) || fallback.name,
    tagline: (row.description as string) || fallback.tagline,
    pricing: {
      INR: {
        monthly: monthlyInr,
        annual: yearlyInr,
        annualMonthly: annualMonthlyInr,
      },
      USD: {
        monthly: monthlyUsd,
        annual: yearlyUsd,
        annualMonthly: Math.round(yearlyUsd / 12),
      },
    },
    limits: mergedLimits,
    features: fallback.features, // Feature flags stay hardcoded for now
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : fallback.sortOrder,
    isFreeTier: fallback.isFreeTier,
    templateCount: fallback.templateCount,
  };
}

/** Load plans from DB, fall back to hardcoded PLANS_FALLBACK on any error. */
async function loadPlansFromDb(): Promise<Record<PlanId, PlanDefinition>> {
  const client = getAdminClient();
  if (!client) return { ...PLANS_FALLBACK };

  try {
    const { data, error } = await client
      .from('plans')
      .select('*')
      .in('id', ['spark', 'creator', 'pro', 'studio'])
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('[plans] DB unavailable or empty — using fallback', error?.message);
      return { ...PLANS_FALLBACK };
    }

    const result: Partial<Record<PlanId, PlanDefinition>> = {};
    for (const row of data) {
      const def = rowToPlanDefinition(row as Record<string, unknown>);
      if (def) result[def.id] = def;
    }

    // Always ensure all 4 plans exist (fill missing from fallback)
    for (const id of ['spark', 'creator', 'pro', 'studio'] as PlanId[]) {
      if (!result[id]) result[id] = PLANS_FALLBACK[id];
    }

    return result as Record<PlanId, PlanDefinition>;
  } catch (err) {
    console.warn('[plans] Unexpected DB error — using fallback', err);
    return { ...PLANS_FALLBACK };
  }
}

/** Get cached plans (server-side only). Refreshes every 5 minutes. */
async function getPlans(): Promise<Record<PlanId, PlanDefinition>> {
  const now = Date.now();
  if (planCache && now < planCacheExpiry) return planCache;

  const fresh = await loadPlansFromDb();
  planCache = fresh;
  planCacheExpiry = now + CACHE_TTL_MS;
  return fresh;
}

/** Clear the plan cache (called after admin updates a plan). */
export function clearPlanCache(planId?: string): void {
  planCache = null;
  planCacheExpiry = 0;
}

// ── Public API ──────────────────────────────────────────────────

export async function getPlanAsync(planId: string): Promise<PlanDefinition | null> {
  const plans = await getPlans();
  return plans[planId as PlanId] || null;
}

export async function getPlanPriceAsync(
  planId: PlanId,
  cycle: BillingCycle,
  currency: Currency
): Promise<number> {
  const plan = await getPlanAsync(planId);
  if (!plan || plan.isFreeTier) return 0;
  return cycle === 'monthly'
    ? plan.pricing[currency].monthly
    : plan.pricing[currency].annual;
}

export async function getAllPlansAsync(): Promise<PlanDefinition[]> {
  const plans = await getPlans();
  return Object.values(plans).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Synchronous fallback API (kept for non-async callers) ───────
// These read from cache if available, or return hardcoded fallback.

export function getPlan(planId: string): PlanDefinition | null {
  if (planCache) return planCache[planId as PlanId] || null;
  return PLANS_FALLBACK[planId as PlanId] || null;
}

export function getPlanPrice(planId: PlanId, cycle: BillingCycle, currency: Currency): number {
  const plan = getPlan(planId);
  if (!plan || plan.isFreeTier) return 0;
  return cycle === 'monthly'
    ? plan.pricing[currency].monthly
    : plan.pricing[currency].annual;
}

export function getAllPlans(): PlanDefinition[] {
  const plans = planCache || PLANS_FALLBACK;
  return Object.values(plans).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Format price for display.
 * Amounts are stored in smallest unit (paise/cents).
 */
export function formatPrice(amountSmallest: number, currency: Currency): string {
  const amount = amountSmallest / 100;
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Detect currency from country/locale.
 */
export function detectCurrency(countryCode?: string): Currency {
  if (countryCode === 'IN') return 'INR';
  return 'USD';
}

/**
 * Check if a plan upgrade is valid.
 */
export function isValidUpgrade(fromPlanId: PlanId, toPlanId: PlanId): boolean {
  const from = getPlan(fromPlanId);
  const to = getPlan(toPlanId);
  if (!from || !to) return false;
  return to.sortOrder > from.sortOrder;
}

// Reverse trial configuration
export const REVERSE_TRIAL = {
  durationDays: 14,
  trialPlanId: 'pro' as PlanId,
  downgradePlanId: 'spark' as PlanId,
  reminderDaysBefore: 4,
};
