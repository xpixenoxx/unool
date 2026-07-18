-- Unool Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKSPACES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);

-- ============================================================
-- WORKSPACE MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subdomain TEXT UNIQUE NOT NULL,
    name TEXT,
    headline TEXT,
    bio TEXT,
    role TEXT,
    company TEXT,
    links JSONB NOT NULL DEFAULT '[]',
    proof_points JSONB NOT NULL DEFAULT '[]',
    theme JSONB NOT NULL DEFAULT '{"preset": "minimal"}',
    source_url TEXT,
    extraction_prompt_version TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_workspace_id ON profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subdomain ON profiles(subdomain);

-- ============================================================
-- POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    adaptation_prompt_version TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    platform_post_id TEXT, -- For manual publishing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_profile_id ON posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_posts_workspace_id ON posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at) WHERE status = 'scheduled';

-- ============================================================
-- POST VARIANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS post_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'x', 'threads', 'manual')),
    adapted_content TEXT NOT NULL,
    media_urls JSONB NOT NULL DEFAULT '[]',
    character_count INTEGER NOT NULL DEFAULT 0,
    hashtag_strategy JSONB NOT NULL DEFAULT '[]',
    first_comment_hint TEXT,
    platform_post_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    error JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_variants_post_id ON post_variants(post_id);
CREATE INDEX IF NOT EXISTS idx_post_variants_platform ON post_variants(platform);
CREATE INDEX IF NOT EXISTS idx_post_variants_status ON post_variants(status);

-- ============================================================
-- PLATFORM CONNECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'x', 'threads', 'manual')),
    platform_user_id TEXT NOT NULL,
    username TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMPTZ,
    scopes JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'revoked', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_connections_workspace_id ON platform_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_status ON platform_connections(status);

-- ============================================================
-- PLATFORM POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_variant_id UUID NOT NULL REFERENCES post_variants(id) ON DELETE CASCADE,
    platform_connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
    platform_post_id TEXT NOT NULL,
    platform_url TEXT,
    engagement JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_posts_variant_id ON platform_posts(post_variant_id);
CREATE INDEX IF NOT EXISTS idx_platform_posts_connection_id ON platform_posts(platform_connection_id);
CREATE INDEX IF NOT EXISTS idx_platform_posts_platform_post_id ON platform_posts(platform_post_id);

-- ============================================================
-- AI USAGE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    tokens_in INTEGER NOT NULL DEFAULT 0,
    tokens_out INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_workspace_id ON ai_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);

-- ============================================================
-- API CALLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS api_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_calls_workspace_id ON api_calls(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_created_at ON api_calls(created_at);

-- ============================================================
-- ONBOARDING CHECKLISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_checklists (
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    steps JSONB NOT NULL DEFAULT '[]',
    total_xp INTEGER NOT NULL DEFAULT 0,
    earned_xp INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    current_step INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_workspace_id ON onboarding_checklists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_user_id ON onboarding_checklists(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- Users: users can only see themselves
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Workspaces: members can view workspaces they belong to
CREATE POLICY "Members can view workspace" ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert workspace" ON workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update workspace" ON workspaces
    FOR UPDATE USING (owner_id = auth.uid());

-- Workspace members: users can view members of their workspaces
-- Fixed: Use workspaces table to avoid infinite recursion
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

-- Profiles: workspace members can view profiles in their workspace
-- Public profiles are readable by all (separate policy to avoid RLS subquery evaluation)
CREATE POLICY "Public profiles are readable by all" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Members can view profiles in their workspace" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = profiles.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can create profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = profiles.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can update profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = profiles.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Posts: workspace members can manage posts
CREATE POLICY "Members can manage posts" ON posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = posts.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Post variants: workspace members can manage
CREATE POLICY "Members can manage post variants" ON post_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM posts
            JOIN workspace_members ON workspace_members.workspace_id = posts.workspace_id
            WHERE posts.id = post_variants.post_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Platform connections: workspace members can manage
CREATE POLICY "Members can manage platform connections" ON platform_connections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = platform_connections.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Platform posts: workspace members can view
CREATE POLICY "Members can view platform posts" ON platform_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM post_variants
            JOIN posts ON posts.id = post_variants.post_id
            JOIN workspace_members ON workspace_members.workspace_id = posts.workspace_id
            WHERE post_variants.id = platform_posts.post_variant_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert platform posts" ON platform_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM post_variants
            JOIN posts ON posts.id = post_variants.post_id
            JOIN workspace_members ON workspace_members.workspace_id = posts.workspace_id
            WHERE post_variants.id = platform_posts.post_variant_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- AI Usage: workspace members can view/insert
CREATE POLICY "Members can view ai usage" ON ai_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = ai_usage.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert ai usage" ON ai_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = ai_usage.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- API Calls: workspace members can view/insert
CREATE POLICY "Members can view api calls" ON api_calls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = api_calls.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert api calls" ON api_calls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = api_calls.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Onboarding Checklists: workspace members can view/upsert
CREATE POLICY "Members can view onboarding checklists" ON onboarding_checklists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = onboarding_checklists.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can upsert onboarding checklists" ON onboarding_checklists
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = onboarding_checklists.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
        AND auth.uid() = onboarding_checklists.user_id
    );

CREATE POLICY "Members can update onboarding checklists" ON onboarding_checklists
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = onboarding_checklists.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
        AND auth.uid() = onboarding_checklists.user_id
    );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
-- Function to handle new user creation (run via auth webhook or manually)
-- Creates user record, default workspace, workspace membership, and default profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  new_profile_id UUID;
  workspace_slug TEXT;
BEGIN
    -- 1. Create user record
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create default workspace for the user
    workspace_slug := lower(regexp_replace(NEW.email, '[^a-z0-9]+', '-', 'g'));
    workspace_slug := regexp_replace(workspace_slug, '^-+|-+$', '');
    workspace_slug := substr(workspace_slug || '-' || substr(NEW.id::text, 1, 8), 1, 63);

    INSERT INTO public.workspaces (id, name, owner_id, plan, settings)
    VALUES (gen_random_uuid(), 'My Workspace', NEW.id, 'free', '{}')
    ON CONFLICT DO NOTHING
    RETURNING id INTO new_workspace_id;

    -- If workspace already exists (race condition), fetch it
    IF new_workspace_id IS NULL THEN
      SELECT id INTO new_workspace_id FROM public.workspaces WHERE owner_id = NEW.id LIMIT 1;
    END IF;

    -- 3. Add user as workspace member (owner)
    IF new_workspace_id IS NOT NULL THEN
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES (new_workspace_id, NEW.id, 'owner')
      ON CONFLICT (workspace_id, user_id) DO NOTHING;

      -- 4. Create default profile for the user
      new_profile_id := gen_random_uuid();
      INSERT INTO public.profiles (id, workspace_id, user_id, subdomain, name, headline, bio, links, proof_points, theme)
      VALUES (
        new_profile_id,
        new_workspace_id,
        NEW.id,
        workspace_slug,
        NEW.raw_user_meta_data->>'full_name',
        'Professional',
        '',
        '[]'::jsonb,
        '[]'::jsonb,
        '{"preset": "minimal"}'::jsonb
      )
      ON CONFLICT (subdomain) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();