/**
 * scripts/set-admin-password.ts
 *
 * One-time utility to set (or reset) an admin user's password.
 *
 * Usage:
 *   npx tsx scripts/set-admin-password.ts <email> <password>
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   - argon2 installed (already in package.json)
 */

import { createClient } from '@supabase/supabase-js';
import argon2 from 'argon2';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/set-admin-password.ts <email> <password>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Hash the password with argon2id (OWASP recommended)
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,   // 64 MiB
    timeCost: 3,
    parallelism: 4,
  });

  // Update the admin user
  const { data, error } = await supabase
    .from('admin_users')
    .update({ password_hash: hash })
    .eq('email', email.toLowerCase().trim())
    .select('id, email, role')
    .single();

  if (error) {
    console.error('Failed to update admin password:', error.message);
    console.error('Make sure the admin_users row exists and the migration has been applied.');
    process.exit(1);
  }

  console.log(`✅ Password updated for admin: ${data.email} (role: ${data.role})`);
  console.log('   You can now remove ADMIN_PASSWORD from .env if set.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

