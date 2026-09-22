import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('platform_connections')
    .select('*');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Connections in DB:', JSON.stringify(data, null, 2));

  // Compute status simulation
  for (const conn of data) {
    const now = new Date();
    const expiresAt = conn.expires_at ? new Date(conn.expires_at) : null;
    const isExpired = expiresAt && expiresAt <= now;
    console.log(`Platform: ${conn.platform}, ExpiresAt: ${expiresAt}, Now: ${now}, IsExpired: ${isExpired}, Status: ${conn.status}`);
  }
}

main();
