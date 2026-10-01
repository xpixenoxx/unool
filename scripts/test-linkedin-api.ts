import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';

const LI_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'X-Restli-Protocol-Version': '2.0.0',
  'LinkedIn-Version': '202606',
});

async function main() {
  const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: posts } = await adminSupabase
    .from('platform_posts')
    .select('*, platform_connection_id')
    .not('platform_post_id', 'is', null)
    .limit(1);
    
  if (!posts || posts.length === 0) {
    console.log('No posts found');
    return;
  }
  
  const post = posts[0];
  console.log('Testing post:', post.platform_post_id);
  
  const { data: conn } = await adminSupabase
    .from('platform_connections')
    .select('*')
    .eq('id', post.platform_connection_id)
    .single();
    
  if (!conn) {
    console.log('No connection found');
    return;
  }
  
  const token = await decryptToken(conn.access_token_encrypted);
  
  const platformPostId = post.platform_post_id;
  const postUrn = platformPostId.startsWith('urn:') ? platformPostId : `urn:li:share:${platformPostId}`;
  
  console.log('Testing Unencoded URN...');
  const socialUrlUnencoded = `https://api.linkedin.com/rest/socialActions/${postUrn}`;
  const res1 = await fetch(socialUrlUnencoded, { headers: LI_HEADERS(token) });
  console.log('Unencoded Status:', res1.status);
  console.log('Unencoded Response:', await res1.text());

  console.log('\nTesting Encoded URN...');
  const socialUrlEncoded = `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}`;
  const res2 = await fetch(socialUrlEncoded, { headers: LI_HEADERS(token) });
  console.log('Encoded Status:', res2.status);
  console.log('Encoded Response:', await res2.text());
}

main().catch(console.error);
