import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase.from('platform_connections').insert({
    workspace_id: '123e4567-e89b-12d3-a456-426614174000', // random uuid
    platform: 'linkedin',
    platform_user_id: 'test_user_' + Date.now(),
    username: 'Test User',
    access_token_encrypted: 'abc123enc',
    refresh_token_encrypted: 'refresh456enc',
    status: 'connected',
    scopes: ['public_profile']
  }).select().single();

  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert Success:', data.id);
  }
}

run();
