-- Drop existing constraints
ALTER TABLE post_variants DROP CONSTRAINT IF EXISTS post_variants_platform_check;
ALTER TABLE platform_connections DROP CONSTRAINT IF EXISTS platform_connections_platform_check;

-- Add updated constraints to include bluesky
ALTER TABLE post_variants 
ADD CONSTRAINT post_variants_platform_check 
CHECK (platform IN ('linkedin', 'x', 'twitter', 'threads', 'manual', 'facebook', 'whatsapp', 'instagram', 'youtube', 'pinterest', 'bluesky'));

ALTER TABLE platform_connections 
ADD CONSTRAINT platform_connections_platform_check 
CHECK (platform IN ('linkedin', 'x', 'twitter', 'threads', 'manual', 'facebook', 'whatsapp', 'instagram', 'youtube', 'pinterest', 'bluesky'));
