-- Migration: Add password_hash and is_active to admin_users
-- Purpose: Support argon2 hashed passwords and account deactivation

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Index for quick login lookup by email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

COMMENT ON COLUMN admin_users.password_hash IS 'Argon2id hash of the admin password. NULL means the account uses ADMIN_PASSWORD env fallback.';
COMMENT ON COLUMN admin_users.is_active IS 'When false, the admin cannot log in even with correct credentials.';

