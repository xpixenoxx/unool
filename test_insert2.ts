import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: users, error: ue } = await supabase.auth.admin.listUsers();
  const user = users.users[users.users.length - 1]; // get latest user
  
  const { data: workspaces, error: we } = await supabase.from('workspace_members').select('*').eq('user_id', user.id);
  const workspaceId = workspaces[0].workspace_id;
  
  console.log('Testing insert with User ID:', user.id, 'Workspace ID:', workspaceId);

  const { data, error } = await supabase.from('platform_connections').insert({
    workspace_id: workspaceId,
    platform: 'linkedin',
    platform_user_id: 'test_user_' + Date.now(),
    username: 'Test User',
    access_token_encrypted: 'abc123enc',
    refresh_token_encrypted: 'refresh456enc',
    status: 'connected',
    scopes: ['public_profile']
  }).select().single();

  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert Success:', data.id);
    
    // Cleanup
    await supabase.from('platform_connections').delete().eq('id', data.id);
  }
}

run();
