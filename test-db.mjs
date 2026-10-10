import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in env files.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
  console.log("Checking analytics_events table...");
  const { data, error } = await supabase
    .from('analytics_events')
    .select('id, event_type, created_at, workspace_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error querying analytics_events:", error);
  } else {
    console.log(`Found ${data?.length || 0} recent events:`);
    console.log(data);
  }
}

checkEvents();
