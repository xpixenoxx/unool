-- ============================================================
-- AUTH OTP: Updated migration
-- Allows storing pending signup data BEFORE user is created
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Drop old table if exists (fresh start)
DROP TABLE IF EXISTS public.auth_otp_challenges CASCADE;

-- 2. Create updated table
-- user_id is NULLABLE — it's null for pending (pre-OTP) signups
CREATE TABLE public.auth_otp_challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- null until OTP verified
  email          TEXT NOT NULL,
  purpose        TEXT NOT NULL CHECK (purpose IN ('signup', 'signin')),
  otp_hash       TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  attempts       INTEGER NOT NULL DEFAULT 0,
  used           BOOLEAN NOT NULL DEFAULT FALSE,
  next_resend_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata       JSONB,                                              -- stores {name, password_hash} for pending signups
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_auth_otp_email_purpose  ON public.auth_otp_challenges (email, purpose);
CREATE INDEX idx_auth_otp_user_purpose   ON public.auth_otp_challenges (user_id, purpose);
CREATE INDEX idx_auth_otp_expires_at     ON public.auth_otp_challenges (expires_at);

-- RLS: only service role (our backend) can touch this table
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;

-- Cleanup function (run daily via pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_otp_challenges
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
