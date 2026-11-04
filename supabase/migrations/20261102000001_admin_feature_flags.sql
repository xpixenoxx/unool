-- Admin Feature Flags Table
-- Controls global feature visibility for all users.
-- Managed exclusively by admins via the admin panel.

CREATE TABLE IF NOT EXISTS admin_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL UNIQUE,
  flag_value BOOLEAN NOT NULL DEFAULT true,
  label TEXT,
  description TEXT,
  updated_by TEXT,           -- admin user id or email
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the automation flag (enabled by default)
INSERT INTO admin_feature_flags (flag_key, flag_value, label, description)
VALUES (
  'automation_enabled',
  true,
  'Instagram & LinkedIn Automation',
  'Controls global visibility of Instagram and LinkedIn comment/DM automation, SignalDM, and brand page creation. When disabled, all traces of these features are hidden from users.'
)
ON CONFLICT (flag_key) DO NOTHING;

-- RLS: only service-role can write; public can read (feature flags are not secret)
ALTER TABLE admin_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_feature_flags"
  ON admin_feature_flags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read admin_feature_flags"
  ON admin_feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon reads so the public API endpoint can fetch without user auth
CREATE POLICY "Anon users can read admin_feature_flags"
  ON admin_feature_flags
  FOR SELECT
  TO anon
  USING (true);

