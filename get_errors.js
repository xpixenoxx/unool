require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkErrors() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('post_variants')
    .select('platform, error, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    fs.writeFileSync('err8.json', JSON.stringify({error: error.message}), 'utf8');
  } else {
    fs.writeFileSync('err8.json', JSON.stringify(data, null, 2), 'utf8');
  }
}

checkErrors();
