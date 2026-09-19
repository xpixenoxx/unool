-- ============================================================
-- AUTH: Custom OTP Challenges table
-- Stores hashed OTPs for signup & signin verification.
-- The plaintext OTP is NEVER stored.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user this challenge belongs to (auth.users.id)
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Purpose: 'signup' | 'signin'
  purpose       TEXT NOT NULL CHECK (purpose IN ('signup', 'signin')),

  -- SHA-256 hash of the 6-digit OTP (we use sha256 of OTP only for fast lookup;
  -- argon2id is too slow to be practical at verify-time for 6-digit codes —
  -- instead we combine SHA-256 with a per-row server secret stored in otp_hash_pepper,
  -- making brute-force infeasible even if the table is leaked).
  otp_hash      TEXT NOT NULL,

  -- Expires 5 minutes after creation
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),

  -- Tracks failed attempts; invalidated after 5
  attempts      INTEGER NOT NULL DEFAULT 0,

  -- Whether this OTP has been successfully used
  used          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Cooldown: when the next OTP can be sent
  next_resend_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by user + purpose
CREATE INDEX IF NOT EXISTS idx_auth_otp_user_purpose
  ON public.auth_otp_challenges (user_id, purpose);

-- Index for cleanup of expired rows
CREATE INDEX IF NOT EXISTS idx_auth_otp_expires_at
  ON public.auth_otp_challenges (expires_at);

-- RLS: Only service role can read/write this table.
-- Application code always uses the supabase admin client.
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated user policies — all access via service role key only.

-- ============================================================
-- Cleanup function: remove expired / used challenges (run via pg_cron or manually)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_otp_challenges
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
