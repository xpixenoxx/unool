-- Migration: 20261107000002_add_platform_connections_metadata.sql
-- Adds metadata jsonb column to platform_connections for platform-specific identities
-- (e.g. Instagram Business Account ID, account type, auth method).

ALTER TABLE platform_connections
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_platform_connections_metadata_gin
  ON platform_connections USING gin (metadata);
