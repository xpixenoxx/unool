import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function main() {
  const { data: analyticsData, error: analyticsError } = await supabase.from('analytics_events').select('*').limit(1);
  if (analyticsError) {
    console.error('Error fetching analytics_events:', analyticsError);
  } else {
    console.log('analytics_events table exists:', analyticsData);
  }
}

main();
