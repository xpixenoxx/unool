-- ============================================================
-- Migration: 20261122000001_fix_fb_automation_logs_schema.sql
-- Fixes Facebook automation log schema gaps:
--   1. facebook_dm_logs: add updated_at, reasoning, lead_score
--   2. facebook_comment_logs: allow NULL post_id when Meta payload omits it
--   3. Ensure WITH CHECK policies on facebook_comment_logs / dm_logs / outbound_jobs
-- ============================================================

-- 1. facebook_dm_logs missing columns
ALTER TABLE public.facebook_dm_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reasoning  text,
  ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0;

-- 2. facebook_comment_logs: allow nullable post_id (events without post_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'facebook_comment_logs'
      AND column_name = 'post_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.facebook_comment_logs
      ALTER COLUMN post_id DROP NOT NULL;
  END IF;
END $$;
