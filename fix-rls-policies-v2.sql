-- Fix RLS Policies - Add auth.uid() guard to prevent recursion
-- Run in Supabase SQL Editor

-- Fix profiles member policy: only apply when auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Members can view profiles in their workspace" ON profiles;

CREATE POLICY "Members can view profiles in their workspace" ON profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = profiles.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Verify
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('workspace_members', 'profiles', 'workspaces')
ORDER BY tablename, policyname;