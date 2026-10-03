const { AtpAgent } = require('@atproto/api');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

// Copy decryption logic
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64');
function decryptToken(encryptedText) {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function main() {
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await client.from('platform_connections').select('*').eq('platform', 'bluesky').limit(1);
    
    if (!data || data.length === 0) {
      console.log('No bluesky connection found');
      return;
    }
    
    const connection = data[0];
    const password = decryptToken(connection.access_token_encrypted);
    
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    await agent.login({
      identifier: connection.username,
      password: password,
    });
    
    console.log('Logged in successfully. Getting service auth...');
    const { data: serviceAuth } = await agent.com.atproto.server.getServiceAuth({
      aud: 'did:web:video.bsky.app',
      lxm: 'com.atproto.repo.uploadBlob',
      exp: Math.floor(Date.now() / 1000) + 60 * 30, // 30 mins
    });
    console.log('Service auth token obtained!');
    
    console.log('Fetching video...');
    const videoUrl = 'https://bhkpkylcwcxtpxbxrpag.supabase.co/storage/v1/object/public/post-media/uploads/1790998348444-kru1o6hg88c-wATER.mp4';
    const response = await fetch(videoUrl);
    const buffer = await response.arrayBuffer();
    
    console.log('Uploading to video service...');
    const uploadUrl = new URL('https://video.bsky.app/xrpc/app.bsky.video.uploadVideo');
    uploadUrl.searchParams.append('did', agent.session.did);
    uploadUrl.searchParams.append('name', 'video.mp4');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceAuth.token}`,
        'Content-Type': 'video/mp4',
      },
      body: buffer,
    });
    
    const statusText = await uploadResponse.text();
    console.log('Upload response:', uploadResponse.status, statusText);
    
  } catch (err) {
    console.error('Error in script:', err);
  }
}

main();
