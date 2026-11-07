-- Migration: 20261107000001_instagram_outbound_dispatch.sql
-- SignalDM: Durable Outbound Dispatch Mechanism & Delivery Lifecycle Tracking
-- Adds outbound job persistence, state machine (queued, processing, sent, failed, needs_review),
-- retry limits, and dead-letter handling support.

-- 1. Extend instagram_comment_logs with dispatch and delivery lifecycle tracking
ALTER TABLE instagram_comment_logs
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS dispatch_job_id TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS reply_sent_at TIMESTAMPTZ;

-- 2. Extend instagram_dm_logs with dispatch and delivery lifecycle tracking
ALTER TABLE instagram_dm_logs
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS dispatch_job_id TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS reply_sent_at TIMESTAMPTZ;

-- 3. Dedicated outbound jobs table for durable job persistence and state tracking
CREATE TABLE IF NOT EXISTS instagram_outbound_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES platform_connections(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'comment_reply', 'dm_reply'
  target_id TEXT NOT NULL, -- comment_id or message_id
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'sent', 'failed', 'needs_review'
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  qstash_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(workspace_id, job_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_ig_outbound_jobs_status
  ON instagram_outbound_jobs(workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ig_outbound_jobs_target
  ON instagram_outbound_jobs(target_id);

ALTER TABLE instagram_outbound_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_outbound_jobs"
  ON instagram_outbound_jobs
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

