-- ============================================================
-- SCHEDULING ENGINE — Automated Background Publishing with pg_cron & pg_net
-- Automatically triggers /api/cron/publish-scheduled every 2 minutes.
-- Keeps Scheduled posts publishing on time without requiring site visits.
-- ============================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Clean up any existing job with the same name before creating
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-posts') THEN
    PERFORM cron.unschedule('publish-scheduled-posts');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-pg-net-logs') THEN
    PERFORM cron.unschedule('cleanup-pg-net-logs');
  END IF;
END $$;

-- 3. Schedule automated publishing every 2 minutes
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/2 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://unool.co/api/cron/publish-scheduled',
    timeout_milliseconds := 30000
  );
  $$
);

-- 4. Schedule daily purge of http response logs to keep database lean and 100% within free tier
SELECT cron.schedule(
  'cleanup-pg-net-logs',
  '0 3 * * *',
  $$
  DELETE FROM net._http_response WHERE created < NOW() - INTERVAL '1 day';
  $$
);
