require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
-- Drop the trigger if it exists
DROP FUNCTION IF EXISTS public.cleanup_expired_otp_challenges CASCADE;

-- Relax user_id requirement
ALTER TABLE public.auth_otp_challenges ALTER COLUMN user_id DROP NOT NULL;

-- Add email column for lookups when user_id is null
ALTER TABLE public.auth_otp_challenges ADD COLUMN IF NOT EXISTS email TEXT;

-- Add metadata column to store pending signup data (name, password_hash)
ALTER TABLE public.auth_otp_challenges ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create an index to quickly lookup by email + purpose
CREATE INDEX IF NOT EXISTS idx_auth_otp_email_purpose
  ON public.auth_otp_challenges (email, purpose);

-- Recreate cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_otp_challenges
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function run() {
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log('🔄 Running auth OTP migration update...');
  
  try {
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${SERVICE_ROLE_KEY}\`,
      },
      body: JSON.stringify({ query: SQL }),
    });

    if (!response.ok) {
      console.log('Could not use management API...');
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const res = await supabase.rpc('exec_sql', { sql: SQL });
      if (res.error) {
        console.log("RPC fallback error: ", res.error);
        throw new Error('RPC Failed');
      }
    }
    
    console.log('✅ Migration updated successfully!');
  } catch (err) {
    console.log('SQL to run manually:\n\n' + SQL);
  }
}

run();
