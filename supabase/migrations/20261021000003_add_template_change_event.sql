-- Migration: Add template_change event type to analytics_events
-- Created: 2026-10-21

-- Add template_change to the event_type CHECK constraint
ALTER TABLE analytics_events 
DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;

ALTER TABLE analytics_events 
ADD CONSTRAINT analytics_events_event_type_check 
CHECK (event_type IN (
    'profile_view',
    'link_click',
    'post_publish',
    'post_view',
    'profile_cta_click',
    'subdomain_claim',
    'template_change'
));
