-- SignalDM v2: Extend instagram automation schema for full comment + DM automation
-- Adds: brand persona, rate limiting, thread chaining, DM automation, velocity tracking

-- 1. Add new columns to automation config
ALTER TABLE instagram_automation_config
  ADD COLUMN IF NOT EXISTS brand_persona TEXT,
  ADD COLUMN IF NOT EXISTS max_replies_per_hour INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS jitter_min_seconds INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS jitter_max_seconds INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS thread_chaining_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dm_template TEXT,
  ADD COLUMN IF NOT EXISTS auto_hide_spam BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reply_purchase_intent BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dm_auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dm_welcome_message TEXT,
  ADD COLUMN IF NOT EXISTS dm_knowledge_base TEXT,
  ADD COLUMN IF NOT EXISTS dm_escalation_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dm_max_replies_per_hour INTEGER NOT NULL DEFAULT 20;

-- 2. Add lead_score and dm_sent tracking to comment logs
ALTER TABLE instagram_comment_logs
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dm_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dm_message TEXT,
  ADD COLUMN IF NOT EXISTS reply_delay_ms INTEGER,
  ADD COLUMN IF NOT EXISTS thread_hook TEXT;

-- 3. Add priority to flagged comments
ALTER TABLE instagram_flagged_comments
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

-- 4. Create rate limiting tracking table
CREATE TABLE IF NOT EXISTS instagram_reply_velocity (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL,
  reply_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, hour_bucket)
);

-- 5. Create DM logs table for inbound DM automation
CREATE TABLE IF NOT EXISTS instagram_dm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_username TEXT,
  message_text TEXT NOT NULL,
  classification TEXT,
  confidence REAL,
  ai_reply TEXT,
  auto_replied BOOLEAN NOT NULL DEFAULT false,
  escalated BOOLEAN NOT NULL DEFAULT false,
  lead_score INTEGER DEFAULT 0,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Indexes for the new queries
CREATE INDEX IF NOT EXISTS idx_ig_logs_classification
  ON instagram_comment_logs(workspace_id, classification, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_logs_lead_score
  ON instagram_comment_logs(workspace_id, lead_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_velocity_bucket
  ON instagram_reply_velocity(workspace_id, hour_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_ig_dm_logs_workspace
  ON instagram_dm_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_dm_logs_sender
  ON instagram_dm_logs(workspace_id, sender_id, created_at DESC);

-- 7. RLS for new tables
ALTER TABLE instagram_reply_velocity ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_dm_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_reply_velocity"
  ON instagram_reply_velocity
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

CREATE POLICY "workspace_members_dm_logs"
  ON instagram_dm_logs
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

-- Allow service role insert for webhook-driven automation
-- (service role bypasses RLS by default, so no extra policy needed)
