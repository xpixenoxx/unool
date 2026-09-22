import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: users, error: ue } = await supabase.auth.admin.listUsers();
  if (ue) return console.error(ue);
  
  const user = users.users[users.users.length - 1]; // get latest user
  console.log('Latest User:', user.id);
  
  const { data: workspaces, error: we } = await supabase.from('workspace_members').select('*').eq('user_id', user.id);
  console.log('Workspaces for user:', workspaces);
}

run();
