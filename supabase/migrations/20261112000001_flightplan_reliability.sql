-- ============================================================
-- Migration: 20261112000001_flightplan_reliability.sql
-- Purpose:
--   1. Add idempotency_key to content_arcs with per-workspace unique index (BUG-01)
--   2. Add arc_beat to posts to persist story beat labels across schedule & canvas (BUG-03)
--   3. Add composite index on posts(workspace_id, scheduled_at) for WeekCanvas queries
--   4. Optimize content_arcs RLS policy using (SELECT auth.uid()) and explicit WITH CHECK (BUG-12)
-- ============================================================

-- 1. Idempotency key on content_arcs
ALTER TABLE content_arcs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_arcs_ws_idempotency
  ON content_arcs (workspace_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 2. Story beat label on posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS arc_beat TEXT;

-- 3. Composite index for workspace week range queries
CREATE INDEX IF NOT EXISTS idx_posts_workspace_scheduled_at
  ON posts (workspace_id, scheduled_at)
  WHERE scheduled_at IS NOT NULL;

-- 4. Optimize RLS policy on content_arcs with initPlan caching and explicit WITH CHECK
DROP POLICY IF EXISTS "Users can manage own workspace content arcs" ON content_arcs;

CREATE POLICY "Users can manage own workspace content arcs"
  ON content_arcs
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

