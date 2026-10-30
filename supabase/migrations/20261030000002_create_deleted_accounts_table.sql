-- Create deleted_accounts table to hold soft-deleted user accounts, profiles, and workspaces for recovery
CREATE TABLE IF NOT EXISTS deleted_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'Deleted by admin',
    deleted_by UUID,
    user_data JSONB NOT NULL DEFAULT '{}',
    profiles_data JSONB NOT NULL DEFAULT '[]',
    workspaces_data JSONB NOT NULL DEFAULT '[]',
    workspace_members_data JSONB NOT NULL DEFAULT '[]',
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recovered_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_deleted_accounts_user_id ON deleted_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_deleted_at ON deleted_accounts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_recovered_at ON deleted_accounts(recovered_at);

COMMENT ON TABLE deleted_accounts IS 'Holds deleted user accounts, profiles, and associated data for recovery instead of permanently deleting them.';
