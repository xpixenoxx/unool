-- Migration: Thread-scoped comment anti-duplication and commenter flood indexes
-- Adds compound indexes to instagram_comment_logs to optimize:
-- 1. Thread-specific lexical entropy checks (filtering by workspace_id + media_id)
-- 2. Per-commenter hourly rate limiting (filtering by workspace_id + commenter_username)

CREATE INDEX IF NOT EXISTS idx_ig_comment_logs_workspace_media 
  ON instagram_comment_logs(workspace_id, media_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ig_comment_logs_commenter 
  ON instagram_comment_logs(workspace_id, commenter_username, created_at DESC);

