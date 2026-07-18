-- Fix RLS policies on profiles table for public access
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Drop the existing combined policy that causes issues
DROP POLICY IF EXISTS "Members can view profiles" ON profiles;

-- 2. Create separate policies to avoid RLS subquery evaluation issues
-- Public profiles are readable by all (no subquery - just returns true)
CREATE POLICY "Public profiles are readable by all" ON profiles
    FOR SELECT USING (true);

-- Members can view profiles in their workspace (separate policy)
CREATE POLICY "Members can view profiles in their workspace" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = profiles.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;