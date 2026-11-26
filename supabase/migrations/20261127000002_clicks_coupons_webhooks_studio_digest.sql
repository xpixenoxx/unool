-- =============================================================================
-- Migration: Tracked Links, Atomic Coupons, Outbound Webhooks, Studio Attach,
--            Notification Budget & Updated delete_workspace_data RPC
-- Date: 2026-11-27
-- Safety: 100% additive (IF NOT EXISTS), zero destructive changes, dual RLS.
-- =============================================================================

-- 1. tracked_links & tracked_link_clicks (/go/[code] attribution + nudge cancellation)
CREATE TABLE IF NOT EXISTS public.tracked_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  campaign_id uuid REFERENCES public.instagram_campaigns(id) ON DELETE SET NULL,
  enrollment_id uuid REFERENCES public.campaign_enrollments(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.workspace_contacts(id) ON DELETE SET NULL,
  post_id uuid,
  ab_variant text DEFAULT 'A' CHECK (ab_variant IN ('A', 'B')),
  click_count integer NOT NULL DEFAULT 0,
  last_clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracked_links_ws_campaign
  ON public.tracked_links (workspace_id, campaign_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.tracked_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_link_id uuid NOT NULL REFERENCES public.tracked_links(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.workspace_contacts(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.instagram_campaigns(id) ON DELETE SET NULL,
  ab_variant text DEFAULT 'A',
  user_agent text,
  referer text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracked_link_clicks_ws_clicked
  ON public.tracked_link_clicks (workspace_id, clicked_at DESC);

-- 2. campaign_coupons — Atomic unique promo code pool (FOR UPDATE SKIP LOCKED)
CREATE TABLE IF NOT EXISTS public.campaign_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  code text NOT NULL,
  claimed_by_contact_id uuid REFERENCES public.workspace_contacts(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, code)
);

CREATE INDEX IF NOT EXISTS idx_campaign_coupons_available
  ON public.campaign_coupons (campaign_id, created_at ASC)
  WHERE claimed_at IS NULL;

CREATE OR REPLACE FUNCTION public.claim_campaign_coupon(
  p_campaign_id uuid,
  p_contact_id uuid,
  p_workspace_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coupon_id uuid;
  v_code text;
BEGIN
  -- Return already-claimed code for this contact if idempotently re-requested
  SELECT code INTO v_code
  FROM public.campaign_coupons
  WHERE campaign_id = p_campaign_id
    AND workspace_id = p_workspace_id
    AND claimed_by_contact_id = p_contact_id
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Atomically lock and claim the next available coupon without contention
  SELECT id, code INTO v_coupon_id, v_code
  FROM public.campaign_coupons
  WHERE campaign_id = p_campaign_id
    AND workspace_id = p_workspace_id
    AND claimed_at IS NULL
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_coupon_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.campaign_coupons
  SET claimed_by_contact_id = p_contact_id,
      claimed_at = now()
  WHERE id = v_coupon_id;

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_campaign_coupon(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_campaign_coupon(uuid, uuid, uuid) TO service_role;

-- 3. automation_webhooks — Outbound HMAC-SHA256 webhooks & Listmonk sync
CREATE TABLE IF NOT EXISTS public.automation_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_type text NOT NULL DEFAULT 'webhook' CHECK (target_type IN ('webhook', 'listmonk')),
  url text NOT NULL,
  signing_secret text,
  events text[] NOT NULL DEFAULT ARRAY['lead.captured', 'dm.replied', 'link.clicked', 'vip.detected'],
  listmonk_list_id integer,
  is_active boolean NOT NULL DEFAULT true,
  last_status_code integer,
  last_triggered_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_webhooks_ws_active
  ON public.automation_webhooks (workspace_id)
  WHERE is_active = true;

-- 4. automation_notification_log — Enforces max 3 pings/day + VIP / digest dedup
CREATE TABLE IF NOT EXISTS public.automation_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('vip_dm', 'hot_lead', 'surge_alert', 'health_alert', 'daily_digest')),
  dedup_key text,
  title text NOT NULL,
  body text,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_notif_ws_created
  ON public.automation_notification_log (workspace_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_notif_dedup
  ON public.automation_notification_log (workspace_id, dedup_key)
  WHERE dedup_key IS NOT NULL;

-- 5. studio_post_automation_rules — Auto-attach SignalDM campaign on Studio/Composer publish
CREATE TABLE IF NOT EXISTS public.studio_post_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  keywords text[] NOT NULL DEFAULT '{}'::text[],
  dm_message text NOT NULL,
  dm_cta_url text,
  dm_cta_title text,
  public_replies text[] NOT NULL DEFAULT '{}'::text[],
  require_follow boolean NOT NULL DEFAULT false,
  capture_email boolean NOT NULL DEFAULT false,
  capture_phone boolean NOT NULL DEFAULT false,
  bound_campaign_id uuid REFERENCES public.instagram_campaigns(id) ON DELETE SET NULL,
  bound_platform_post_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'bound', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_post_rules_ws_status
  ON public.studio_post_automation_rules (workspace_id, status);

-- 6. Row Level Security (Dual: Workspace Owner + Active Members)
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_post_automation_rules ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'tracked_links',
      'tracked_link_clicks',
      'campaign_coupons',
      'automation_webhooks',
      'automation_notification_log',
      'studio_post_automation_rules'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_workspace_access', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (
         workspace_id IN (
           SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
           UNION
           SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND COALESCE(status, ''active'') = ''active''
         )
       ) WITH CHECK (
         workspace_id IN (
           SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
           UNION
           SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND COALESCE(status, ''active'') = ''active''
         )
       )',
      tbl || '_workspace_access',
      tbl
    );
  END LOOP;
END $$;

-- 7. Update public.delete_workspace_data() to preserve ALL existing deletions + purge new SignalDM tables
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

  -- 1. SignalDM Campaigns, Contacts, Tracked Links, Coupons, Webhooks & AI Feedback
  IF to_regclass('public.tracked_link_clicks') IS NOT NULL THEN
    DELETE FROM public.tracked_link_clicks WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.tracked_links') IS NOT NULL THEN
    DELETE FROM public.tracked_links WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.campaign_coupons') IS NOT NULL THEN
    DELETE FROM public.campaign_coupons WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.campaign_enrollments') IS NOT NULL THEN
    DELETE FROM public.campaign_enrollments WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.studio_post_automation_rules') IS NOT NULL THEN
    DELETE FROM public.studio_post_automation_rules WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.automation_webhooks') IS NOT NULL THEN
    DELETE FROM public.automation_webhooks WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.automation_notification_log') IS NOT NULL THEN
    DELETE FROM public.automation_notification_log WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.ai_reply_feedback') IS NOT NULL THEN
    DELETE FROM public.ai_reply_feedback WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.workspace_contacts') IS NOT NULL THEN
    DELETE FROM public.workspace_contacts WHERE workspace_id = target_workspace_id;
  END IF;
  IF to_regclass('public.instagram_campaigns') IS NOT NULL THEN
    DELETE FROM public.instagram_campaigns WHERE workspace_id = target_workspace_id;
  END IF;

  -- 1b. Instagram, Facebook, Threads & LinkedIn automation tables
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
