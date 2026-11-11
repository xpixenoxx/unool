-- ============================================================
-- Migration: Complete Account & Workspace Deletion RPC (C-6 / P0-5)
-- Atomically purges all workspace and user data across all tables
-- in foreign-key dependency order.
-- ============================================================

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
    DELETE FROM public.platform_connections WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DELETE FROM public.profiles WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;

  -- 5. Onboarding, Referrals, Subscriptions & Billing
  IF to_regclass('public.onboarding_checklists') IS NOT NULL THEN
    DELETE FROM public.onboarding_checklists WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.referrals') IS NOT NULL THEN
    DELETE FROM public.referrals WHERE referrer_id = target_user_id OR referred_user_id = target_user_id;
  END IF;
  IF to_regclass('public.referral_codes') IS NOT NULL THEN
    DELETE FROM public.referral_codes WHERE user_id = target_user_id;
  END IF;
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    DELETE FROM public.subscriptions WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;
  IF to_regclass('public.payment_orders') IS NOT NULL THEN
    DELETE FROM public.payment_orders WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;

  -- 6. Workspace Membership & Workspace
  IF to_regclass('public.workspace_members') IS NOT NULL THEN
    DELETE FROM public.workspace_members WHERE workspace_id = target_workspace_id OR user_id = target_user_id;
  END IF;
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    DELETE FROM public.workspaces WHERE id = target_workspace_id AND owner_id = target_user_id;
  END IF;
END;
$$;

