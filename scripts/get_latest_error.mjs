import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('post_variants')
    .select('platform, status, error, updated_at')
    .eq('platform', 'instagram')
    .eq('status', 'failed')
    .order('updated_at', { ascending: false })
    .limit(3);
    
  if (error) console.error("DB Error:", error);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
