import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const emailToPromote = process.argv[2];

  if (!emailToPromote) {
    console.log('No email provided. Listing all users:');
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError);
      process.exit(1);
    }
    
    usersData.users.forEach(u => console.log(`- ${u.email}`));
    console.log('\nTo promote a user to admin, run:');
    console.log('npx tsx scripts/make-admin.ts <email>');
    process.exit(0);
  }

  console.log(`Looking for user with email: ${emailToPromote}`);
  
  // Find user by email
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error listing users:', usersError);
    process.exit(1);
  }

  const user = usersData.users.find(u => u.email === emailToPromote);
  if (!user) {
    console.error(`User with email ${emailToPromote} not found.`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id}. Promoting to super_admin...`);

  // Insert into admin_users
  const { data, error } = await supabase
    .from('admin_users')
    .upsert({
      id: user.id,
      email: user.email,
      role: 'super_admin',
      permissions: {
        users: true,
        workspaces: true,
        billing: true,
        analytics: true,
        impersonate: true
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  }

  console.log('Successfully promoted user to super_admin:', data);
}

main().catch(console.error);
