/**
 * scripts/run-auth-migration.js
 *
 * Runs the auth OTP migration directly against your Supabase project.
 * Usage: node scripts/run-auth-migration.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const SQL = `
CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose        TEXT NOT NULL CHECK (purpose IN ('signup', 'signin')),
  otp_hash       TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  attempts       INTEGER NOT NULL DEFAULT 0,
  used           BOOLEAN NOT NULL DEFAULT FALSE,
  next_resend_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_otp_user_purpose
  ON public.auth_otp_challenges (user_id, purpose);

CREATE INDEX IF NOT EXISTS idx_auth_otp_expires_at
  ON public.auth_otp_challenges (expires_at);

ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_otp_challenges
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function run() {
  // Use Supabase REST API to execute SQL via the pg endpoint
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  const url = `https://${projectRef}.supabase.co/rest/v1/rpc/exec`;

  // Use the Management API instead
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log('🔄  Running auth OTP migration...');
  console.log(`   Project: ${projectRef}`);

  try {
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: SQL }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.log('\n⚠️  Management API approach failed. Please run the SQL manually.\n');
      console.log('📋  Copy & paste this SQL into:\n    https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
      console.log('─'.repeat(60));
      console.log(SQL);
      console.log('─'.repeat(60));
      return;
    }

    console.log('✅  Migration applied successfully!');
    console.log('   Table auth_otp_challenges is ready.');
  } catch (err) {
    console.log('\n⚠️  Could not connect. Please run the SQL manually.\n');
    console.log('📋  Copy & paste this SQL into:\n    https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
    console.log('─'.repeat(60));
    console.log(SQL);
    console.log('─'.repeat(60));
  }
}

run();
