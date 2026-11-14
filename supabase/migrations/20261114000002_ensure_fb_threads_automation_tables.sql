-- ============================================================
-- Migration: 20261114000002_ensure_fb_threads_automation_tables.sql
-- Idempotent setup and column assurance for Facebook & Threads
-- automation configs, reply logs, and outbound job queues.
-- ============================================================

-- ── 1. Threads automation config ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.threads_automation_config (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  threads_user_id             text NOT NULL,
  enabled                     boolean NOT NULL DEFAULT true,
  auto_reply_replies          boolean NOT NULL DEFAULT true,
  auto_reply_mentions         boolean NOT NULL DEFAULT true,
  auto_reply_positive         boolean NOT NULL DEFAULT true,
  auto_reply_questions        boolean NOT NULL DEFAULT true,
  auto_reply_link_requests    boolean NOT NULL DEFAULT true,
  auto_reply_purchase_intent  boolean NOT NULL DEFAULT true,
  auto_hide_spam              boolean NOT NULL DEFAULT true,
  flag_negative               boolean NOT NULL DEFAULT true,
  flag_spam                   boolean NOT NULL DEFAULT true,
  custom_instructions         text,
  brand_persona               text,
  link_url                    text,
  max_replies_per_hour        int NOT NULL DEFAULT 20,
  jitter_min_seconds          int NOT NULL DEFAULT 20,
  jitter_max_seconds          int NOT NULL DEFAULT 90,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Ensure all columns exist if table was previously created with minimal columns
ALTER TABLE public.threads_automation_config
  ADD COLUMN IF NOT EXISTS auto_reply_positive        boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_questions       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_link_requests   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_purchase_intent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS flag_negative              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS flag_spam                  boolean NOT NULL DEFAULT true;

-- Unique constraint per workspace
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_threads_automation_config_workspace'
  ) THEN
    ALTER TABLE public.threads_automation_config
      ADD CONSTRAINT uq_threads_automation_config_workspace UNIQUE (workspace_id);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ── 2. Facebook automation config ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.facebook_automation_config (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  page_id                     text NOT NULL,
  enabled                     boolean NOT NULL DEFAULT true,
  auto_reply_comments         boolean NOT NULL DEFAULT true,
  auto_reply_positive         boolean NOT NULL DEFAULT true,
  auto_reply_questions        boolean NOT NULL DEFAULT true,
  auto_reply_link_requests    boolean NOT NULL DEFAULT true,
  auto_reply_purchase_intent  boolean NOT NULL DEFAULT true,
  auto_hide_spam              boolean NOT NULL DEFAULT true,
  auto_reply_dm               boolean NOT NULL DEFAULT true,
  flag_negative               boolean NOT NULL DEFAULT true,
  flag_spam                   boolean NOT NULL DEFAULT true,
  custom_instructions         text,
  brand_persona               text,
  link_url                    text,
  max_replies_per_hour        int NOT NULL DEFAULT 20,
  dm_max_replies_per_hour     int NOT NULL DEFAULT 20,
  jitter_min_seconds          int NOT NULL DEFAULT 20,
  jitter_max_seconds          int NOT NULL DEFAULT 90,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facebook_automation_config
  ADD COLUMN IF NOT EXISTS auto_reply_positive        boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_questions       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_link_requests   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_purchase_intent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_dm              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS flag_negative              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS flag_spam                  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dm_max_replies_per_hour    int NOT NULL DEFAULT 20;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_fb_automation_config_workspace'
  ) THEN
    ALTER TABLE public.facebook_automation_config
      ADD CONSTRAINT uq_fb_automation_config_workspace UNIQUE (workspace_id);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ── 3. Enable RLS and Policies ────────────────────────────────
ALTER TABLE public.threads_automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_automation_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'workspace_access_threads_config' AND tablename = 'threads_automation_config'
  ) THEN
    CREATE POLICY "workspace_access_threads_config"
      ON public.threads_automation_config FOR ALL TO authenticated
      USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      ))
      WITH CHECK (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'workspace_access_fb_config' AND tablename = 'facebook_automation_config'
  ) THEN
    CREATE POLICY "workspace_access_fb_config"
      ON public.facebook_automation_config FOR ALL TO authenticated
      USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      ))
      WITH CHECK (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;
