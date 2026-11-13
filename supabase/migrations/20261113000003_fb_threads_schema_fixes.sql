-- ============================================================
-- Migration: 20261113000003_fb_threads_schema_fixes.sql
-- Adds missing columns identified during edge-case audit:
--   facebook_comment_logs: updated_at, dm_sent
--   threads_reply_logs: flagged_for_review, updated_at
-- ============================================================

-- ── facebook_comment_logs ────────────────────────────────────
ALTER TABLE public.facebook_comment_logs
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS dm_sent       boolean     NOT NULL DEFAULT false;

-- ── threads_reply_logs ───────────────────────────────────────
ALTER TABLE public.threads_reply_logs
  ADD COLUMN IF NOT EXISTS flagged_for_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- ── Additional indexes for flagged triage queries ─────────────
CREATE INDEX IF NOT EXISTS idx_fb_comment_logs_flagged
  ON public.facebook_comment_logs(workspace_id, flagged_for_review)
  WHERE flagged_for_review = true;

CREATE INDEX IF NOT EXISTS idx_threads_reply_logs_flagged
  ON public.threads_reply_logs(workspace_id, flagged_for_review)
  WHERE flagged_for_review = true;
