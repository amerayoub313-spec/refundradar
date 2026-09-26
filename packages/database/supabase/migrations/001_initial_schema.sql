-- Migration: 001_initial_schema.sql
-- Description: Initial schema for RefundRadar
-- Created: 2024-01-15

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DEVELOPERS TABLE
-- ============================================================================
CREATE TABLE developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_developers_email ON developers(email);
CREATE INDEX idx_developers_is_active ON developers(is_active);

-- ============================================================================
-- REVENUECAT_CREDENTIALS TABLE
-- ============================================================================
CREATE TABLE revenuecat_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    api_key_encrypted TEXT NOT NULL,
    webhook_secret_encrypted TEXT NOT NULL,
    api_key_prefix TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_valid BOOLEAN NOT NULL DEFAULT FALSE,
    last_validated_at TIMESTAMPTZ,
    
    CONSTRAINT unique_developer_credential UNIQUE (developer_id)
);

CREATE INDEX idx_revenuecat_creds_developer ON revenuecat_credentials(developer_id);
CREATE INDEX idx_revenuecat_creds_valid ON revenuecat_credentials(is_valid);

-- ============================================================================
-- APPS TABLE
-- ============================================================================
CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    revenuecat_app_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'stripe', 'web')),
    bundle_identifier TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_developer ON apps(developer_id);
CREATE INDEX idx_apps_revenuecat_app_id ON apps(revenuecat_app_id);
CREATE INDEX idx_apps_is_active ON apps(is_active);

-- ============================================================================
-- REFUND_EVENTS TABLE
-- ============================================================================
CREATE TABLE refund_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    revenuecat_event_id TEXT UNIQUE NOT NULL,
    app_user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    entitlement_id TEXT,
    price_usd DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    purchased_at TIMESTAMPTZ NOT NULL,
    refunded_at TIMESTAMPTZ NOT NULL,
    refund_reason TEXT,
    store TEXT NOT NULL CHECK (store IN ('app_store', 'play_store', 'stripe', 'amazon')),
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refund_events_app_id ON refund_events(app_id);
CREATE INDEX idx_refund_events_app_user_id ON refund_events(app_user_id);
CREATE INDEX idx_refund_events_refunded_at ON refund_events(refunded_at DESC);
CREATE INDEX idx_refund_events_revenuecat_event_id ON refund_events(revenuecat_event_id);
CREATE INDEX idx_refund_events_created_at ON refund_events(created_at DESC);

-- ============================================================================
-- RISK_SCORES TABLE
-- ============================================================================
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_event_id UUID NOT NULL REFERENCES refund_events(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    duration_score INTEGER NOT NULL CHECK (duration_score BETWEEN 0 AND 35),
    frequency_score INTEGER NOT NULL CHECK (frequency_score BETWEEN 0 AND 30),
    billing_cycle_score INTEGER NOT NULL CHECK (billing_cycle_score BETWEEN 0 AND 20),
    product_type_score INTEGER NOT NULL CHECK (product_type_score BETWEEN 0 AND 15),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('green', 'yellow', 'red')),
    factor_details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_refund_event_score UNIQUE (refund_event_id)
);

CREATE INDEX idx_risk_scores_app_id ON risk_scores(app_id);
CREATE INDEX idx_risk_scores_risk_level ON risk_scores(risk_level);
CREATE INDEX idx_risk_scores_total_score ON risk_scores(total_score DESC);
CREATE INDEX idx_risk_scores_created_at ON risk_scores(created_at DESC);

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    risk_score_id UUID NOT NULL REFERENCES risk_scores(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dismissed', 'revoked')),
    email_sent_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_sent_status IN ('pending', 'sent', 'failed')),
    acknowledged_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES developers(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_app_id ON alerts(app_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_risk_score_id ON alerts(risk_score_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================================================
-- ENTITLEMENT_REVOCATIONS TABLE
-- ============================================================================
CREATE TABLE entitlement_revocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    app_user_id TEXT NOT NULL,
    entitlement_id TEXT NOT NULL,
    revenuecat_response JSONB,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entitlement_revocations_alert_id ON entitlement_revocations(alert_id);
CREATE INDEX idx_entitlement_revocations_app_id ON entitlement_revocations(app_id);
CREATE INDEX idx_entitlement_revocations_developer_id ON entitlement_revocations(developer_id);
CREATE INDEX idx_entitlement_revocations_executed_at ON entitlement_revocations(executed_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenuecat_creds_updated_at BEFORE UPDATE ON revenuecat_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATA RETENTION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION prune_old_refund_events(retention_days INT DEFAULT 90)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM refund_events 
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
END;
$$;

-- ============================================================================
-- GDPR: RIGHT TO ERASURE FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_user_data(app_user_id_param TEXT, app_id_param UUID)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    deleted_counts JSONB;
    refund_count INT;
    score_count INT;
    alert_count INT;
BEGIN
    -- Delete refund events (cascades to risk_scores, alerts, revocations)
    DELETE FROM refund_events 
    WHERE app_user_id = app_user_id_param AND app_id = app_id_param
    RETURNING 1 INTO refund_count;
    
    GET DIAGNOSTICS refund_count = ROW_COUNT;
    
    deleted_counts = jsonb_build_object(
        'deleted_refund_events', refund_count,
        'deleted_risk_scores', refund_count, -- 1:1 with refund_events
        'deleted_alerts', (
            SELECT COUNT(*) FROM alerts a
            JOIN risk_scores rs ON a.risk_score_id = rs.id
            JOIN refund_events re ON rs.refund_event_id = re.id
            WHERE re.app_user_id = app_user_id_param AND re.app_id = app_id_param
        )
    );
    
    RETURN deleted_counts;
END;
$$;