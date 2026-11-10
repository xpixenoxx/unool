-- Migration: Add follow-to-unlock gate settings to instagram_automation_config and dm_logs
-- Created: 2026-11-08

-- 1. Add follow-gate columns to instagram_automation_config
ALTER TABLE instagram_automation_config
  ADD COLUMN IF NOT EXISTS require_follow_for_dm BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_ask_message TEXT,
  ADD COLUMN IF NOT EXISTS follow_verified_message TEXT;

-- 2. Add follow verification audit columns to instagram_dm_logs
ALTER TABLE instagram_dm_logs
  ADD COLUMN IF NOT EXISTS follow_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_status TEXT DEFAULT 'unknown';

-- 3. Add index on follow_verified for metrics and analytics queries
CREATE INDEX IF NOT EXISTS idx_ig_dm_logs_follow_verified
  ON instagram_dm_logs(workspace_id, follow_verified, created_at DESC);

