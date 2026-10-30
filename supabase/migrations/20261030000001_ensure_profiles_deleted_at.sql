-- Ensure deleted_at column exists on profiles table for soft-deletion and recovery
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for querying active profiles vs soft-deleted profiles quickly
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp when the profile was soft-deleted. NULL indicates an active profile.';
