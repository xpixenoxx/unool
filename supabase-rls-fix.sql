-- Fix RLS Infinite Recursion on workspace_members
-- Run this in Supabase SQL Editor (Production Project)

-- 1. Drop the broken policy that references workspace_members in its own SELECT
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Owners can manage members" ON workspace_members;

-- 2. Create corrected policy - ONLY references workspaces table via owner_id
CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = workspace_members.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- 3. Owners can manage members - also only references workspaces
CREATE POLICY "Owners can manage members" ON workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = workspace_members.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- 4. Verify profiles policy is correct (should already have OR true for public read)
-- This is already in schema: "Members can view profiles" has OR true

-- Test: After running, verify with:
-- SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='workspace_members';