import { createClient } from '@supabase/supabase-js';
import argon2 from 'argon2';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function main() {
  const email = (process.argv[2] || 'usha@pixenox.com').toLowerCase().trim();
  const password = process.argv[3] || 'PIXER#USHA';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('Connecting to Supabase at:', supabaseUrl);

  // 1. Hash the password with argon2id (OWASP recommended)
  console.log('Hashing password with Argon2id...');
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const permissions = {
    users: true,
    workspaces: true,
    plans: true,
    payments: true,
    content: true,
    platforms: true,
    referrals: true,
    analytics: true,
  };

  // 2. Ensure auth.users record exists (because admin_users.id references auth.users(id))
  console.log('Checking auth.users for:', email);
  let userId: string | null = null;

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.warn('Could not list auth users:', listError.message);
  } else {
    const existingAuthUser = listData.users.find(
      (u) => u.email?.toLowerCase().trim() === email
    );
    if (existingAuthUser) {
      userId = existingAuthUser.id;
      console.log('Found existing auth.users record:', userId);
    }
  }

  if (!userId) {
    console.log('Creating user in auth.users...');
    const { data: newAuthUser, error: createAuthErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'super_admin' },
    });

    if (createAuthErr || !newAuthUser.user) {
      console.error('Failed to create auth user:', createAuthErr?.message);
      process.exit(1);
    }

    userId = newAuthUser.user.id;
    console.log('Created auth.users record:', userId);
  } else {
    // Optionally update auth user's password too
    await supabase.auth.admin.updateUserById(userId, { password });
  }

  // 3. Upsert into admin_users table
  console.log('Upserting admin_users record for ID:', userId);

  const { data: existingAdmin } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .or(`id.eq.${userId},email.eq.${email}`)
    .maybeSingle();

  if (existingAdmin) {
    console.log(`Updating existing admin_users record: ${existingAdmin.email} (ID: ${existingAdmin.id})...`);
    const { data: updated, error: updateErr } = await supabase
      .from('admin_users')
      .update({
        id: userId,
        email,
        password_hash: hash,
        role: 'super_admin',
        permissions,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAdmin.id)
      .select('id, email, role, is_active')
      .single();

    if (updateErr) {
      console.error('Failed to update admin user:', updateErr.message);
      process.exit(1);
    }

    console.log('✅ Successfully updated admin credentials in admin_users:');
    console.log(JSON.stringify(updated, null, 2));
  } else {
    console.log(`Inserting new super_admin into admin_users...`);
    const { data: created, error: insertErr } = await supabase
      .from('admin_users')
      .insert({
        id: userId,
        email,
        password_hash: hash,
        role: 'super_admin',
        permissions,
        is_active: true,
      })
      .select('id, email, role, is_active')
      .single();

    if (insertErr) {
      console.error('Failed to create admin user:', insertErr.message);
      process.exit(1);
    }

    console.log('✅ Successfully created super_admin in admin_users:');
    console.log(JSON.stringify(created, null, 2));
  }

  // 4. Verify password with argon2
  const isValid = await argon2.verify(hash, password);
  console.log('Password verification check:', isValid ? 'PASS' : 'FAIL');
  console.log(`\n🎉 Admin setup complete! You can now log in at /admin/login with:`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
}

main().catch((err) => {
  console.error('Execution failed:', err);
  process.exit(1);
});
