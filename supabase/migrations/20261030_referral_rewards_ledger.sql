-- Migration: referral_rewards ledger table
-- Tracks every credit grant from the referral program.
-- Created: 2026-10-30

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                      -- user who received the reward
    credits INTEGER NOT NULL DEFAULT 0,          -- AI credits granted
    reason TEXT NOT NULL,                        -- 'referral_signup' | 'referral_conversion'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_created ON referral_rewards(created_at DESC);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can see their own reward history
CREATE POLICY "Users can view own referral rewards" ON referral_rewards
    FOR SELECT USING (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "Service role full access to referral_rewards" ON referral_rewards
    FOR ALL USING (auth.role() = 'service_role');

