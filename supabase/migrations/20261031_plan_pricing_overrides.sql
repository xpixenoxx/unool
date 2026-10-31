-- ============================================================
-- Plan pricing overrides & INR price columns
-- Created: 2026-10-31
-- 
-- 1. Seed the plans table with the 4 Unool plans (spark/creator/pro/studio)
--    including INR prices stored in the features JSONB column.
-- 2. Create user_plan_overrides table for per-user custom pricing.
-- ============================================================

-- ── 1. Seed plans table ─────────────────────────────────────────
-- Insert the 4 canonical plans. On conflict (id), update to keep prices in sync.
-- Prices are in smallest units: paise for INR, cents for USD.

INSERT INTO plans (id, name, description, price_monthly_usd, price_yearly_usd, features, limits, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'spark',
    'Spark',
    'Free forever — your profile, your identity.',
    0,
    0,
    '{"price_monthly_inr": 0, "price_yearly_inr": 0, "price_annual_monthly_inr": 0,
      "badge_removal": false, "dm_concierge": false, "dm_concierge_full": false,
      "lead_scoring": false, "follow_to_unlock": true, "custom_domain": false,
      "white_label": false, "api_access": false, "approval_workflows": false,
      "priority_support": false}'::jsonb,
    '{"posts_per_month": 15, "channels": 2, "ai_credits_per_month": 25,
      "ig_comments_per_month": 250, "linkedin_comments_per_month": 50,
      "team_seats": 1, "brand_voices": 0, "analytics_retention_days": 30, "workspaces": 1}'::jsonb,
    true,
    0,
    NOW(),
    NOW()
  ),
  (
    'creator',
    'Creator',
    'Professional brand, zero third-party branding.',
    900,
    9000,
    '{"price_monthly_inr": 79900, "price_yearly_inr": 799000, "price_annual_monthly_inr": 66600,
      "badge_removal": true, "dm_concierge": true, "dm_concierge_full": false,
      "lead_scoring": false, "follow_to_unlock": true, "custom_domain": false,
      "white_label": false, "api_access": false, "approval_workflows": false,
      "priority_support": false}'::jsonb,
    '{"posts_per_month": -1, "channels": 4, "ai_credits_per_month": 150,
      "ig_comments_per_month": 500, "linkedin_comments_per_month": 250,
      "team_seats": 1, "brand_voices": 1, "analytics_retention_days": 90, "workspaces": 1}'::jsonb,
    true,
    1,
    NOW(),
    NOW()
  ),
  (
    'pro',
    'Pro',
    'The full engine for serious creators.',
    2400,
    24000,
    '{"price_monthly_inr": 199900, "price_yearly_inr": 1999000, "price_annual_monthly_inr": 166600,
      "badge_removal": true, "dm_concierge": true, "dm_concierge_full": true,
      "lead_scoring": true, "follow_to_unlock": true, "custom_domain": true,
      "white_label": false, "api_access": false, "approval_workflows": false,
      "priority_support": true}'::jsonb,
    '{"posts_per_month": -1, "channels": 8, "ai_credits_per_month": 500,
      "ig_comments_per_month": 3000, "linkedin_comments_per_month": 1500,
      "team_seats": 3, "brand_voices": 5, "analytics_retention_days": 365, "workspaces": 1}'::jsonb,
    true,
    2,
    NOW(),
    NOW()
  ),
  (
    'studio',
    'Studio',
    'Multi-brand agency powerhouse.',
    5900,
    59000,
    '{"price_monthly_inr": 499900, "price_yearly_inr": 4999000, "price_annual_monthly_inr": 416600,
      "badge_removal": true, "dm_concierge": true, "dm_concierge_full": true,
      "lead_scoring": true, "follow_to_unlock": true, "custom_domain": true,
      "white_label": true, "api_access": true, "approval_workflows": true,
      "priority_support": true}'::jsonb,
    '{"posts_per_month": -1, "channels": -1, "ai_credits_per_month": -1,
      "ig_comments_per_month": -1, "linkedin_comments_per_month": -1,
      "team_seats": 10, "brand_voices": -1, "analytics_retention_days": -1, "workspaces": 3}'::jsonb,
    true,
    3,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_usd = EXCLUDED.price_monthly_usd,
  price_yearly_usd = EXCLUDED.price_yearly_usd,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ── 2. User plan overrides table ────────────────────────────────
-- Allows admin to give a specific user/workspace a custom price for any plan.
-- Only one active override per (workspace_id, plan_id) pair.

CREATE TABLE IF NOT EXISTS user_plan_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who gets the override (looked up by user_id but stored against workspace)
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,             -- The Supabase auth user id (owner)
    user_email TEXT NOT NULL,          -- Stored for display in admin (denormalized)
    user_name TEXT,                    -- Optional display name

    -- Which plan is being overridden
    plan_id TEXT NOT NULL,             -- e.g. 'creator', 'pro', 'studio'

    -- Custom prices (paise for INR, cents for USD). NULL = use standard plan price.
    custom_monthly_inr INTEGER,        -- e.g. 69900 for ₹699
    custom_yearly_inr INTEGER,         -- e.g. 699000 for ₹6,990 annual
    custom_annual_monthly_inr INTEGER, -- Display-only: per-month when billed annually
    custom_monthly_usd INTEGER,        -- e.g. 700 for $7.00
    custom_yearly_usd INTEGER,

    -- Admin notes (why this override was granted)
    note TEXT,

    -- Lifecycle
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_admin_id TEXT NOT NULL,  -- Admin who created this override
    removed_by_admin_id TEXT,           -- Admin who removed it (nullable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ             -- When removed (NULL = still active)
);

-- Ensure only ONE active override per workspace+plan
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plan_overrides_active
    ON user_plan_overrides(workspace_id, plan_id)
    WHERE is_active = true;

-- Lookup by user_id (for billing flow)
CREATE INDEX IF NOT EXISTS idx_user_plan_overrides_user
    ON user_plan_overrides(user_id)
    WHERE is_active = true;

-- Lookup by workspace_id (for billing page)
CREATE INDEX IF NOT EXISTS idx_user_plan_overrides_workspace
    ON user_plan_overrides(workspace_id)
    WHERE is_active = true;

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE user_plan_overrides ENABLE ROW LEVEL SECURITY;

-- Users can read their own overrides (for billing page display)
CREATE POLICY "Users can view own overrides" ON user_plan_overrides
    FOR SELECT USING (user_id = auth.uid());

-- Service role has full access (used by server-side routes)
CREATE POLICY "Service role full access to overrides" ON user_plan_overrides
    FOR ALL USING (auth.role() = 'service_role');

