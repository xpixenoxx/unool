-- ============================================================
-- Multi-Account Support per Platform & Account-Targeted Variants
-- ============================================================
-- Allows a workspace to connect multiple accounts on the same social platform
-- (e.g., multiple X, LinkedIn, Instagram, YouTube, etc. accounts) and links
-- each post_variant to the exact platform_connection_id it targets.

-- 1. Drop legacy single-account-per-platform unique constraints
ALTER TABLE platform_connections
  DROP CONSTRAINT IF EXISTS platform_connections_workspace_id_platform_key;

ALTER TABLE platform_connections
  DROP CONSTRAINT IF EXISTS platform_connections_workspace_id_user_id_platform_key;

-- 2. Add optional display metadata columns for account switcher / pills
ALTER TABLE platform_connections
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Enforce uniqueness by (workspace_id, platform, platform_user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_connections_workspace_platform_user_key'
  ) THEN
    ALTER TABLE platform_connections
      ADD CONSTRAINT platform_connections_workspace_platform_user_key
      UNIQUE (workspace_id, platform, platform_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_platform_connections_workspace_platform
  ON platform_connections(workspace_id, platform);

-- 4. Link post_variants to the specific platform_connection_id being targeted
ALTER TABLE post_variants
  ADD COLUMN IF NOT EXISTS platform_connection_id UUID REFERENCES platform_connections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_post_variants_platform_connection_id
  ON post_variants(platform_connection_id);

CREATE INDEX IF NOT EXISTS idx_post_variants_post_connection
  ON post_variants(post_id, platform_connection_id);

-- 5. Best-effort backfill of legacy variants to their workspace's current platform connection
UPDATE post_variants AS pv
SET platform_connection_id = pc.id
FROM posts AS p
JOIN platform_connections AS pc
  ON pc.workspace_id = p.workspace_id
WHERE pv.post_id = p.id
  AND pv.platform = pc.platform
  AND pv.platform_connection_id IS NULL;
