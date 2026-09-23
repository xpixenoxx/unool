import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase.from('workspace_members').select('*').eq('user_id', '851724d6-4fc4-441b-96e9-6f97405c3bd2');
  if (error) {
    console.error('API Error:', error);
  } else {
    console.log('Workspaces for user:', data.length);
    console.log(data);
  }
}

check();
