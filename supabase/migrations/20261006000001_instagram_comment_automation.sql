-- Instagram Comment Automation Tables
-- Stores automation config, comment logs, and flagged comments for review

-- 1. Automation config per workspace
CREATE TABLE IF NOT EXISTS instagram_automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  auto_reply_positive BOOLEAN NOT NULL DEFAULT true,
  auto_reply_questions BOOLEAN NOT NULL DEFAULT true,
  auto_reply_link_requests BOOLEAN NOT NULL DEFAULT true,
  link_url TEXT,
  custom_instructions TEXT,
  flag_negative BOOLEAN NOT NULL DEFAULT true,
  flag_spam BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

-- 2. Comment logs (audit trail of all processed comments)
CREATE TABLE IF NOT EXISTS instagram_comment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL,
  media_id TEXT,
  comment_text TEXT NOT NULL,
  commenter_username TEXT,
  classification TEXT NOT NULL,
  confidence REAL,
  suggested_reply TEXT,
  auto_replied BOOLEAN NOT NULL DEFAULT false,
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Flagged comments inbox (comments needing owner attention)
CREATE TABLE IF NOT EXISTS instagram_flagged_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL,
  media_id TEXT,
  comment_text TEXT NOT NULL,
  commenter_username TEXT,
  classification TEXT NOT NULL,
  suggested_reply TEXT,
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, replied
  owner_reply TEXT,                       -- custom reply written by owner
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ig_comment_logs_workspace ON instagram_comment_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_flagged_workspace_status ON instagram_flagged_comments(workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_comment_logs_comment_id ON instagram_comment_logs(comment_id);

-- RLS policies
ALTER TABLE instagram_automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_comment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_flagged_comments ENABLE ROW LEVEL SECURITY;

-- Allow workspace members to read/write their own automation config
CREATE POLICY "workspace_members_automation_config"
  ON instagram_automation_config
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

-- Allow workspace members to read comment logs
CREATE POLICY "workspace_members_comment_logs"
  ON instagram_comment_logs
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Allow workspace members to read and update flagged comments
CREATE POLICY "workspace_members_flagged_comments"
  ON instagram_flagged_comments
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
