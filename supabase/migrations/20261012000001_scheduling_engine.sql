-- ============================================================
-- SCHEDULING ENGINE — Migration
-- Adds the scheduling infrastructure for Unool's 7-Day Flight
-- All times stored in UTC. Frontend renders in user local zone.
-- ============================================================

-- 1. Extend posts table with scheduling fields
-- scheduled_at already exists on the posts table.
-- We add: qstash_message_id and schedule_strategy columns.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS qstash_message_id TEXT,
  ADD COLUMN IF NOT EXISTS schedule_strategy TEXT DEFAULT 'simultaneous'
    CHECK (schedule_strategy IN ('simultaneous', 'cascading')),
  ADD COLUMN IF NOT EXISTS arc_id UUID;

-- 2. Extend post_variants with per-variant schedule fields
-- This lets cascading mode schedule each platform variant at a different time.
ALTER TABLE post_variants
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qstash_message_id TEXT,
  ADD COLUMN IF NOT EXISTS auto_first_comment TEXT;

-- 3. Create content_arcs table (7-day narrative containers)
CREATE TABLE IF NOT EXISTS content_arcs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  core_story   TEXT NOT NULL,
  story_type   TEXT NOT NULL DEFAULT 'shipped'
    CHECK (story_type IN ('shipped', 'learned', 'milestone', 'opinion')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_arcs_workspace_id ON content_arcs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_arcs_status ON content_arcs(status);
CREATE INDEX IF NOT EXISTS idx_content_arcs_start_date ON content_arcs(start_date);

-- 4. Performance index on variants for scheduled lookups
CREATE INDEX IF NOT EXISTS idx_post_variants_scheduled_at
  ON post_variants(scheduled_at)
  WHERE scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_arc_id ON posts(arc_id) WHERE arc_id IS NOT NULL;

-- 5. RLS for content_arcs
ALTER TABLE content_arcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage their content arcs" ON content_arcs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = content_arcs.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

-- 6. Updated_at trigger for content_arcs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_arcs_updated_at ON content_arcs;
CREATE TRIGGER update_content_arcs_updated_at
  BEFORE UPDATE ON content_arcs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
