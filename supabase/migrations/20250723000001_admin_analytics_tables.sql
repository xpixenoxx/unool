-- Migration: Admin panel tables + Analytics events
-- Created: 2025-07-23

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ANALYTICS EVENTS TABLE
-- Tracks: profile_view, link_click, post_publish, post_view, profile_cta_click
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- nullable for anonymous events
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- link to specific profile
    event_type TEXT NOT NULL CHECK (event_type IN (
        'profile_view',
        'link_click',
        'post_publish',
        'post_view',
        'profile_cta_click',
        'subdomain_claim'
    )),
    event_data JSONB NOT NULL DEFAULT '{}', -- flexible payload: { link_type, link_url, post_id, platform, referrer, utm_* }
    referrer TEXT,
    user_agent TEXT,
    ip_hash TEXT, -- hashed IP for privacy
    session_id TEXT, -- anonymous session tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_id ON analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_profile_id ON analytics_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_created ON analytics_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Workspace members can view their workspace analytics
CREATE POLICY "Workspace members can view analytics" ON analytics_events
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Service role can insert (for API tracking)
CREATE POLICY "Service role can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- ADMIN USERS TABLE (extends auth.users with admin metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
    permissions JSONB NOT NULL DEFAULT '{}', -- e.g., {"users": true, "workspaces": true, "billing": false, "analytics": true}
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- RLS - only admins can see admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin_users" ON admin_users
    FOR SELECT USING (
        id IN (SELECT id FROM admin_users)
    );

-- ============================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY, -- 'free', 'pro', 'enterprise'
    name TEXT NOT NULL,
    description TEXT,
    price_monthly_usd INTEGER NOT NULL DEFAULT 0, -- in cents
    price_yearly_usd INTEGER NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}', -- { posts_per_month: 12, profiles: 1, api_access: false, analytics_retention_days: 30, custom_domain: false, team_seats: 1 }
    limits JSONB NOT NULL DEFAULT '{}', -- hard limits for enforcement
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (id, name, description, price_monthly_usd, price_yearly_usd, features, limits, sort_order) VALUES
    ('free', 'Free', 'For solo founders getting started', 0, 0,
     '{"posts_per_month": 12, "profiles": 1, "api_access": false, "analytics_retention_days": 30, "custom_domain": false, "team_seats": 1, "ai_adaptations_per_month": 50, "media_uploads_per_month": 10}'::jsonb,
     '{"posts_per_month": 12, "profiles": 1, "api_access": false, "team_seats": 1}'::jsonb,
     0),
    ('pro', 'Pro', 'For growing creators and small teams', 2900, 29000,
     '{"posts_per_month": 100, "profiles": 3, "api_access": true, "analytics_retention_days": 365, "custom_domain": true, "team_seats": 5, "ai_adaptations_per_month": 500, "media_uploads_per_month": 100}'::jsonb,
     '{"posts_per_month": 100, "profiles": 3, "api_access": true, "team_seats": 5}'::jsonb,
     1),
    ('enterprise', 'Enterprise', 'For agencies and large teams', 9900, 99000,
     '{"posts_per_month": -1, "profiles": -1, "api_access": true, "analytics_retention_days": -1, "custom_domain": true, "team_seats": -1, "ai_adaptations_per_month": -1, "media_uploads_per_month": -1}'::jsonb,
     '{"posts_per_month": -1, "profiles": -1, "api_access": true, "team_seats": -1}'::jsonb,
     2)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly_usd = EXCLUDED.price_monthly_usd,
    price_yearly_usd = EXCLUDED.price_yearly_usd,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ============================================================
-- WORKSPACE PLAN SUBSCRIPTIONS (extends workspaces table)
-- ============================================================
-- Add columns to workspaces if not exist
DO $$
BEGIN
    -- plan column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'plan') THEN
        ALTER TABLE workspaces ADD COLUMN plan TEXT NOT NULL DEFAULT 'free' REFERENCES plans(id);
    END IF;

    -- plan_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'plan_status') THEN
        ALTER TABLE workspaces ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'past_due', 'canceled', 'trialing', 'paused'));
    END IF;

    -- plan_expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'plan_expires_at') THEN
        ALTER TABLE workspaces ADD COLUMN plan_expires_at TIMESTAMPTZ;
    END IF;

    -- stripe_customer_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE workspaces ADD COLUMN stripe_customer_id TEXT;
    END IF;

    -- stripe_subscription_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE workspaces ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    -- trial_ends_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE workspaces ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workspaces_plan ON workspaces(plan);
CREATE INDEX IF NOT EXISTS idx_workspaces_plan_status ON workspaces(plan_status);
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer ON workspaces(stripe_customer_id);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'impersonate', 'plan_change', 'user_suspend', 'workspace_delete', 'plan_create', etc.
    target_type TEXT NOT NULL, -- 'user', 'workspace', 'plan', 'analytics'
    target_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON admin_audit_log
    FOR SELECT USING (
        admin_user_id IN (SELECT id FROM admin_users)
    );

-- ============================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE analytics_events IS 'Event stream for profile views, link clicks, post performance, and user actions';
COMMENT ON COLUMN analytics_events.event_data IS 'Flexible JSON payload: link_type, link_url, post_id, platform, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term';
COMMENT ON COLUMN analytics_events.session_id IS 'Anonymous session ID for funnel analysis';
COMMENT ON COLUMN analytics_events.ip_hash IS 'SHA-256 hash of IP for privacy-compliant geolocation';

COMMENT ON TABLE admin_users IS 'Admin user metadata extending auth.users';
COMMENT ON COLUMN admin_users.permissions IS 'Granular permissions: {"users": true, "workspaces": true, "billing": false, "analytics": true, "impersonate": true}';

COMMENT ON TABLE plans IS 'Subscription plans with features and limits';
COMMENT ON COLUMN plans.features IS 'Marketing features displayed on pricing page';
COMMENT ON COLUMN plans.limits IS 'Hard limits enforced by application middleware';

COMMENT ON TABLE admin_audit_log IS 'Immutable audit trail for all admin actions';