-- ============================================================
-- Migration: 20261113000002_facebook_threads_automation.sql
-- Adds Facebook Page and Threads comment automation tables
-- and automation configs for both platforms.
-- ============================================================

-- ── Facebook automation config ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.facebook_automation_config (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  page_id          text NOT NULL,                -- Facebook Page ID
  enabled          boolean NOT NULL DEFAULT true,
  auto_reply_comments boolean NOT NULL DEFAULT true,
  auto_hide_spam   boolean NOT NULL DEFAULT true,
  custom_instructions text,
  brand_persona    text,
  link_url         text,
  max_replies_per_hour int NOT NULL DEFAULT 20,
  jitter_min_seconds   int NOT NULL DEFAULT 20,
  jitter_max_seconds   int NOT NULL DEFAULT 90,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_fb_automation_config UNIQUE (workspace_id, page_id)
);

-- ── Facebook comment logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facebook_comment_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  page_id          text NOT NULL,
  comment_id       text NOT NULL,
  post_id          text NOT NULL,
  comment_text     text,
  commenter_id     text,
  commenter_name   text,
  classification   text,
  confidence       float,
  suggested_reply  text,
  reasoning        text,
  auto_replied     boolean NOT NULL DEFAULT false,
  delivery_status  text NOT NULL DEFAULT 'pending',
  flagged_for_review boolean NOT NULL DEFAULT false,
  reply_sent_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_fb_comment_logs_comment_id UNIQUE (comment_id)
);

-- ── Facebook DM (Messenger) logs ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.facebook_dm_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  page_id          text NOT NULL,
  message_id       text NOT NULL,
  sender_id        text NOT NULL,
  sender_name      text,
  message_text     text,
  classification   text,
  confidence       float,
  ai_reply         text,
  auto_replied     boolean NOT NULL DEFAULT false,
  delivery_status  text NOT NULL DEFAULT 'pending',
  escalated        boolean NOT NULL DEFAULT false,
  reply_sent_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_fb_dm_logs_message_id UNIQUE (message_id)
);

-- ── Facebook outbound jobs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facebook_outbound_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_type         text NOT NULL,   -- 'comment_reply' | 'messenger_reply'
  target_id        text NOT NULL,   -- comment_id or message_id
  status           text NOT NULL DEFAULT 'queued',
  retry_count      int NOT NULL DEFAULT 0,
  max_retries      int NOT NULL DEFAULT 3,
  last_error       text,
  payload          jsonb,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_fb_outbound_jobs UNIQUE (workspace_id, job_type, target_id)
);

-- ── Threads automation config ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.threads_automation_config (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  threads_user_id  text NOT NULL,
  enabled          boolean NOT NULL DEFAULT true,
  auto_reply_replies  boolean NOT NULL DEFAULT true,
  auto_reply_mentions boolean NOT NULL DEFAULT true,
  auto_hide_spam   boolean NOT NULL DEFAULT true,
  custom_instructions text,
  brand_persona    text,
  link_url         text,
  max_replies_per_hour int NOT NULL DEFAULT 20,
  jitter_min_seconds   int NOT NULL DEFAULT 20,
  jitter_max_seconds   int NOT NULL DEFAULT 90,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_threads_automation_config UNIQUE (workspace_id, threads_user_id)
);

-- ── Threads reply logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.threads_reply_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  threads_user_id  text NOT NULL,
  reply_id         text NOT NULL,     -- the inbound reply/mention Threads ID
  post_id          text,              -- parent post Threads ID
  reply_text       text,
  replier_id       text,
  event_type       text NOT NULL DEFAULT 'reply',   -- 'reply' | 'mention'
  classification   text,
  confidence       float,
  suggested_reply  text,
  reasoning        text,
  auto_replied     boolean NOT NULL DEFAULT false,
  delivery_status  text NOT NULL DEFAULT 'pending',
  reply_sent_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_threads_reply_logs_reply_id UNIQUE (reply_id)
);

-- ── Threads outbound jobs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.threads_outbound_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_type         text NOT NULL,   -- 'reply'
  target_id        text NOT NULL,   -- reply_id or mention_id
  status           text NOT NULL DEFAULT 'queued',
  retry_count      int NOT NULL DEFAULT 0,
  max_retries      int NOT NULL DEFAULT 3,
  last_error       text,
  payload          jsonb,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_threads_outbound_jobs UNIQUE (workspace_id, job_type, target_id)
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fb_comment_logs_workspace ON facebook_comment_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fb_comment_logs_page ON facebook_comment_logs(page_id);
CREATE INDEX IF NOT EXISTS idx_fb_dm_logs_workspace ON facebook_dm_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fb_outbound_jobs_status ON facebook_outbound_jobs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_threads_reply_logs_workspace ON threads_reply_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_threads_outbound_jobs_status ON threads_outbound_jobs(workspace_id, status);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE facebook_automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_comment_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_dm_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_outbound_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads_automation_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads_reply_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads_outbound_jobs      ENABLE ROW LEVEL SECURITY;

-- Workspace owner + members get full access
CREATE POLICY "workspace_access_fb_config"
  ON facebook_automation_config FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access_fb_comment_logs"
  ON facebook_comment_logs FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access_fb_dm_logs"
  ON facebook_dm_logs FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access_fb_outbound_jobs"
  ON facebook_outbound_jobs FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access_threads_config"
  ON threads_automation_config FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access_threads_reply_logs"
  ON threads_reply_logs FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access_threads_outbound_jobs"
  ON threads_outbound_jobs FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

