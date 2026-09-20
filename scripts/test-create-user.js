require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

async function testUserCreate() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('Testing createUser without password...');
  const res1 = await supabase.auth.admin.createUser({
    email: 'test_nopass2@test.com',
    email_confirm: true,
    user_metadata: { full_name: 'Test', password_hash: 'hash' }
  });
  console.log('No password result:', res1.error || res1.data.user.id);

  console.log('\nTesting createUser WITH password...');
  const res2 = await supabase.auth.admin.createUser({
    email: 'test_pass2@test.com',
    password: crypto.randomBytes(32).toString('hex'),
    email_confirm: true,
    user_metadata: { full_name: 'Test', password_hash: 'hash' }
  });
  console.log('With password result:', res2.error || res2.data.user.id);
  
  if (!res1.error) await supabase.auth.admin.deleteUser(res1.data.user.id);
  if (!res2.error) await supabase.auth.admin.deleteUser(res2.data.user.id);
}

testUserCreate();
