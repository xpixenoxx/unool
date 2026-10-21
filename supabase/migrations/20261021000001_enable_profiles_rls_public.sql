-- Enable RLS on profiles table and add public access policy
-- This migration allows public (anon) access to profiles with visibility = 'public'
-- while keeping private profiles protected behind authentication/RLS

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public (anon) read access to profiles with visibility = 'public'
-- The anon role is used by unauthenticated requests
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (visibility = 'public');

-- Policy: Authenticated users can view profiles in their own workspace
-- This allows workspace members to see profiles even if private (for internal use)
CREATE POLICY "Workspace members can view profiles in their workspace"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = profiles.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Policy: Users can view their own profile (even if private)
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Workspace members can insert profiles in their workspace
CREATE POLICY "Workspace members can create profiles"
ON profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = profiles.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Policy: Workspace members can update profiles in their workspace
CREATE POLICY "Workspace members can update profiles"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = profiles.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = profiles.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Policy: Workspace members can delete profiles in their workspace
CREATE POLICY "Workspace members can delete profiles"
ON profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = profiles.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);