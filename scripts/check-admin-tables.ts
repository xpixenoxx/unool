import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function main() {
  // Check all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, subdomain, name, headline, bio, role, company, links, proof_points, theme, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total profiles:', profiles?.length);
  profiles?.forEach(p => {
    console.log('\n--- Profile ---');
    console.log('Subdomain:', p.subdomain);
    console.log('Name:', p.name);
    console.log('Headline:', p.headline);
    console.log('Bio:', p.bio);
    console.log('Role:', p.role);
    console.log('Company:', p.company);
    console.log('Links count:', p.links?.length || 0);
    console.log('Proof points count:', p.proof_points?.length || 0);
    console.log('Theme:', JSON.stringify(p.theme));
    console.log('Updated:', p.updated_at);
  });
}

main();
