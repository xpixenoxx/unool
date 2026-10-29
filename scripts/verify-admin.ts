import { createClient } from '@supabase/supabase-js';
import argon2 from 'argon2';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

async function verify() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'usha@pixenox.com')
    .single();

  if (error || !user) {
    console.error('User not found in DB:', error);
    process.exit(1);
  }

  console.log('Admin found in DB:');
  console.log('- ID:', user.id);
  console.log('- Email:', user.email);
  console.log('- Role:', user.role);
  console.log('- Active:', user.is_active);
  console.log('- Has password_hash:', !!user.password_hash);

  const valid = await argon2.verify(user.password_hash, 'PIXER#USHA');
  console.log('- Password verification:', valid ? 'SUCCESS (Password matches PIXER#USHA)' : 'FAILED');
}

verify().catch(console.error);

