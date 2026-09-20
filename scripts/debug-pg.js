require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testTrigger() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.SUPABASE_DB_URL_POOLING,
  });

  await client.connect();

  const SQL = `
DO $$ 
DECLARE 
  new_workspace_id UUID; 
  new_profile_id UUID; 
  workspace_slug TEXT; 
  test_id UUID := gen_random_uuid(); 
  v_email TEXT := 'debug2@test.com'; 
  v_name TEXT := 'Debug User'; 
BEGIN 
  INSERT INTO public.users (id, email, full_name) 
  VALUES (test_id, v_email, v_name) 
  ON CONFLICT (id) DO NOTHING; 

  workspace_slug := lower(regexp_replace(v_email, '[^a-z0-9]+', '-', 'g')); 
  workspace_slug := regexp_replace(workspace_slug, '^-+|-+$', ''); 
  workspace_slug := substr(workspace_slug || '-' || substr(test_id::text, 1, 8), 1, 63); 

  INSERT INTO public.workspaces (id, name, owner_id, plan, settings) 
  VALUES (gen_random_uuid(), 'My Workspace', test_id, 'free', '{}') 
  ON CONFLICT DO NOTHING 
  RETURNING id INTO new_workspace_id; 

  IF new_workspace_id IS NULL THEN 
    SELECT id INTO new_workspace_id FROM public.workspaces WHERE owner_id = test_id LIMIT 1; 
  END IF; 

  IF new_workspace_id IS NOT NULL THEN 
    INSERT INTO public.workspace_members (workspace_id, user_id, role) 
    VALUES (new_workspace_id, test_id, 'owner') 
    ON CONFLICT (workspace_id, user_id) DO NOTHING; 

    new_profile_id := gen_random_uuid(); 
    INSERT INTO public.profiles (id, workspace_id, user_id, subdomain, name, headline, bio, links, proof_points, theme) 
    VALUES (new_profile_id, new_workspace_id, test_id, workspace_slug, v_name, 'Professional', '', '[]'::jsonb, '[]'::jsonb, '{"preset": "minimal"}'::jsonb) 
    ON CONFLICT (subdomain) DO NOTHING; 
  END IF; 
  RAISE EXCEPTION 'TEST_OK'; 
END; 
$$;
  `;

  try {
    await client.query(SQL);
  } catch (err) {
    console.log(err.message);
  } finally {
    await client.end();
  }
}

testTrigger();
