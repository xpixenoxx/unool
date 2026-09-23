import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Try to query the table
  const { data, error } = await supabase.from('platform_connections').select('*').limit(1);
  if (error) {
    console.error('API Error:', error);
  } else {
    console.log('API Success. Columns:', data.length > 0 ? Object.keys(data[0]) : 'no data');
  }
}

check();
