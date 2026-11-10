-- Migration: Remediate P0/P1 RLS vulnerabilities and schema drift discovered during forensic audit
-- 1. Fix brand_materials_pages RLS policy that granted PUBLIC (anon) FOR ALL access without TO service_role
-- 2. Add proper workspace member access policy on brand_materials_pages
-- 3. Fix tautological RLS policies on admin_users and admin_audit_log
-- 4. Ensure ai_usage has user_id, capability, model, cost_usd columns used by trackAiUsage()

DO $$
BEGIN
  -- 1. Replace overly permissive PUBLIC policy on brand_materials_pages with service_role-scoped policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_materials_pages'
      AND policyname = 'Service role all access brand materials pages'
  ) THEN
    DROP POLICY "Service role all access brand materials pages" ON brand_materials_pages;
  END IF;

  CREATE POLICY "Service role all access brand materials pages"
    ON brand_materials_pages FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_materials_pages'
      AND policyname = 'Workspace members manage brand materials pages'
  ) THEN
    CREATE POLICY "Workspace members manage brand materials pages"
      ON brand_materials_pages FOR ALL
      TO authenticated
      USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
          UNION
          SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
      )
      WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
          UNION
          SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 2. Ensure ai_usage columns exist for trackAiUsage() in lib/limits/enforcer.ts
ALTER TABLE IF EXISTS ai_usage
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS capability TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(12, 6) DEFAULT 0;

-- 3. Ensure workspace_members supports team invitations via POST /api/workspace
ALTER TABLE IF EXISTS workspace_members
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE IF EXISTS workspace_members
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_by UUID,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Scope admin_users and admin_audit_log policies strictly to service_role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_users'
      AND policyname = 'Service role only'
  ) THEN
    DROP POLICY "Service role only" ON admin_users;
    CREATE POLICY "Service role only"
      ON admin_users FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_log'
      AND policyname = 'Service role only'
  ) THEN
    DROP POLICY "Service role only" ON admin_audit_log;
    CREATE POLICY "Service role only"
      ON admin_audit_log FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


