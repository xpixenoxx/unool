-- Add studio onboarding columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_answers JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.onboarding_completed IS 'Flag indicating whether user has completed or skipped Studio onboarding';
COMMENT ON COLUMN profiles.onboarding_answers IS 'Studio persona and onboarding answers: { persona, focus, audience, tone, custom }';
