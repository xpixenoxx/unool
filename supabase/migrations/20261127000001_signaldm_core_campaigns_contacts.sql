-- =============================================================================
-- Migration: SignalDM Core — Campaigns, Audience Vault (Contacts),
--            Enrollments, Adaptive AI Feedback Memory & Atomic Velocity RPC
-- Date: 2026-11-27
-- Safety: 100% additive (IF NOT EXISTS), zero destructive changes, dual RLS.
-- =============================================================================

-- 1. Extend instagram_automation_config with opt-in advanced controls (all default-safe)
ALTER TABLE public.instagram_automation_config
  ADD COLUMN IF NOT EXISTS ai_confidence_threshold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adaptive_voice_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_stop_on_low_quality boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_hours_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_hours_start text DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS active_hours_end text DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS active_hours_timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS human_takeover_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS human_agent_tag_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dm_debounce_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS voice_note_transcription_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ice_breakers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS persistent_menu jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vip_follower_threshold integer NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS daily_digest_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_digest_hour integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS quiet_hours_start text DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_end text DEFAULT '08:00';

-- 2. Extend existing log tables with additive campaign / surface / AI quality telemetry
ALTER TABLE public.instagram_comment_logs
  ADD COLUMN IF NOT EXISTS campaign_id uuid,
  ADD COLUMN IF NOT EXISTS trigger_surface text DEFAULT 'comment',
  ADD COLUMN IF NOT EXISTS ai_quality_score integer,
  ADD COLUMN IF NOT EXISTS ai_stop_reason text;

ALTER TABLE public.instagram_dm_logs
  ADD COLUMN IF NOT EXISTS campaign_id uuid,
  ADD COLUMN IF NOT EXISTS trigger_surface text DEFAULT 'dm',
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS ai_quality_score integer,
  ADD COLUMN IF NOT EXISTS ai_stop_reason text;

DO $$
BEGIN
  IF to_regclass('public.instagram_flagged_dms') IS NOT NULL THEN
    ALTER TABLE public.instagram_flagged_dms
      ADD COLUMN IF NOT EXISTS window_expires_at timestamptz;
  END IF;
END $$;

-- 3. instagram_campaigns — Hybrid Deterministic Keyword + AI Fallback Trigger Campaigns
CREATE TABLE IF NOT EXISTS public.instagram_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  playbook_id text,
  trigger_surface text NOT NULL DEFAULT 'comment'
    CHECK (trigger_surface IN ('comment', 'story_reply', 'story_mention', 'live_comment', 'dm_keyword', 'ad_referral', 'reel_share')),
  media_id text,
  post_id uuid,
  ad_id text,
  trigger_mode text NOT NULL DEFAULT 'contains'
    CHECK (trigger_mode IN ('exact', 'contains', 'fuzzy', 'any')),
  keywords text[] NOT NULL DEFAULT '{}'::text[],
  exclude_keywords text[] NOT NULL DEFAULT '{}'::text[],
  ignore_sub_comments boolean NOT NULL DEFAULT false,
  ignore_tag_only_comments boolean NOT NULL DEFAULT false,
  dedup_user_post_hours integer NOT NULL DEFAULT 24 CHECK (dedup_user_post_hours >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_total_sends integer CHECK (max_total_sends IS NULL OR max_total_sends > 0),
  total_sends integer NOT NULL DEFAULT 0,
  public_replies text[] NOT NULL DEFAULT '{}'::text[],
  dm_opening_enabled boolean NOT NULL DEFAULT false,
  dm_opening_text text,
  dm_opening_button_title text DEFAULT 'Send it to me',
  dm_message text NOT NULL DEFAULT '',
  dm_card_title text,
  dm_card_subtitle text,
  dm_card_image_url text,
  dm_cta_title text,
  dm_cta_url text,
  dm_extra_bubbles text[] NOT NULL DEFAULT '{}'::text[],
  require_follow boolean NOT NULL DEFAULT false,
  follow_ask_text text,
  follow_verified_text text,
  max_follow_reminders integer NOT NULL DEFAULT 2 CHECK (max_follow_reminders >= 1 AND max_follow_reminders <= 5),
  capture_email boolean NOT NULL DEFAULT false,
  capture_phone boolean NOT NULL DEFAULT false,
  capture_prompt text,
  capture_confirm_text text,
  skip_if_already_captured boolean NOT NULL DEFAULT true,
  send_email_delivery boolean NOT NULL DEFAULT false,
  email_subject text,
  email_body text,
  ab_variant_b_dm text,
  ab_variant_b_cta_url text,
  ab_split_pct integer NOT NULL DEFAULT 50 CHECK (ab_split_pct >= 0 AND ab_split_pct <= 100),
  nudge_enabled boolean NOT NULL DEFAULT false,
  nudge_delay_minutes integer NOT NULL DEFAULT 180 CHECK (nudge_delay_minutes >= 5 AND nudge_delay_minutes <= 1380),
  nudge_text text,
  closed_dm_public_fallback text,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ig_campaigns_ws_active_surface
  ON public.instagram_campaigns (workspace_id, trigger_surface, priority)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ig_campaigns_ws_media
  ON public.instagram_campaigns (workspace_id, media_id)
  WHERE media_id IS NOT NULL AND is_active = true;

-- 4. workspace_contacts — Consented Audience Vault CRM across IG / FB / Threads / LinkedIn
CREATE TABLE IF NOT EXISTS public.workspace_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram', 'facebook', 'threads', 'linkedin')),
  platform_user_id text NOT NULL,
  username text,
  full_name text,
  profile_pic_url text,
  follower_count integer,
  is_verified boolean NOT NULL DEFAULT false,
  is_following_business boolean,
  is_business_following boolean,
  is_vip boolean NOT NULL DEFAULT false,
  email text,
  phone text,
  consent_at timestamptz,
  consent_source text,
  opted_out boolean NOT NULL DEFAULT false,
  opted_out_at timestamptz,
  ai_paused_until timestamptz,
  intent_score integer NOT NULL DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
  tags text[] NOT NULL DEFAULT '{}'::text[],
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  lead_capture_state jsonb,
  total_comments integer NOT NULL DEFAULT 0,
  total_dms integer NOT NULL DEFAULT 0,
  total_clicks integer NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  last_dm_at timestamptz,
  last_campaign_id uuid REFERENCES public.instagram_campaigns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ws_contacts_ws_intent
  ON public.workspace_contacts (workspace_id, intent_score DESC, last_interaction_at DESC);

CREATE INDEX IF NOT EXISTS idx_ws_contacts_ws_email
  ON public.workspace_contacts (workspace_id, email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ws_contacts_ws_vip
  ON public.workspace_contacts (workspace_id, last_interaction_at DESC)
  WHERE is_vip = true;

CREATE INDEX IF NOT EXISTS idx_ws_contacts_ws_paused
  ON public.workspace_contacts (workspace_id, ai_paused_until)
  WHERE ai_paused_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ws_contacts_ws_tags
  ON public.workspace_contacts USING gin (tags);

-- 5. campaign_enrollments — Per-contact campaign execution, A/B variant & nudge state
CREATE TABLE IF NOT EXISTS public.campaign_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.workspace_contacts(id) ON DELETE SET NULL,
  platform_user_id text NOT NULL,
  media_id text,
  trigger_event_id text,
  ab_variant text NOT NULL DEFAULT 'A' CHECK (ab_variant IN ('A', 'B')),
  stage text NOT NULL DEFAULT 'triggered'
    CHECK (stage IN ('triggered', 'opening_sent', 'follow_gate_pending', 'lead_capture_pending', 'delivered', 'clicked', 'completed', 'declined')),
  follow_verified boolean NOT NULL DEFAULT false,
  lead_captured boolean NOT NULL DEFAULT false,
  dm_sent_at timestamptz,
  link_clicked_at timestamptz,
  nudge_qstash_id text,
  nudge_sent_at timestamptz,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_campaign_created
  ON public.campaign_enrollments (campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrollments_ws_user_media
  ON public.campaign_enrollments (workspace_id, platform_user_id, media_id, created_at DESC);

-- 6. ai_reply_feedback — Adaptive AI Learning & Quality-Stop Memory
CREATE TABLE IF NOT EXISTS public.ai_reply_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('comment', 'dm')),
  inbound_text text NOT NULL,
  ai_draft text,
  creator_final_reply text,
  action text NOT NULL CHECK (action IN ('approved', 'edited', 'rejected', 'phone_echo', 'quality_stopped')),
  quality_score integer CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
  stop_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_reply_feedback_ws_channel_created
  ON public.ai_reply_feedback (workspace_id, channel, created_at DESC);

-- 7. Atomic Velocity Counter RPC (prevents concurrent read-modify-write races)
CREATE OR REPLACE FUNCTION public.increment_reply_velocity(
  p_workspace_id uuid,
  p_channel text,
  p_hour_bucket timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.instagram_reply_velocity (workspace_id, channel, hour_bucket, reply_count)
  VALUES (p_workspace_id, p_channel, p_hour_bucket, 1)
  ON CONFLICT (workspace_id, channel, hour_bucket)
  DO UPDATE SET reply_count = public.instagram_reply_velocity.reply_count + 1
  RETURNING reply_count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_reply_velocity(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_reply_velocity(uuid, text, timestamptz) TO service_role;

-- 8. Row Level Security (Dual: Workspace Owner + Active Members, plus Service Role)
ALTER TABLE public.instagram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reply_feedback ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'instagram_campaigns',
      'workspace_contacts',
      'campaign_enrollments',
      'ai_reply_feedback'
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
