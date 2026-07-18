-- Fix RLS Policies for Unool
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This fixes: infinite recursion on workspace_members, and adds public profile read access

-- ============================================================
-- 1. Fix workspace_members policies (drop old, create new)
-- ============================================================
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Owners can manage members" ON workspace_members;

-- Only reference workspaces table (avoids infinite recursion)
CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = workspace_members.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage members" ON workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = workspace_members.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- ============================================================
-- 2. Fix profiles policies (separate public read policy)
-- ============================================================
DROP POLICY IF EXISTS "Members can view profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are readable by all" ON profiles;
DROP POLICY IF EXISTS "Members can view profiles in their workspace" ON profiles;

-- Public read access (no subquery - avoids triggering workspace_members RLS)
CREATE POLICY "Public profiles are readable by all" ON profiles
    FOR SELECT USING (true);

-- Workspace member access (separate policy)
CREATE POLICY "Members can view profiles in their workspace" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = profiles.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- ============================================================
-- 3. Verify the policies
-- ============================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('workspace_members', 'profiles')
ORDER BY tablename, policyname;