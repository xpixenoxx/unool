-- ============================================================
-- Phase 2: Follow-to-Unlock Gates + Referral System
-- Created: 2026-10-23
-- ============================================================

-- ── Follow Gates ────────────────────────────────────────────────────────────────
-- Creator configures a gate: locked_content behind follow requirement
CREATE TABLE IF NOT EXISTS follow_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    -- The IG account they must follow (the creator's IG username)
    ig_username TEXT NOT NULL,
    ig_user_id TEXT NOT NULL,
    -- What gets unlocked (flexible JSONB — link, file, coupon, message, etc.)
    unlocked_content JSONB NOT NULL DEFAULT '{}',
    -- Gate appearance
    cta_text TEXT NOT NULL DEFAULT 'Follow to unlock',
    thumbnail_url TEXT,
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Tracking
    view_count INTEGER NOT NULL DEFAULT 0,
    unlock_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Follow Gate Sessions ─────────────────────────────────────────────────────────
-- Tracks visitor sessions: did they follow? when? proof.
CREATE TABLE IF NOT EXISTS follow_gate_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_id UUID NOT NULL REFERENCES follow_gates(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    -- The visitor's IG user id (after they authenticate via IG)
    visitor_ig_user_id TEXT,
    visitor_ig_username TEXT,
    -- Follow verification
    follow_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    verification_method TEXT CHECK (verification_method IN ('webhook', 'polling', 'manual')),
    -- Session token given to browser to poll/unlock
    session_token TEXT UNIQUE NOT NULL,
    -- Expiry (sessions expire after 30 min if not verified)
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── referral_codes ──────────────────────────────────────────────────────────────
-- One stable referral code per user
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    workspace_id UUID NOT NULL,
    code TEXT NOT NULL UNIQUE,
    click_count INTEGER NOT NULL DEFAULT 0,
    signup_count INTEGER NOT NULL DEFAULT 0,
    conversion_count INTEGER NOT NULL DEFAULT 0,
    rewards_earned INTEGER NOT NULL DEFAULT 0,
    months_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_follow_gates_workspace ON follow_gates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_follow_gates_active ON follow_gates(workspace_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_follow_gates_ig_user ON follow_gates(ig_user_id);

CREATE INDEX IF NOT EXISTS idx_follow_gate_sessions_gate ON follow_gate_sessions(gate_id);
CREATE INDEX IF NOT EXISTS idx_follow_gate_sessions_token ON follow_gate_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_follow_gate_sessions_visitor ON follow_gate_sessions(visitor_ig_user_id);
CREATE INDEX IF NOT EXISTS idx_follow_gate_sessions_workspace ON follow_gate_sessions(workspace_id);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_workspace ON referral_codes(workspace_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE follow_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view own gates" ON follow_gates
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Workspace members can insert gates" ON follow_gates
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Workspace members can update gates" ON follow_gates
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Workspace members can delete gates" ON follow_gates
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Service role full access to follow_gates" ON follow_gates
    FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE follow_gate_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to follow_gate_sessions" ON follow_gate_sessions
    FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON referral_codes
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access to referral_codes" ON referral_codes
    FOR ALL USING (auth.role() = 'service_role');
