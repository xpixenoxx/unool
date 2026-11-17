-- ============================================================================
-- Migration: 20261116000002_settings_lifecycle_rpcs.sql
-- Purpose:
--   1. Update public.delete_workspace_data(target_workspace_id, target_user_id)
--      with owner + multi-member safety guards and complete cleanup across
--      Facebook/Threads automation tables, workspace_security_events,
--      user_preferences, user_credentials, referrals (referrer_user_id),
--      and public.users.
--   2. Create atomic public.transfer_workspace_ownership() RPC.
--   3. Create service_role-only public.get_user_auth_sessions() RPC for safe
--      session listing in Security Settings without exposing auth schema.
--
-- UD-07 FINANCIAL / GST RETENTION NOTE (HIGH-STAKES SIGN-OFF REQUIRED):
--   This version preserves existing payment_orders cleanup on account deletion
--   matching prior app/api/user/delete behavior. Before production GST
--   invoicing launch, legal/finance counsel must sign off on UD-07 to either
--   anonymize payment_orders (SET user_id = NULL, metadata = '{}') or move
--   invoices to an immutable GST archive table for statutory 8-year retention.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_workspace_data(
  target_workspace_id uuid,
  target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

  -- 1. Instagram, Facebook & Threads automation tables
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

  -- 5. Onboarding, Referrals, Subscriptions & Billing
  IF to_regclass('public.onboarding_checklists') IS NOT NULL THEN
    DELETE FROM public.onboarding_checklists WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.user_section_time') IS NOT NULL THEN
    DELETE FROM public.user_section_time WHERE user_id = target_user_id;
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

-- ── Atomic Workspace Ownership Transfer RPC ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.transfer_workspace_ownership(
  p_workspace_id uuid,
  p_current_owner_id uuid,
  p_new_owner_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF p_current_owner_id = p_new_owner_id THEN
    RAISE EXCEPTION 'INVALID_SAME_OWNER';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.workspaces
  WHERE id = p_workspace_id
  FOR UPDATE;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'WORKSPACE_NOT_FOUND';
  END IF;

  IF v_owner_id IS DISTINCT FROM p_current_owner_id THEN
    RAISE EXCEPTION 'FORBIDDEN_NOT_WORKSPACE_OWNER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_new_owner_id
      AND COALESCE(status, 'active') = 'active'
  ) THEN
    RAISE EXCEPTION 'TARGET_NOT_ACTIVE_MEMBER';
  END IF;

  UPDATE public.workspaces
  SET owner_id = p_new_owner_id,
      updated_at = now()
  WHERE id = p_workspace_id;

  UPDATE public.workspace_members
  SET role = 'owner',
      status = 'active'
  WHERE workspace_id = p_workspace_id
    AND user_id = p_new_owner_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (p_workspace_id, p_current_owner_id, 'admin', 'active', now())
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET role = 'admin', status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_workspace_ownership(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_workspace_ownership(uuid, uuid, uuid) TO service_role;

-- ── Safe Auth Sessions Reader RPC (service_role only) ──────────────────────
CREATE OR REPLACE FUNCTION public.get_user_auth_sessions(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  refreshed_at timestamptz,
  user_agent text,
  ip text,
  aal text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    s.id,
    s.created_at,
    s.updated_at,
    s.refreshed_at,
    s.user_agent,
    s.ip::text AS ip,
    s.aal::text AS aal
  FROM auth.sessions s
  WHERE s.user_id = p_user_id
    AND (s.not_after IS NULL OR s.not_after > now())
  ORDER BY COALESCE(s.refreshed_at, s.updated_at, s.created_at) DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.get_user_auth_sessions(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_auth_sessions(uuid) TO service_role;

-- ============================================================================
-- ROLLBACK:
--   DROP FUNCTION IF EXISTS public.get_user_auth_sessions(uuid);
--   DROP FUNCTION IF EXISTS public.transfer_workspace_ownership(uuid, uuid, uuid);
--   -- Re-apply supabase/migrations/20261113000001_automation_audit2_fixes.sql
--   -- if reverting delete_workspace_data().
-- ============================================================================

