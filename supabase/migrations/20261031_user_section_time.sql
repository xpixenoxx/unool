-- Migration: User Section Time Tracking
-- Created: 2026-10-31

CREATE TABLE IF NOT EXISTS user_section_time (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    duration_seconds BIGINT NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, section)
);

CREATE INDEX IF NOT EXISTS idx_user_section_time_user ON user_section_time(user_id);
CREATE INDEX IF NOT EXISTS idx_user_section_time_section ON user_section_time(section);
CREATE INDEX IF NOT EXISTS idx_user_section_time_updated ON user_section_time(updated_at DESC);

ALTER TABLE user_section_time ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can upsert their own section time" ON user_section_time;
CREATE POLICY "Users can upsert their own section time" ON user_section_time
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on user_section_time" ON user_section_time;
CREATE POLICY "Service role full access on user_section_time" ON user_section_time
    FOR ALL USING (true) WITH CHECK (true);

