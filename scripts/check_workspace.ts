import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const workspaceId = '77029ac6-24db-45cd-9d04-48abe73e8ac6';
  
  const { data: members } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId);
    
  console.log('Workspace members:', members);

  // Check all workspace_members just in case
  const { data: allMembers } = await supabase
    .from('workspace_members')
    .select('*');
    
  console.log('All members:', allMembers);
}

main();
