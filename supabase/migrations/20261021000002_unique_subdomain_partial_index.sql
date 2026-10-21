-- Add unique partial index on profiles.subdomain for active (non-deleted) profiles
-- This ensures subdomain uniqueness at the database level, preventing race conditions
-- that application-level checks cannot catch.

-- First, ensure we don't have duplicate subdomains in existing data
-- (this will fail if duplicates exist, which is the desired behavior)
DO $$
DECLARE
  duplicate_count int;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT subdomain, COUNT(*)
    FROM profiles
    WHERE deleted_at IS NULL
    GROUP BY subdomain
    HAVING COUNT(*) > 1
  ) dupes;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Cannot create unique index: % duplicate subdomains found in active profiles', duplicate_count;
  END IF;
END $$;

-- Create the partial unique index
-- Only enforces uniqueness for profiles that are not soft-deleted (deleted_at IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_subdomain_active_unique
ON profiles (subdomain)
WHERE deleted_at IS NULL;

-- Comment for documentation
COMMENT ON INDEX profiles_subdomain_active_unique IS
'Ensures subdomain uniqueness for active profiles only. Soft-deleted profiles (deleted_at IS NOT NULL) can have duplicate subdomains.';