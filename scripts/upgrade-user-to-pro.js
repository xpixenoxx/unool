// Upgrade user usharanivarakapadra@gmail.com to 'pro' plan
// This script finds the user's workspace and updates the plan column

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function upgradeToPro() {
  const EMAIL = 'usharanivarakapadra@gmail.com';

  console.log(`Looking up user: ${EMAIL}`);

  // 1. Find the user by email in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing users:', authError.message);
    process.exit(1);
  }

  const authUser = authData.users.find(u => u.email === EMAIL);
  if (!authUser) {
    console.error(`User ${EMAIL} not found in auth.users`);
    process.exit(1);
  }

  console.log(`Found auth user: ${authUser.id} (${authUser.email})`);

  // 2. Find the user's workspace(s)
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name, plan, owner_id')
    .eq('owner_id', authUser.id);

  if (wsError) {
    console.error('Error fetching workspaces:', wsError.message);
    process.exit(1);
  }

  if (!workspaces || workspaces.length === 0) {
    // Try via workspace_members
    const { data: members, error: memError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', authUser.id);

    if (memError || !members || members.length === 0) {
      console.error('No workspaces found for this user');
      process.exit(1);
    }

    const wsIds = members.map(m => m.workspace_id);
    const { data: wsData, error: wsErr2 } = await supabase
      .from('workspaces')
      .select('id, name, plan, owner_id')
      .in('id', wsIds);

    if (wsErr2 || !wsData || wsData.length === 0) {
      console.error('No workspaces found via membership');
      process.exit(1);
    }

    workspaces.push(...wsData);
  }

  console.log(`Found ${workspaces.length} workspace(s):`);
  workspaces.forEach(ws => {
    console.log(`  - ${ws.id} | "${ws.name}" | current plan: ${ws.plan}`);
  });

  // 3. Update ALL user workspaces to 'pro'
  for (const ws of workspaces) {
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        plan: 'pro',
        plan_status: 'active',
      })
      .eq('id', ws.id);

    if (updateError) {
      console.error(`Failed to update workspace ${ws.id}:`, updateError.message);
    } else {
      console.log(`✅ Workspace "${ws.name}" (${ws.id}) upgraded to PRO`);
    }
  }

  // 4. Verify the update
  const wsIds = workspaces.map(ws => ws.id);
  const { data: verified } = await supabase
    .from('workspaces')
    .select('id, name, plan, plan_status')
    .in('id', wsIds);

  console.log('\nVerification:');
  verified?.forEach(ws => {
    console.log(`  ✅ ${ws.name}: plan=${ws.plan}, status=${ws.plan_status}`);
  });

  console.log('\nDone! User now has full Pro tier access.');
}

upgradeToPro().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
