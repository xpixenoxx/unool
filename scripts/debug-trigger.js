require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
DO $$
DECLARE
  new_workspace_id UUID;
  new_profile_id UUID;
  workspace_slug TEXT;
  test_id UUID := gen_random_uuid();
  v_email TEXT := 'debug@test.com';
  v_name TEXT := 'Debug User';
BEGIN
    -- 1. Create user record
    INSERT INTO public.users (id, email, full_name)
    VALUES (test_id, v_email, v_name)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create default workspace for the user
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

    -- 3. Add user as workspace member (owner)
    IF new_workspace_id IS NOT NULL THEN
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES (new_workspace_id, test_id, 'owner')
      ON CONFLICT (workspace_id, user_id) DO NOTHING;

      -- 4. Create default profile for the user
      new_profile_id := gen_random_uuid();
      INSERT INTO public.profiles (id, workspace_id, user_id, subdomain, name, headline, bio, links, proof_points, theme)
      VALUES (
        new_profile_id,
        new_workspace_id,
        test_id,
        workspace_slug,
        v_name,
        'Professional',
        '',
        '[]'::jsonb,
        '[]'::jsonb,
        '{"preset": "minimal"}'::jsonb
      )
      ON CONFLICT (subdomain) DO NOTHING;
    END IF;
    
    RAISE EXCEPTION 'TEST COMPLETED WITH WORKSPACE %', new_workspace_id;
END;
$$;
`;

async function run() {
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log('🔄 Simulating trigger...');
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const res = await supabase.rpc('exec_sql', { sql: SQL });
    console.log(res.error || res.data);
  } catch (err) {
    console.log('Error:', err);
  }
}

run();
