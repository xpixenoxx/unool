-- ============================================================
-- Migration: Audit Wave 1 & Wave 2 Security, GDPR, RLS & Referral Fixes
-- Date: 2026-11-17
-- Production-verified against live Supabase schema (project bhkpkylcwcxtpxbxrpag).
-- Safe & idempotent on both existing live DB and fresh instances.
-- ============================================================

-- ── 1. Remove leftover legacy permissive/tautological policies (preserve live strict policies) ──
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.analytics_events;

-- ── 2. Harden follow_gates & follow_gate_sessions RLS (add owner fallback + TO service_role) ──
DROP POLICY IF EXISTS "Workspace members can view own gates" ON public.follow_gates;
DROP POLICY IF EXISTS "Workspace members can insert gates" ON public.follow_gates;
DROP POLICY IF EXISTS "Workspace members can update gates" ON public.follow_gates;
DROP POLICY IF EXISTS "Workspace members can delete gates" ON public.follow_gates;
DROP POLICY IF EXISTS "Service role full access to follow_gates" ON public.follow_gates;

CREATE POLICY "Workspace members can view own gates"
  ON public.follow_gates
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = (SELECT auth.uid())
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Workspace members can insert gates"
  ON public.follow_gates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = (SELECT auth.uid())
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Workspace members can update gates"
  ON public.follow_gates
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = (SELECT auth.uid())
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = (SELECT auth.uid())
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Workspace members can delete gates"
  ON public.follow_gates
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = (SELECT auth.uid())
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Service role full access to follow_gates"
  ON public.follow_gates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to follow_gate_sessions" ON public.follow_gate_sessions;
CREATE POLICY "Service role full access to follow_gate_sessions"
  ON public.follow_gate_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 3. Ensure referral_rewards exists + referral schema & RLS hardening ───────
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON public.referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_created ON public.referral_rewards(created_at DESC);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.referrals'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;

  ALTER TABLE public.referrals
    ADD CONSTRAINT referrals_status_check
    CHECK (status IN ('signed_up', 'converted', 'rewarded', 'refunded'));
END $$;

DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Service role full access to referral_codes" ON public.referral_codes;

CREATE POLICY "Users can view own referral code"
  ON public.referral_codes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role full access to referral_codes"
  ON public.referral_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service role full access to referrals" ON public.referrals;

CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (
    referrer_user_id = (SELECT auth.uid())
    OR referred_user_id = (SELECT auth.uid())
  );

CREATE POLICY "Service role full access to referrals"
  ON public.referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own referral rewards" ON public.referral_rewards;
DROP POLICY IF EXISTS "Service role full access to referral_rewards" ON public.referral_rewards;

CREATE POLICY "Users can view own referral rewards"
  ON public.referral_rewards
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role full access to referral_rewards"
  ON public.referral_rewards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 4. Update delete_workspace_data RPC (preserve all live ownership & table checks + purge referral_rewards) ──
CREATE OR REPLACE FUNCTION public.delete_workspace_data(
  target_workspace_id uuid,
  target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 0. Verify workspace ownership & ensure no other active team members remain
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = target_workspace_id AND owner_id = target_user_id
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN_NOT_WORKSPACE_OWNER';
    END IF;
  END IF;

  IF to_regclass('public.workspace_members') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = target_workspace_id
        AND user_id IS DISTINCT FROM target_user_id
        AND COALESCE(status, 'active') = 'active'
    ) THEN
      RAISE EXCEPTION 'WORKSPACE_HAS_ACTIVE_MEMBERS';
    END IF;
  END IF;

  -- 1. Instagram, Facebook, Threads & LinkedIn automation tables
  IF to_regclass('public.instagram_comment_logs') IS NOT NULL THEN
    DELETE FROM public.instagram_comment_logs WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.instagram_dm_logs') IS NOT NULL THEN
    DELETE FROM public.instagram_dm_logs WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.instagram_flagged_comments') IS NOT NULL THEN
    DELETE FROM public.instagram_flagged_comments WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.instagram_flagged_dms') IS NOT NULL THEN
    DELETE FROM public.instagram_flagged_dms WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.instagram_outbound_jobs') IS NOT NULL THEN
    DELETE FROM public.instagram_outbound_jobs WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.instagram_reply_velocity') IS NOT NULL THEN
    DELETE FROM public.instagram_reply_velocity WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.instagram_automation_config') IS NOT NULL THEN
    DELETE FROM public.instagram_automation_config WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.facebook_comment_logs') IS NOT NULL THEN
    DELETE FROM public.facebook_comment_logs WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.facebook_automation_config') IS NOT NULL THEN
    DELETE FROM public.facebook_automation_config WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.threads_reply_logs') IS NOT NULL THEN
    DELETE FROM public.threads_reply_logs WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.threads_automation_config') IS NOT NULL THEN
    DELETE FROM public.threads_automation_config WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.linkedin_comment_logs') IS NOT NULL THEN
    DELETE FROM public.linkedin_comment_logs WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.linkedin_automation_config') IS NOT NULL THEN
    DELETE FROM public.linkedin_automation_config WHERE workspace_id = target_workspace_id;
  END IF;

  -- 2. Brand materials, Follow gates & Security audit events
  IF to_regclass('public.brand_materials_pages') IS NOT NULL THEN
    DELETE FROM public.brand_materials_pages WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.follow_gate_sessions') IS NOT NULL THEN
    DELETE FROM public.follow_gate_sessions WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.follow_gates') IS NOT NULL THEN
    DELETE FROM public.follow_gates WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.workspace_security_events') IS NOT NULL THEN
    DELETE FROM public.workspace_security_events WHERE workspace_id = target_workspace_id;
  END IF;

  -- 3. Analytics, API, AI, Media & Content Arcs
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    DELETE FROM public.analytics_events WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.api_keys') IS NOT NULL THEN
    DELETE FROM public.api_keys WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.api_calls') IS NOT NULL THEN
    DELETE FROM public.api_calls WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.ai_usage') IS NOT NULL THEN
    DELETE FROM public.ai_usage WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.content_arcs') IS NOT NULL THEN
    DELETE FROM public.content_arcs WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.media_uploads') IS NOT NULL THEN
    DELETE FROM public.media_uploads WHERE workspace_id = target_workspace_id;
  END IF;

  -- 4. Posts, Variants, Connections & Profiles
  IF to_regclass('public.post_variants') IS NOT NULL THEN
    DELETE FROM public.post_variants
    WHERE post_id IN (SELECT id FROM public.posts WHERE workspace_id = target_workspace_id);
  END IF;
  IF to_regclass('public.posts') IS NOT NULL THEN
    DELETE FROM public.posts WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.platform_connections') IS NOT NULL THEN
    DELETE FROM public.platform_connections
    WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DELETE FROM public.profiles
    WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;

  -- 5. Onboarding, Referrals, Rewards, Subscriptions & Billing
  IF to_regclass('public.onboarding_checklists') IS NOT NULL THEN
    DELETE FROM public.onboarding_checklists WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.user_section_time') IS NOT NULL THEN
    DELETE FROM public.user_section_time WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.referral_rewards') IS NOT NULL THEN
    DELETE FROM public.referral_rewards WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.referrals') IS NOT NULL THEN
    DELETE FROM public.referrals
    WHERE referrer_user_id = target_user_id OR referred_user_id = target_user_id;
  END IF;
  IF to_regclass('public.referral_codes') IS NOT NULL THEN
    DELETE FROM public.referral_codes WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    DELETE FROM public.subscriptions
    WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;
  IF to_regclass('public.payment_orders') IS NOT NULL THEN
    DELETE FROM public.payment_orders
    WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;

  -- 6. User preferences & credentials
  IF to_regclass('public.user_preferences') IS NOT NULL THEN
    DELETE FROM public.user_preferences WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.user_credentials') IS NOT NULL THEN
    DELETE FROM public.user_credentials WHERE user_id = target_user_id;
  END IF;

  -- 7. Workspace membership, Workspace & Public user
  IF to_regclass('public.workspace_members') IS NOT NULL THEN
    DELETE FROM public.workspace_members
    WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    DELETE FROM public.workspaces
    WHERE id = target_workspace_id AND owner_id = target_user_id;
  END IF;
  IF to_regclass('public.users') IS NOT NULL THEN
    DELETE FROM public.users WHERE id = target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_workspace_data(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_workspace_data(uuid, uuid) TO service_role;

-- ── 5. Atomic referral & bonus AI credit RPC helpers (service_role only) ─────
CREATE OR REPLACE FUNCTION public.increment_referral_click(target_code text)
RETURNS SETOF public.referral_codes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.referral_codes
  SET click_count = click_count + 1,
      updated_at = NOW()
  WHERE code = UPPER(TRIM(target_code))
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.increment_referral_click(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_referral_click(text) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_referral_signup_reward(
  target_code text,
  reward_credits integer DEFAULT 200
)
RETURNS TABLE(user_id uuid, rewards_earned integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.referral_codes
  SET signup_count = signup_count + 1,
      rewards_earned = rewards_earned + GREATEST(0, reward_credits),
      updated_at = NOW()
  WHERE code = UPPER(TRIM(target_code))
  RETURNING referral_codes.user_id, referral_codes.rewards_earned;
$$;

REVOKE ALL ON FUNCTION public.apply_referral_signup_reward(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_signup_reward(text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_referral_ai_credit(
  target_user_id uuid,
  credit_amount integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  consumed boolean := false;
BEGIN
  IF credit_amount <= 0 THEN
    RETURN true;
  END IF;

  UPDATE public.referral_codes
  SET credits_used = credits_used + credit_amount,
      updated_at = NOW()
  WHERE user_id = target_user_id
    AND (rewards_earned - credits_used) >= credit_amount;

  IF FOUND THEN
    consumed := true;
    IF to_regclass('public.referral_rewards') IS NOT NULL THEN
      INSERT INTO public.referral_rewards (user_id, credits, reason)
      VALUES (target_user_id, -credit_amount, 'ai_credit_consumed');
    END IF;
  END IF;

  RETURN consumed;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_referral_ai_credit(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_referral_ai_credit(uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.adjust_referral_conversion_rewards(
  target_code text,
  delta_conversions integer,
  delta_credits integer,
  delta_months integer
)
RETURNS SETOF public.referral_codes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.referral_codes
  SET conversion_count = GREATEST(0, conversion_count + delta_conversions),
      rewards_earned = GREATEST(credits_used, rewards_earned + delta_credits),
      months_earned = GREATEST(0, months_earned + delta_months),
      updated_at = NOW()
  WHERE code = UPPER(TRIM(target_code))
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.adjust_referral_conversion_rewards(text, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_referral_conversion_rewards(text, integer, integer, integer) TO service_role;
