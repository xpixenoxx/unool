-- This migration is intentionally a no-op.
-- Admin user creation requires a Supabase auth user to exist first (FK constraint).
-- Use the /admin/api/setup endpoint instead for first-time admin setup.
SELECT 1;
