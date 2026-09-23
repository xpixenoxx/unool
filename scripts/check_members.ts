import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('workspace_members').select('*');
  if (error) {
    console.error('API Error:', error);
  } else {
    console.log('Total members:', data.length);
    console.log(data);
  }
}

check();
