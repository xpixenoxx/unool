-- Create visibility enum or just use text check constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- Create profile_viewers table
CREATE TABLE IF NOT EXISTS profile_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_viewers_profile_id ON profile_viewers(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_viewers_user_id ON profile_viewers(user_id);

-- Enable RLS on the new table
ALTER TABLE profile_viewers ENABLE ROW LEVEL SECURITY;

-- Allow workspace members to manage viewers for their profiles
CREATE POLICY "Members can manage profile viewers" ON profile_viewers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            JOIN workspace_members ON workspace_members.workspace_id = profiles.workspace_id
            WHERE profiles.id = profile_viewers.profile_id
            AND workspace_members.user_id = auth.uid()
        )
    );
