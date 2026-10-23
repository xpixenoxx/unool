// ============================================================
// PLAN DEFINITIONS — Single Source of Truth
// All pricing, limits, and feature flags live here.
// The client NEVER sends prices. The server resolves them from planId.
// ============================================================

export type PlanId = 'spark' | 'creator' | 'pro' | 'studio';
export type BillingCycle = 'monthly' | 'annual';
export type Currency = 'INR' | 'USD';

export interface PlanPricing {
  monthly: number;      // Amount in smallest unit (paise for INR, cents for USD)
  annual: number;       // Total annual amount in smallest unit
  annualMonthly: number; // Monthly equivalent when paid annually (display only)
}

export interface PlanLimits {
  posts_per_month: number;         // -1 = unlimited
  channels: number;                // Connected platforms
  ai_credits_per_month: number;    // -1 = unlimited (fair use)
  ig_comments_per_month: number;   // -1 = unlimited
  linkedin_comments_per_month: number;
  team_seats: number;
  brand_voices: number;            // -1 = unlimited
  analytics_retention_days: number; // -1 = lifetime
  workspaces: number;
}

export interface PlanFeatures {
  custom_domain: boolean;
  badge_removal: boolean;          // Remove "Made with unool"
  dm_concierge: boolean;
  dm_concierge_full: boolean;      // Full AI knowledge base DM
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
  // Templates available on this plan
  templateCount: number;           // 5 for Spark, 16 for paid
}

// ── Price Constants (in paise / cents) ──────────────────────────

// NOTE: Pixenox is NOT GST-registered yet.
// Prices are all-inclusive. No GST is charged or displayed.
// When GST registration happens (after ₹20L turnover),
// set GST_ENABLED = true and add GST on top.
export const GST_ENABLED = false;
export const GST_RATE = 0.18; // 18% — only used when GST_ENABLED = true

// ── Plan Registry ───────────────────────────────────────────────

export const PLANS: Record<PlanId, PlanDefinition> = {
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
      custom_domain: false,
      badge_removal: false,
      dm_concierge: false,
      dm_concierge_full: false,
      lead_scoring: false,
      follow_to_unlock: true,
      flightplan_ai: false,
      first_comment: false,
      content_humanizer: false,
      auto_hide_spam: false,
      csv_export: false,
      white_label: false,
      api_access: false,
      approval_workflows: false,
      priority_support: false,
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
      INR: {
        monthly: 79900,        // ₹799.00
        annual: 799000,        // ₹7,990.00
        annualMonthly: 66600,  // ₹666.00/mo
      },
      USD: {
        monthly: 900,          // $9.00
        annual: 9000,          // $90.00
        annualMonthly: 750,    // $7.50/mo
      },
    },
    limits: {
      posts_per_month: -1,     // unlimited
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
      custom_domain: false,
      badge_removal: true,
      dm_concierge: true,       // Basic DM concierge
      dm_concierge_full: false,
      lead_scoring: false,
      follow_to_unlock: true,
      flightplan_ai: false,
      first_comment: false,
      content_humanizer: false,
      auto_hide_spam: true,
      csv_export: false,
      white_label: false,
      api_access: false,
      approval_workflows: false,
      priority_support: false,
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
      INR: {
        monthly: 199900,       // ₹1,999.00
        annual: 1999000,       // ₹19,990.00
        annualMonthly: 166600, // ₹1,666.00/mo
      },
      USD: {
        monthly: 2400,         // $24.00
        annual: 24000,         // $240.00
        annualMonthly: 2000,   // $20.00/mo
      },
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
      custom_domain: true,
      badge_removal: true,
      dm_concierge: true,
      dm_concierge_full: true,
      lead_scoring: true,
      follow_to_unlock: true,
      flightplan_ai: true,
      first_comment: true,
      content_humanizer: true,
      auto_hide_spam: true,
      csv_export: true,
      white_label: false,
      api_access: false,
      approval_workflows: false,
      priority_support: true,
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
      INR: {
        monthly: 499900,       // ₹4,999.00
        annual: 4999000,       // ₹49,990.00
        annualMonthly: 416600, // ₹4,166.00/mo
      },
      USD: {
        monthly: 5900,         // $59.00
        annual: 59000,         // $590.00
        annualMonthly: 4917,   // $49.17/mo
      },
    },
    limits: {
      posts_per_month: -1,
      channels: -1,            // unlimited
      ai_credits_per_month: -1,
      ig_comments_per_month: -1,
      linkedin_comments_per_month: -1,
      team_seats: 10,
      brand_voices: -1,
      analytics_retention_days: -1, // lifetime
      workspaces: 3,
    },
    features: {
      custom_domain: true,
      badge_removal: true,
      dm_concierge: true,
      dm_concierge_full: true,
      lead_scoring: true,
      follow_to_unlock: true,
      flightplan_ai: true,
      first_comment: true,
      content_humanizer: true,
      auto_hide_spam: true,
      csv_export: true,
      white_label: true,
      api_access: true,
      approval_workflows: true,
      priority_support: true,
    },
    sortOrder: 3,
    isFreeTier: false,
    templateCount: 16,
  },
};

// ── Helper Functions ────────────────────────────────────────────

export function getPlan(planId: string): PlanDefinition | null {
  return PLANS[planId as PlanId] || null;
}

export function getPlanPrice(planId: PlanId, cycle: BillingCycle, currency: Currency): number {
  const plan = PLANS[planId];
  if (!plan || plan.isFreeTier) return 0;
  return cycle === 'monthly' ? plan.pricing[currency].monthly : plan.pricing[currency].annual;
}

/**
 * Format price for display.
 * Amounts are stored in smallest unit (paise/cents), this converts to display format.
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
 * India → INR, everything else → USD.
 */
export function detectCurrency(countryCode?: string): Currency {
  if (countryCode === 'IN') return 'INR';
  return 'USD';
}

/**
 * Get all plans as an ordered array for the pricing page.
 */
export function getAllPlans(): PlanDefinition[] {
  return Object.values(PLANS).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Check if a plan upgrade is valid (can only go up, not down via this flow).
 */
export function isValidUpgrade(fromPlanId: PlanId, toPlanId: PlanId): boolean {
  const from = PLANS[fromPlanId];
  const to = PLANS[toPlanId];
  if (!from || !to) return false;
  return to.sortOrder > from.sortOrder;
}

// Reverse trial configuration
export const REVERSE_TRIAL = {
  durationDays: 14,
  trialPlanId: 'pro' as PlanId,
  downgradePlanId: 'spark' as PlanId,
  reminderDaysBefore: 4,  // Send reminder on day 10
};
