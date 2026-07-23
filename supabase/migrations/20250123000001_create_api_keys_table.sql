-- Migration: Create API Keys table
-- Created: 2025-01-23

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL, -- SHA-256 hash for lookup
    key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "uk_abc123")
    encrypted_key TEXT NOT NULL, -- Full encrypted key (AES-GCM)
    scopes TEXT[] NOT NULL DEFAULT '{}', -- Array of scopes: posts:read, posts:write, analytics:read, profile:write, webhooks:manage
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_id ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_at ON api_keys(revoked_at) WHERE revoked_at IS NOT NULL;

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their workspace's API keys
CREATE POLICY "Users can view workspace API keys" ON api_keys
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE id = api_keys.workspace_id
        )
    );

-- Users can create API keys for their workspace
CREATE POLICY "Users can create workspace API keys" ON api_keys
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT id FROM workspaces WHERE id = api_keys.workspace_id
        )
        AND user_id = auth.uid()
    );

-- Users can update (revoke) their own keys or workspace keys
CREATE POLICY "Users can revoke workspace API keys" ON api_keys
    FOR UPDATE USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE id = api_keys.workspace_id
        )
    );

-- Users can delete their own keys
CREATE POLICY "Users can delete own API keys" ON api_keys
    FOR DELETE USING (
        user_id = auth.uid()
        OR workspace_id IN (
            SELECT id FROM workspaces WHERE id = api_keys.workspace_id
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE api_keys IS 'API keys for programmatic access to Unool API';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permission scopes: posts:read, posts:write, analytics:read, profile:write, webhooks:manage';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of key for display (e.g., uk_abc123)';
COMMENT ON COLUMN api_keys.encrypted_key IS 'Full key encrypted with AES-GCM for retrieval';