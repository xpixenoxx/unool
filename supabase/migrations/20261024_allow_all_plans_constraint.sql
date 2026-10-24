-- ============================================================
-- Allow all plan IDs ('spark', 'creator', 'pro', 'studio', etc.)
-- on the workspaces table and ensure updated_at column exists.
-- Created: 2026-10-24
-- ============================================================

ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_plan_check;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_plan_check 
    CHECK (plan IN ('spark', 'creator', 'pro', 'studio', 'free', 'team', 'enterprise'));

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
