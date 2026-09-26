-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for multi-tenancy
-- Created: 2024-01-15

-- Enable RLS on all tables
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenuecat_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_revocations ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current developer ID from auth.uid()
-- This works with Supabase Auth where auth.uid() returns the user's UUID
CREATE OR REPLACE FUNCTION current_developer_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT auth.uid()::UUID;
$$;

-- ============================================================================
-- DEVELOPERS POLICIES
-- ============================================================================
-- Users can only see their own developer record
CREATE POLICY "developers_select_own" ON developers
    FOR SELECT USING (id = current_developer_id());

CREATE POLICY "developers_update_own" ON developers
    FOR UPDATE USING (id = current_developer_id())
    WITH CHECK (id = current_developer_id());

-- ============================================================================
-- REVENUECAT_CREDENTIALS POLICIES
-- ============================================================================
-- Only owning developer can manage their credentials
CREATE POLICY "creds_select_own" ON revenuecat_credentials
    FOR SELECT USING (developer_id = current_developer_id());

CREATE POLICY "creds_insert_own" ON revenuecat_credentials
    FOR INSERT WITH CHECK (developer_id = current_developer_id());

CREATE POLICY "creds_update_own" ON revenuecat_credentials
    FOR UPDATE USING (developer_id = current_developer_id())
    WITH CHECK (developer_id = current_developer_id());

CREATE POLICY "creds_delete_own" ON revenuecat_credentials
    FOR DELETE USING (developer_id = current_developer_id());

-- ============================================================================
-- APPS POLICIES
-- ============================================================================
-- Only apps owned by developer
CREATE POLICY "apps_select_own" ON apps
    FOR SELECT USING (developer_id = current_developer_id());

CREATE POLICY "apps_insert_own" ON apps
    FOR INSERT WITH CHECK (developer_id = current_developer_id());

CREATE POLICY "apps_update_own" ON apps
    FOR UPDATE USING (developer_id = current_developer_id())
    WITH CHECK (developer_id = current_developer_id());

CREATE POLICY "apps_delete_own" ON apps
    FOR DELETE USING (developer_id = current_developer_id());

-- ============================================================================
-- REFUND_EVENTS POLICIES
-- ============================================================================
-- Only events for developer's apps
CREATE POLICY "refund_events_select_own" ON refund_events
    FOR SELECT USING (
        app_id IN (SELECT id FROM apps WHERE developer_id = current_developer_id())
    );

-- Service role (Cloudflare Worker) needs INSERT for webhook ingestion
-- This is handled by using service_role key in the Worker, which bypasses RLS

-- ============================================================================
-- RISK_SCORES POLICIES
-- ============================================================================
-- Only scores for developer's apps
CREATE POLICY "risk_scores_select_own" ON risk_scores
    FOR SELECT USING (
        app_id IN (SELECT id FROM apps WHERE developer_id = current_developer_id())
    );

-- ============================================================================
-- ALERTS POLICIES
-- ============================================================================
-- Only alerts for developer's apps
CREATE POLICY "alerts_select_own" ON alerts
    FOR SELECT USING (
        app_id IN (SELECT id FROM apps WHERE developer_id = current_developer_id())
    );

CREATE POLICY "alerts_update_own" ON alerts
    FOR UPDATE USING (
        app_id IN (SELECT id FROM apps WHERE developer_id = current_developer_id())
    )
    WITH CHECK (
        app_id IN (SELECT id FROM apps WHERE developer_id = current_developer_id())
    );

-- ============================================================================
-- ENTITLEMENT_REVOCATIONS POLICIES
-- ============================================================================
-- Only revocations by developer
CREATE POLICY "revocations_select_own" ON entitlement_revocations
    FOR SELECT USING (developer_id = current_developer_id());

CREATE POLICY "revocations_insert_own" ON entitlement_revocations
    FOR INSERT WITH CHECK (developer_id = current_developer_id());

-- ============================================================================
-- SERVICE ROLE BYPASS
-- ============================================================================
-- The service_role key (used by Cloudflare Worker) bypasses all RLS policies
-- No additional policies needed - service_role has full access by default

-- ============================================================================
-- GRANT PERMISSIONS FOR AUTHENTICATED USERS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION current_developer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION prune_old_refund_events(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data(TEXT, UUID) TO authenticated;