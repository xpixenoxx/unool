-- ============================================================================
-- Migration: 20261116000003_signal_analytics_foundation.sql
-- Purpose: Signal Analytics & Attribution Foundation
--   1. Add structured content telemetry columns on `posts` (`hook_type`,
--      `hook_formula_id`, `hook_score`, `word_count`, `has_media`,
--      `media_count`, `content_format`, `campaign_tag`) with safe backfill
--      deriving media metadata from `post_variants.media_urls`.
--   2. Add multi-account & engagement sync provenance columns on
--      `platform_posts` and `post_variants`.
--   3. Create `post_engagement_snapshots` table with RLS & composite indexes
--      to record historical metric checkpoints without overwriting history.
-- Idempotent & non-destructive: preserves all existing rows & columns.
-- ============================================================================

-- 1. Structured post telemetry columns on `public.posts`
ALTER TABLE IF EXISTS public.posts
  ADD COLUMN IF NOT EXISTS hook_type TEXT,
  ADD COLUMN IF NOT EXISTS hook_formula_id INTEGER,
  ADD COLUMN IF NOT EXISTS hook_score SMALLINT,
  ADD COLUMN IF NOT EXISTS word_count INTEGER,
  ADD COLUMN IF NOT EXISTS has_media BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS campaign_tag TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_workspace_created
  ON public.posts(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_workspace_published
  ON public.posts(workspace_id, published_at DESC)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_workspace_hook_type
  ON public.posts(workspace_id, hook_type)
  WHERE hook_type IS NOT NULL;

-- Safe idempotent backfill of word_count, has_media, media_count, and content_format.
-- Note: `media_urls` is stored on `public.post_variants`, not on `public.posts`.
DO $$
BEGIN
  WITH variant_media AS (
    SELECT
      pv.post_id,
      MAX(
        CASE
          WHEN pv.media_urls IS NOT NULL AND jsonb_typeof(pv.media_urls) = 'array'
            THEN jsonb_array_length(pv.media_urls)
          ELSE 0
        END
      ) AS max_media_count,
      BOOL_OR(
        CASE
          WHEN pv.media_urls IS NOT NULL AND jsonb_typeof(pv.media_urls) = 'array'
            THEN pv.media_urls::text ~* '"type"\s*:\s*"video"|\.(mp4|mov|webm)(\W|$)'
          ELSE false
        END
      ) AS has_video
    FROM public.post_variants AS pv
    GROUP BY pv.post_id
  ),
  computed AS (
    SELECT
      p.id,
      COALESCE(
        p.word_count,
        CASE
          WHEN p.content IS NULL OR btrim(p.content) = '' THEN 0
          ELSE COALESCE(array_length(regexp_split_to_array(btrim(p.content), '\s+'), 1), 0)
        END
      ) AS new_word_count,
      GREATEST(COALESCE(p.media_count, 0), COALESCE(vm.max_media_count, 0)) AS new_media_count,
      COALESCE(p.has_media, false) OR COALESCE(vm.max_media_count, 0) > 0 AS new_has_media,
      CASE
        WHEN p.content_format IS NOT NULL AND p.content_format <> 'text' THEN p.content_format
        WHEN COALESCE(vm.has_video, false) THEN 'video'
        WHEN COALESCE(vm.max_media_count, 0) > 1 THEN 'carousel'
        WHEN COALESCE(vm.max_media_count, 0) = 1 THEN 'image'
        ELSE 'text'
      END AS new_content_format
    FROM public.posts AS p
    LEFT JOIN variant_media AS vm ON vm.post_id = p.id
    WHERE p.word_count IS NULL
  )
  UPDATE public.posts AS p
  SET
    word_count = computed.new_word_count,
    media_count = computed.new_media_count,
    has_media = computed.new_has_media,
    content_format = computed.new_content_format
  FROM computed
  WHERE p.id = computed.id;
END $$;

-- 2. Multi-account & sync provenance columns on `public.post_variants` and `public.platform_posts`
ALTER TABLE IF EXISTS public.post_variants
  ADD COLUMN IF NOT EXISTS platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_post_variants_post_platform_connection
  ON public.post_variants(post_id, platform, platform_connection_id);

ALTER TABLE IF EXISTS public.platform_posts
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sync_error TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'platform_posts' AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE public.platform_posts
      DROP CONSTRAINT IF EXISTS platform_posts_sync_status_check;
    ALTER TABLE public.platform_posts
      ADD CONSTRAINT platform_posts_sync_status_check
      CHECK (sync_status IN ('pending', 'synced', 'unsupported', 'rate_limited', 'token_expired', 'error'));
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_platform_posts_sync_lookup
  ON public.platform_posts(sync_status, last_synced_at ASC NULLS FIRST);

CREATE INDEX IF NOT EXISTS idx_platform_posts_variant_id
  ON public.platform_posts(post_variant_id);

-- 3. Historical engagement snapshot log
CREATE TABLE IF NOT EXISTS public.post_engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform_post_id UUID NOT NULL REFERENCES public.platform_posts(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  views INTEGER,
  total_engagements INTEGER NOT NULL DEFAULT 0,
  raw_metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_post_eng_snapshots_workspace_time
  ON public.post_engagement_snapshots(workspace_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_eng_snapshots_platform_post_time
  ON public.post_engagement_snapshots(platform_post_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_eng_snapshots_ws_post_time
  ON public.post_engagement_snapshots(workspace_id, post_id, captured_at ASC);

ALTER TABLE public.post_engagement_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can view post engagement snapshots" ON public.post_engagement_snapshots;
CREATE POLICY "Workspace members can view post engagement snapshots"
  ON public.post_engagement_snapshots FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = (SELECT auth.uid())
      UNION
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role full access post engagement snapshots" ON public.post_engagement_snapshots;
CREATE POLICY "Service role full access post engagement snapshots"
  ON public.post_engagement_snapshots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
