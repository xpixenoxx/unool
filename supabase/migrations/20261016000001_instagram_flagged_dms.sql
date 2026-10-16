-- SignalDM: Escalated DM inbox
-- Stores DMs that were flagged for human review (shouldEscalate = true).
-- Mirrors the instagram_flagged_comments pattern for comments.

CREATE TABLE IF NOT EXISTS instagram_flagged_dms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_username TEXT,
  message_text TEXT NOT NULL,
  classification TEXT NOT NULL,
  ai_suggested_reply TEXT,
  lead_score INTEGER DEFAULT 0,
  reasoning TEXT,
  -- owner_reply: set when a human manually responds
  owner_reply TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, replied, dismissed
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_ig_flagged_dms_workspace_status
  ON instagram_flagged_dms(workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ig_flagged_dms_lead_score
  ON instagram_flagged_dms(workspace_id, lead_score DESC, created_at DESC);

ALTER TABLE instagram_flagged_dms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_flagged_dms"
  ON instagram_flagged_dms
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
