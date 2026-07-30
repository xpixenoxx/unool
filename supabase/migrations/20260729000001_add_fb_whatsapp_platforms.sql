-- Migration: Add Facebook and WhatsApp platforms to platform_connections
-- Created: 2026-07-29

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update platform_connections table to include facebook and whatsapp platforms
-- The platform column already uses CHECK constraint, so we need to alter it

-- First drop the existing check constraint (if it exists)
ALTER TABLE platform_connections DROP CONSTRAINT IF EXISTS platform_connections_platform_check;

-- Add new check constraint with facebook and whatsapp
ALTER TABLE platform_connections
ADD CONSTRAINT platform_connections_platform_check
CHECK (platform IN ('linkedin', 'x', 'threads', 'manual', 'facebook', 'whatsapp'));

-- Also update platform_posts table if it has a platform constraint via foreign key
-- (platform_posts references platform_connections, so constraint is on platform_connections)

-- Update webhook verification to include facebook and whatsapp
-- (This is handled in the verify.ts file, not in DB)

-- Comments
COMMENT ON CONSTRAINT platform_connections_platform_check ON platform_connections
IS 'Supported platforms: linkedin, x, threads, manual, facebook, whatsapp';