-- ============================================================================
-- Migration: 20261121000001_expand_posts_hook_type_check.sql
-- Purpose: Expand `posts_hook_type_check` on `public.posts` to allow all 8
--          HookType classifications produced by `lib/analytics/postTelemetry.ts`
--          ('question', 'number', 'contrarian', 'story', 'howto', 'curiosity',
--          'direct', 'statement') in addition to legacy 'statistic'.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'hook_type'
  ) THEN
    ALTER TABLE public.posts
      DROP CONSTRAINT IF EXISTS posts_hook_type_check;
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_hook_type_check
      CHECK (
        hook_type IS NULL OR hook_type IN (
          'question',
          'number',
          'contrarian',
          'story',
          'howto',
          'curiosity',
          'direct',
          'statement',
          'statistic'
        )
      );
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
