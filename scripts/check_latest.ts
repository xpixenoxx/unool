import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('platform_connections').select('id, workspace_id, user_id, platform, created_at').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error('API Error:', error);
  } else {
    console.log(data);
  }
}

check();
