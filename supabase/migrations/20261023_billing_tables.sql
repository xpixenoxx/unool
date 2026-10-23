-- ============================================================
-- Billing tables for Cashfree Payment Gateway
-- Created: 2026-10-23
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Payment Orders ──────────────────────────────────────────────
-- Every payment attempt is recorded here.
-- Status transitions: PENDING → PAID / FAILED / EXPIRED / REFUNDED
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    cf_order_id TEXT UNIQUE NOT NULL,
    plan_id TEXT NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
    amount_paise INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED')),
    cf_payment_id TEXT,
    payment_method TEXT,
    payment_session_id TEXT,
    idempotency_key TEXT UNIQUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ───────────────────────────────────────────────
-- One active subscription per workspace (UNIQUE constraint).
-- Status transitions: created → authorized → active → past_due/paused/cancelled/expired
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    cf_subscription_id TEXT UNIQUE,
    plan_id TEXT NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
    status TEXT NOT NULL DEFAULT 'created'
        CHECK (status IN ('created', 'authorized', 'active', 'past_due',
                          'paused', 'cancelled', 'expired')),
    amount_paise INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    payment_method TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Webhook Events ──────────────────────────────────────────────
-- Idempotency table: UNIQUE on cf_payment_id prevents double-processing.
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cf_payment_id TEXT UNIQUE NOT NULL,
    order_id TEXT,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Referrals ───────────────────────────────────────────────────
-- Tracks referral program: who referred whom, status, and rewards.
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL,
    referred_user_id UUID UNIQUE NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'signed_up'
        CHECK (status IN ('signed_up', 'converted', 'rewarded')),
    reward_type TEXT,
    reward_applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────

-- Payment orders: lookup by workspace, filter pending orders, idempotency check
CREATE INDEX IF NOT EXISTS idx_payment_orders_workspace ON payment_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_payment_orders_idempotency ON payment_orders(idempotency_key);

-- Subscriptions: lookup by workspace and filter by status
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Webhook events: fast duplicate check
CREATE INDEX IF NOT EXISTS idx_webhook_events_cf_payment ON webhook_events(cf_payment_id);

-- Referrals: lookup by code and by referrer
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);

-- ── RLS (Row Level Security) ────────────────────────────────────

-- Payment orders: users can only see their own orders
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment orders" ON payment_orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role full access to payment orders" ON payment_orders
    FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions: users can only see their workspace subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role full access to subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Webhook events: service role only
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to webhook events" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- Referrals: users can see their own referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Service role full access to referrals" ON referrals
    FOR ALL USING (auth.role() = 'service_role');

-- ── Add plan_expires_at to workspaces if not exists ─────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workspaces' AND column_name = 'plan_expires_at'
    ) THEN
        ALTER TABLE workspaces ADD COLUMN plan_expires_at TIMESTAMPTZ;
    END IF;
END $$;
