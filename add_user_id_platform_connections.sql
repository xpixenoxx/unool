-- Add user_id to platform_connections
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Backfill user_id from workspace owner for existing connections
UPDATE platform_connections pc
SET user_id = w.owner_id
FROM workspaces w
WHERE pc.workspace_id = w.id AND pc.user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE platform_connections ALTER COLUMN user_id SET NOT NULL;

-- Update the Unique constraint
ALTER TABLE platform_connections DROP CONSTRAINT IF EXISTS platform_connections_workspace_id_platform_key;
ALTER TABLE platform_connections ADD CONSTRAINT platform_connections_workspace_id_user_id_platform_key UNIQUE (workspace_id, user_id, platform);

-- Update RLS policies
-- Drop the old policy
DROP POLICY IF EXISTS "Members can manage platform connections" ON platform_connections;
-- Create new policy: only the user who created it can manage/see it
CREATE POLICY "Users can manage their own platform connections" ON platform_connections
    FOR ALL USING (
        user_id = auth.uid()
    );
