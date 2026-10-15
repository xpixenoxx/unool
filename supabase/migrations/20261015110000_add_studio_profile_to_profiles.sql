-- Add studio_profile column to profiles table for Studio onboarding answers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS studio_profile JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.studio_profile IS 'Studio onboarding profile: { role, doing, audience, tone, style, interests, completedAt }';
