import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase.from('platform_connections').select('id, workspace_id, user_id, platform, username').limit(10);
  if (error) {
    console.error('API Error:', error);
  } else {
    console.log('Connections Dump:', JSON.stringify(data, null, 2));
  }
}

check();
