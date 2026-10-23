-- ============================================================
-- Add 'publishing' status to posts and post_variants
-- Allows tracking in-progress dispatches from AI Composer & Quick Broadcast
-- ============================================================

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed'));

ALTER TABLE post_variants DROP CONSTRAINT IF EXISTS post_variants_status_check;
ALTER TABLE post_variants ADD CONSTRAINT post_variants_status_check CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed'));
