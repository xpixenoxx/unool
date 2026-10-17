-- SignalDM: Enable Supabase Realtime on automation tables
-- This allows the dashboard UI to receive live updates when new comments
-- arrive, DMs are received, or items are flagged for review — without
-- manual page refresh.
--
-- NOTE: You must run this migration in the Supabase SQL Editor.
-- After running, enable Realtime for the project in Supabase Dashboard →
-- Database → Replication → supabase_realtime.

-- 1. Add the automation tables to the Realtime publication so
--    Supabase pushes INSERT/UPDATE events to connected browser clients.
ALTER PUBLICATION supabase_realtime ADD TABLE instagram_comment_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE instagram_flagged_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE instagram_dm_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE instagram_flagged_dms;
ALTER PUBLICATION supabase_realtime ADD TABLE instagram_reply_velocity;

-- 2. Enable REPLICA IDENTITY FULL on these tables so Supabase Realtime
--    can send the complete row data in change events (not just the PK).
ALTER TABLE instagram_comment_logs REPLICA IDENTITY FULL;
ALTER TABLE instagram_flagged_comments REPLICA IDENTITY FULL;
ALTER TABLE instagram_dm_logs REPLICA IDENTITY FULL;
ALTER TABLE instagram_flagged_dms REPLICA IDENTITY FULL;
