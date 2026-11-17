-- ============================================================================
-- Migration: 20261116000001_settings_security_rls_and_tables.sql
-- Purpose:
--   1. Fix tautological and over-permissive RLS policies on api_keys,
--      analytics_events, admin_users, admin_audit_log, workspace_members,
--      platform_connections, subscriptions, and payment_orders.
--   2. Add public.users.security_version for global session & switch-token revocation.
--   3. Create private.is_workspace_member() helper to prevent recursive RLS.
--   4. Create public.user_credentials (RLS deny-all except service_role) for
--      migrating password_hash out of auth.users.user_metadata.
--   5. Create public.user_preferences and public.workspace_security_events.
--   6. Seed admin_feature_flags.public_api_enabled = false.
--   7. Normalize workspaces.plan default from legacy 'free' to 'spark'.
--
-- HIGH-STAKES REVIEW NOTE:
--   Do not run in production until founder/DBA verifies:
--   (a) Existing plans table contains id = 'spark' before re-pointing workspaces FK.
--   (b) public.handle_new_user() trigger body in live DB inserts 'spark' (if still
--       inserting 'free', update inside transaction after inspecting pg_get_functiondef).
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id = p_workspace_id
      AND w.owner_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = (SELECT auth.uid())
      AND COALESCE(wm.status, 'active') = 'active'
  );
$$;

REVOKE ALL ON FUNCTION private.is_workspace_member(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_workspace_member(uuid) TO authenticated, service_role;

-- ── 1. Fix broken RLS on api_keys (if table exists) ─────────────────────────
DO $$
BEGIN
  IF to_regclass('public.api_keys') IS NOT NULL THEN
    ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view workspace API keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Users can create workspace API keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Users can revoke workspace API keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Service role full access api_keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Workspace admins manage api_keys" ON public.api_keys;

    CREATE POLICY "Service role full access api_keys"
      ON public.api_keys FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Workspace admins manage api_keys"
      ON public.api_keys FOR ALL
      TO authenticated
      USING (
        workspace_id IN (
          SELECT w.id FROM public.workspaces w WHERE w.owner_id = (SELECT auth.uid())
          UNION
          SELECT wm.workspace_id
          FROM public.workspace_members wm
          WHERE wm.user_id = (SELECT auth.uid())
            AND COALESCE(wm.status, 'active') = 'active'
            AND lower(COALESCE(wm.role, '')) IN ('owner', 'admin')
        )
      )
      WITH CHECK (
        workspace_id IN (
          SELECT w.id FROM public.workspaces w WHERE w.owner_id = (SELECT auth.uid())
          UNION
          SELECT wm.workspace_id
          FROM public.workspace_members wm
          WHERE wm.user_id = (SELECT auth.uid())
            AND COALESCE(wm.status, 'active') = 'active'
            AND lower(COALESCE(wm.role, '')) IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- ── 2. Harden admin_users and admin_audit_log ───────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.admin_users FROM PUBLIC, anon, authenticated;

    DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
    DROP POLICY IF EXISTS "Service role only" ON public.admin_users;

    CREATE POLICY "Service role only"
      ON public.admin_users FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF to_regclass('public.admin_audit_log') IS NOT NULL THEN
    ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.admin_audit_log FROM PUBLIC, anon, authenticated;

    DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
    DROP POLICY IF EXISTS "Service role only" ON public.admin_audit_log;

    CREATE POLICY "Service role only"
      ON public.admin_audit_log FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── 3. Harden analytics_events RLS ──────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can insert analytics" ON public.analytics_events;
    DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics_events;
    DROP POLICY IF EXISTS "Workspace members can view analytics" ON public.analytics_events;

    CREATE POLICY "Service role can manage analytics"
      ON public.analytics_events FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Workspace members can view analytics"
      ON public.analytics_events FOR SELECT
      TO authenticated
      USING ((SELECT private.is_workspace_member(workspace_id)));
  END IF;
END $$;

-- ── 4. Fix asymmetric workspace_members / platform_connections / billing RLS ─
DO $$
BEGIN
  IF to_regclass('public.workspace_members') IS NOT NULL THEN
    ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
    DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
    DROP POLICY IF EXISTS "Members can view workspace_members" ON public.workspace_members;
    DROP POLICY IF EXISTS "Owners can manage members" ON public.workspace_members;
    DROP POLICY IF EXISTS "Owners can manage workspace_members" ON public.workspace_members;
    DROP POLICY IF EXISTS "Service role full access workspace_members" ON public.workspace_members;
    DROP POLICY IF EXISTS "Active members read workspace_members" ON public.workspace_members;

    CREATE POLICY "Service role full access workspace_members"
      ON public.workspace_members FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Active members read workspace_members"
      ON public.workspace_members FOR SELECT
      TO authenticated
      USING (
        user_id = (SELECT auth.uid())
        OR (SELECT private.is_workspace_member(workspace_id))
      );
  END IF;

  IF to_regclass('public.platform_connections') IS NOT NULL THEN
    ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage their own platform connections" ON public.platform_connections;
    DROP POLICY IF EXISTS "Service role full access platform_connections" ON public.platform_connections;
    DROP POLICY IF EXISTS "Workspace members manage platform_connections" ON public.platform_connections;

    CREATE POLICY "Service role full access platform_connections"
      ON public.platform_connections FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Workspace members manage platform_connections"
      ON public.platform_connections FOR ALL
      TO authenticated
      USING ((SELECT private.is_workspace_member(workspace_id)))
      WITH CHECK ((SELECT private.is_workspace_member(workspace_id)));
  END IF;

  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
    DROP POLICY IF EXISTS "Service role full access to subscriptions" ON public.subscriptions;
    DROP POLICY IF EXISTS "Workspace members view subscriptions" ON public.subscriptions;

    CREATE POLICY "Service role full access to subscriptions"
      ON public.subscriptions FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Workspace members view subscriptions"
      ON public.subscriptions FOR SELECT
      TO authenticated
      USING ((SELECT private.is_workspace_member(workspace_id)));
  END IF;

  IF to_regclass('public.payment_orders') IS NOT NULL THEN
    ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own payment orders" ON public.payment_orders;
    DROP POLICY IF EXISTS "Service role full access to payment orders" ON public.payment_orders;
    DROP POLICY IF EXISTS "Workspace members view payment orders" ON public.payment_orders;

    CREATE POLICY "Service role full access to payment orders"
      ON public.payment_orders FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Workspace members view payment orders"
      ON public.payment_orders FOR SELECT
      TO authenticated
      USING ((SELECT private.is_workspace_member(workspace_id)));
  END IF;
END $$;

-- ── 5. Add public.users.security_version ────────────────────────────────────
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS security_version INTEGER NOT NULL DEFAULT 0;

-- ── 6. Dedicated user_credentials table (no client RLS access) ──────────────
CREATE TABLE IF NOT EXISTS public.user_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_credentials FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Service role full access user_credentials" ON public.user_credentials;
CREATE POLICY "Service role full access user_credentials"
  ON public.user_credentials FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 7. Per-user settings & notification preferences table ───────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('system', 'light', 'dark')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  currency_display TEXT NOT NULL DEFAULT 'INR' CHECK (currency_display IN ('INR', 'USD')),
  digest_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (digest_frequency IN ('daily', 'weekly', 'never')),
  notify_token_expiry BOOLEAN NOT NULL DEFAULT true,
  notify_security_alerts BOOLEAN NOT NULL DEFAULT true,
  notify_publishing BOOLEAN NOT NULL DEFAULT true,
  ai_personalization_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS time_format TEXT NOT NULL DEFAULT '12h',
  ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS currency_display TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_preferences FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated, service_role;

DROP POLICY IF EXISTS "Users manage own user_preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Service role full access user_preferences" ON public.user_preferences;

CREATE POLICY "Users manage own user_preferences"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role full access user_preferences"
  ON public.user_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 8. Workspace security audit trail table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_user_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ws_sec_events_workspace_created
  ON public.workspace_security_events(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ws_sec_events_actor_created
  ON public.workspace_security_events(actor_user_id, created_at DESC);

ALTER TABLE public.workspace_security_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workspace_security_events FROM PUBLIC, anon;
GRANT SELECT ON public.workspace_security_events TO authenticated;
GRANT ALL ON public.workspace_security_events TO service_role;

DROP POLICY IF EXISTS "Service role full access workspace_security_events" ON public.workspace_security_events;
DROP POLICY IF EXISTS "Workspace admins view security events" ON public.workspace_security_events;

CREATE POLICY "Service role full access workspace_security_events"
  ON public.workspace_security_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Workspace admins view security events"
  ON public.workspace_security_events FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id FROM public.workspaces w WHERE w.owner_id = (SELECT auth.uid())
      UNION
      SELECT wm.workspace_id
      FROM public.workspace_members wm
      WHERE wm.user_id = (SELECT auth.uid())
        AND COALESCE(wm.status, 'active') = 'active'
        AND lower(COALESCE(wm.role, '')) IN ('owner', 'admin')
    )
  );

-- ── 9. Ensure admin_feature_flags exists & seed public_api_enabled = false ──
CREATE TABLE IF NOT EXISTS public.admin_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL UNIQUE,
  flag_value BOOLEAN NOT NULL DEFAULT true,
  label TEXT,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on admin_feature_flags" ON public.admin_feature_flags;
DROP POLICY IF EXISTS "Authenticated users can read admin_feature_flags" ON public.admin_feature_flags;
DROP POLICY IF EXISTS "Anon users can read admin_feature_flags" ON public.admin_feature_flags;

CREATE POLICY "Service role full access on admin_feature_flags"
  ON public.admin_feature_flags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read admin_feature_flags"
  ON public.admin_feature_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can read admin_feature_flags"
  ON public.admin_feature_flags FOR SELECT
  TO anon
  USING (true);

INSERT INTO public.admin_feature_flags (flag_key, flag_value, label, description)
VALUES (
  'automation_enabled',
  true,
  'Instagram & LinkedIn Automation',
  'Controls global visibility of Instagram and LinkedIn comment/DM automation, SignalDM, and brand page creation.'
)
ON CONFLICT (flag_key) DO NOTHING;

INSERT INTO public.admin_feature_flags (flag_key, flag_value, label, description)
VALUES (
  'public_api_enabled',
  false,
  'Public Developer API Keys & Webhooks',
  'Controls availability of public API key generation and /api/keys endpoints. Keep disabled until /api/v1 and webhook delivery ship.'
)
ON CONFLICT (flag_key) DO NOTHING;

-- ── 10. Normalize legacy 'free' workspace plan & harden handle_new_user() ───
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.plans WHERE id = 'spark') THEN
    ALTER TABLE IF EXISTS public.workspaces
      ALTER COLUMN plan SET DEFAULT 'spark';

    UPDATE public.workspaces
    SET plan = 'spark',
        updated_at = now()
    WHERE plan = 'free';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
  VALUES (gen_random_uuid(), 'My Workspace', NEW.id, 'spark', '{}'::jsonb)
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
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- ROLLBACK:
--   DROP TABLE IF EXISTS public.workspace_security_events;
--   DROP TABLE IF EXISTS public.user_preferences;
--   DROP TABLE IF EXISTS public.user_credentials;
--   ALTER TABLE IF EXISTS public.users DROP COLUMN IF EXISTS security_version;
--   DELETE FROM public.admin_feature_flags WHERE flag_key = 'public_api_enabled';
--   DROP FUNCTION IF EXISTS private.is_workspace_member(uuid);
--   DROP SCHEMA IF EXISTS private;
-- ============================================================================