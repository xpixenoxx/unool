-- Profile Blueprint Schema Migration
-- Adds custom domain columns, opt-in contact metadata, lead capture table,
-- private/unlisted visibility support, deleted_at RLS enforcement, and atomic analytics RPC.

-- 1. Widen visibility CHECK constraint on profiles to support public / private / unlisted
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_visibility_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_visibility_check
  CHECK (visibility IN ('public', 'private', 'unlisted'));

-- 2. Ensure core soft-delete / studio columns exist before indexes or RLS reference them,
--    and add first-class profile contact, domain, location, and SEO columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS studio_profile JSONB DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_badge TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_handles JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seo JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain_verification_token TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON profiles (deleted_at)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_custom_domain_active_unique
  ON profiles (lower(custom_domain))
  WHERE custom_domain IS NOT NULL AND deleted_at IS NULL;

-- 3. Tighten public RLS policy on profiles: remove wide-open anon SELECT policy
--    (public rendering goes through service_role API/SSR paths with sanitized fields),
--    leaving workspace member access + allowlisted viewer access on active profiles.
DROP POLICY IF EXISTS "Public profiles are readable by all" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Allowlisted viewers can view permitted profiles" ON profiles;
CREATE POLICY "Allowlisted viewers can view permitted profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      id IN (
        SELECT profile_id FROM profile_viewers WHERE user_id = (select auth.uid())
      )
    )
  );

-- 4. Direct Lead / Contact capture table
CREATE TABLE IF NOT EXISTS profile_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hash TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_leads_profile_id ON profile_leads(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_leads_workspace_id ON profile_leads(workspace_id, created_at DESC);

ALTER TABLE profile_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can view their profile leads" ON profile_leads;
CREATE POLICY "Workspace members can view their profile leads" ON profile_leads
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid())
    )
  );

-- 5. Allow profile_contact_lead events in analytics_events
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN (
    'profile_view',
    'link_click',
    'post_publish',
    'post_view',
    'profile_cta_click',
    'subdomain_claim',
    'template_change',
    'profile_contact_lead'
  ));

-- 6. Atomic single-query analytics aggregation RPC (avoids 10k row caps and double-counting)
CREATE OR REPLACE FUNCTION public.get_profile_analytics(
  p_workspace_id UUID,
  p_profile_id UUID DEFAULT NULL,
  p_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_since TIMESTAMPTZ := NOW() - make_interval(days => GREATEST(1, LEAST(p_days, 365)));
  v_total_views BIGINT := 0;
  v_unique_visitors BIGINT := 0;
  v_link_clicks BIGINT := 0;
  v_cta_clicks BIGINT := 0;
  v_top_links JSONB := '[]'::jsonb;
  v_top_referrers JSONB := '[]'::jsonb;
  v_daily JSONB := '[]'::jsonb;
  v_templates JSONB := '[]'::jsonb;
BEGIN
  IF COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), current_user) NOT IN ('service_role', 'postgres', 'supabase_admin')
     AND NOT EXISTS (
       SELECT 1 FROM workspace_members
       WHERE workspace_id = p_workspace_id AND user_id = (select auth.uid())
     ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE event_type = 'profile_view'),
    COUNT(DISTINCT COALESCE(session_id, ip_hash, id::text)) FILTER (WHERE event_type = 'profile_view'),
    COUNT(*) FILTER (WHERE event_type = 'link_click'),
    COUNT(*) FILTER (WHERE event_type = 'profile_cta_click')
  INTO v_total_views, v_unique_visitors, v_link_clicks, v_cta_clicks
  FROM analytics_events
  WHERE workspace_id = p_workspace_id
    AND (p_profile_id IS NULL OR profile_id = p_profile_id OR profile_id IS NULL)
    AND created_at >= v_since;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_links
  FROM (
    SELECT
      COALESCE(event_data->>'link_text', 'Link') AS label,
      COALESCE(event_data->>'link_url', '') AS url,
      COUNT(*)::INT AS clicks
    FROM analytics_events
    WHERE workspace_id = p_workspace_id
      AND (p_profile_id IS NULL OR profile_id = p_profile_id OR profile_id IS NULL)
      AND event_type = 'link_click'
      AND created_at >= v_since
    GROUP BY 1, 2
    ORDER BY clicks DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb) INTO v_top_referrers
  FROM (
    SELECT
      COALESCE(NULLIF(LOWER(TRIM(referrer)), ''), 'direct') AS source,
      COUNT(*)::INT AS visits
    FROM analytics_events
    WHERE workspace_id = p_workspace_id
      AND (p_profile_id IS NULL OR profile_id = p_profile_id OR profile_id IS NULL)
      AND event_type = 'profile_view'
      AND created_at >= v_since
    GROUP BY 1
    ORDER BY visits DESC
    LIMIT 10
  ) r;

  SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.date ASC), '[]'::jsonb) INTO v_daily
  FROM (
    SELECT
      TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
      COUNT(*) FILTER (WHERE event_type = 'profile_view')::INT AS views,
      COUNT(*) FILTER (WHERE event_type IN ('link_click', 'profile_cta_click'))::INT AS clicks
    FROM analytics_events
    WHERE workspace_id = p_workspace_id
      AND (p_profile_id IS NULL OR profile_id = p_profile_id OR profile_id IS NULL)
      AND created_at >= v_since
    GROUP BY 1
  ) d;

  SELECT COALESCE(jsonb_agg(row_to_json(tp)), '[]'::jsonb) INTO v_templates
  FROM (
    SELECT
      COALESCE(NULLIF(event_data->>'template', ''), 'unknown') AS "templateId",
      COUNT(*) FILTER (WHERE event_type = 'profile_view')::INT AS views,
      COUNT(*) FILTER (WHERE event_type IN ('link_click', 'profile_cta_click'))::INT AS clicks
    FROM analytics_events
    WHERE workspace_id = p_workspace_id
      AND (p_profile_id IS NULL OR profile_id = p_profile_id OR profile_id IS NULL)
      AND event_type IN ('profile_view', 'link_click', 'profile_cta_click')
      AND created_at >= v_since
    GROUP BY 1
    ORDER BY views DESC, clicks DESC
  ) tp;

  RETURN jsonb_build_object(
    'totalViews', v_total_views,
    'uniqueVisitors', v_unique_visitors,
    'linkClicks', v_link_clicks,
    'ctaClicks', v_cta_clicks,
    'topLinks', v_top_links,
    'topReferrers', v_top_referrers,
    'viewsOverTime', v_daily,
    'templateUsage', v_templates
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_analytics(UUID, UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_analytics(UUID, UUID, INT) TO service_role;

