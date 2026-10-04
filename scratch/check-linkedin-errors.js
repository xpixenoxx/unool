const { createClient } = require('@supabase/supabase-js');

// Read env vars manually
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  let key = trimmed.substring(0, eqIdx).trim();
  let value = trimmed.substring(eqIdx + 1).trim();
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  envVars[key] = value;
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase creds. Found keys:", Object.keys(envVars).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLinkedIn() {
  // 1. Check LinkedIn post variants
  console.log("=== Recent LinkedIn Post Variants ===");
  const { data: variants, error: vError } = await supabase
    .from('post_variants')
    .select('id, post_id, platform, status, error, platform_post_id, created_at, updated_at')
    .eq('platform', 'linkedin')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (vError) {
    console.error("Error fetching variants:", vError.message);
  } else {
    for (const v of variants) {
      console.log(`\n  Variant ${v.id.substring(0,8)}:`);
      console.log(`    Status: ${v.status}`);
      console.log(`    Error: ${JSON.stringify(v.error)}`);
      console.log(`    Platform Post ID: ${v.platform_post_id}`);
      console.log(`    Created: ${v.created_at}`);
      console.log(`    Updated: ${v.updated_at}`);
    }
  }

  // 2. Check LinkedIn platform connection
  console.log("\n=== LinkedIn Platform Connection ===");
  const { data: connections, error: cError } = await supabase
    .from('platform_connections')
    .select('id, platform, status, platform_user_id, platform_username, expires_at, created_at, updated_at')
    .eq('platform', 'linkedin')
    .limit(5);
    
  if (cError) {
    console.error("Error fetching connections:", cError.message);
  } else {
    for (const c of connections) {
      console.log(`  Connection ${c.id.substring(0,8)}:`);
      console.log(`    Status: ${c.status}`);
      console.log(`    User: ${c.platform_username}`);
      console.log(`    Platform User ID: ${c.platform_user_id}`);
      console.log(`    Expires At: ${c.expires_at}`);
      console.log(`    Updated: ${c.updated_at}`);
      
      // Check if token is expired
      if (c.expires_at) {
        const expiresAt = new Date(c.expires_at);
        const now = new Date();
        const isExpired = expiresAt < now;
        console.log(`    TOKEN EXPIRED: ${isExpired} (expires: ${expiresAt.toISOString()}, now: ${now.toISOString()})`);
      }
    }
  }

  // 3. Check parent post status for the most recent linkedin variant
  if (variants && variants.length > 0) {
    const postId = variants[0].post_id;
    console.log(`\n=== Parent Post (${postId.substring(0,8)}) ===`);
    const { data: post, error: pError } = await supabase
      .from('posts')
      .select('id, status, content, created_at, updated_at')
      .eq('id', postId)
      .single();
    
    if (pError) {
      console.error("Error:", pError.message);
    } else {
      console.log(`  Status: ${post.status}`);
      console.log(`  Content: ${(post.content || '').substring(0, 100)}`);
      console.log(`  Updated: ${post.updated_at}`);
    }

    // Also check all variants for this post
    console.log(`\n=== All Variants for Post ${postId.substring(0,8)} ===`);
    const { data: allVariants } = await supabase
      .from('post_variants')
      .select('id, platform, status, error, platform_post_id')
      .eq('post_id', postId);
    
    if (allVariants) {
      for (const v of allVariants) {
        console.log(`  ${v.platform}: ${v.status} | error: ${JSON.stringify(v.error)} | postId: ${v.platform_post_id}`);
      }
    }
  }
}

checkLinkedIn().catch(console.error);
