const { AtpAgent } = require('@atproto/api');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

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
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: conns } = await client.from('platform_connections').select('*').eq('platform', 'bluesky').limit(1);
  if (!conns || conns.length === 0) return console.log('no connection');
  
  const connection = conns[0];
  const payloadStr = decryptToken(connection.access_token_encrypted);
  const payload = JSON.parse(payloadStr);
  
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: payload.handle, password: payload.appPassword });
  
  console.log(JSON.stringify(agent.session, null, 2));
}
main();
