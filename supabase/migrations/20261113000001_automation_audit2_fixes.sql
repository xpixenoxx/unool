-- ============================================================
-- Migration: 20261113000001_automation_audit2_fixes.sql
-- Fixes all P0/P1/P2 database-level findings from Audit No.2 Phase B:
--   B-01: UNIQUE constraint on instagram_comment_logs.comment_id
--   B-02: UNIQUE constraint on instagram_dm_logs.message_id
--   B-03: UNIQUE constraint on instagram_flagged_comments.comment_id
--   B-15: referral deletion uses wrong column name 'referrer_id' (fix delete_workspace_data)
--   B-19: Missing service_role INSERT policy on instagram_comment_logs
--   Purge expired follow_gate_sessions (B-orphan cleanup)
--   Add owner_id to automation RLS policies (B-rls gap)
-- ============================================================

-- ── B-01: Add UNIQUE constraint on instagram_comment_logs.comment_id ────────
-- Drop the old non-unique index first (it will conflict with the new unique one)
DROP INDEX IF EXISTS idx_ig_comment_logs_comment_id;

-- Add the UNIQUE constraint (also creates a unique index)
ALTER TABLE instagram_comment_logs
  ADD CONSTRAINT uq_ig_comment_logs_comment_id UNIQUE (comment_id);

-- ── B-02: Add UNIQUE constraint on instagram_dm_logs.message_id ─────────────
ALTER TABLE instagram_dm_logs
  ADD CONSTRAINT uq_ig_dm_logs_message_id UNIQUE (message_id);

-- ── B-03: Add UNIQUE constraint on instagram_flagged_comments.comment_id ────
ALTER TABLE instagram_flagged_comments
  ADD CONSTRAINT uq_ig_flagged_comments_comment_id UNIQUE (comment_id);

-- ── B-15: Fix delete_workspace_data RPC — referrer_id vs referrer_user_id ───
-- The 20261111000001 migration uses 'referrer_id' but referrals table 
-- (20261023_billing_tables L73) defines column as 'referrer_user_id'.
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
  -- 1. Instagram & Automation logs/queues
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

  -- 2. Brand materials & Follow gates
  IF to_regclass('public.brand_materials_pages') IS NOT NULL THEN
    DELETE FROM public.brand_materials_pages WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.follow_gate_sessions') IS NOT NULL THEN
    DELETE FROM public.follow_gate_sessions WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.follow_gates') IS NOT NULL THEN
    DELETE FROM public.follow_gates WHERE workspace_id = target_workspace_id;
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

  -- 5. Onboarding, Referrals, Subscriptions & Billing
  IF to_regclass('public.onboarding_checklists') IS NOT NULL THEN
    DELETE FROM public.onboarding_checklists WHERE user_id = target_user_id;
  END IF;
  -- FIX B-15: use correct column name referrer_user_id (not referrer_id)
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

  -- 6. Workspace Membership & Workspace
  IF to_regclass('public.workspace_members') IS NOT NULL THEN
    DELETE FROM public.workspace_members
      WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    DELETE FROM public.workspaces
      WHERE id = target_workspace_id AND owner_id = target_user_id;
  END IF;
END;
$$;

-- ── B-19: Add INSERT policy for authenticated on instagram_comment_logs ──────
-- (service_role bypasses RLS; authenticated users need INSERT for simulator path)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_comment_logs'
      AND policyname = 'workspace_members_comment_logs_write'
  ) THEN
    CREATE POLICY "workspace_members_comment_logs_write"
      ON instagram_comment_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (
        workspace_id IN (
          SELECT id FROM workspaces WHERE owner_id = auth.uid()
          UNION
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── Fix automation_config RLS: also allow workspace owner ────────────────────
DO $$
BEGIN
  -- Add owner access policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_automation_config'
      AND policyname = 'workspace_owner_automation_config'
  ) THEN
    CREATE POLICY "workspace_owner_automation_config"
      ON instagram_automation_config
      FOR ALL
      TO authenticated
      USING (
        workspace_id IN (
          SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
      )
      WITH CHECK (
        workspace_id IN (
          SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── Orphan cleanup: purge expired follow_gate_sessions ───────────────────────
DELETE FROM follow_gate_sessions WHERE expires_at < NOW() - INTERVAL '7 days';

-- ── Index to support fast expiry purges going forward ───────────────────────
CREATE INDEX IF NOT EXISTS idx_follow_gate_sessions_expires
  ON follow_gate_sessions(expires_at)
  WHERE expires_at IS NOT NULL;

