-- ===========================================================================
-- Admin Authentication System Database Schema
-- ===========================================================================
-- 
-- This migration creates the complete database schema for the admin-only
-- authentication system, including user profiles, auth lockout tracking,
-- security policies, and automated cleanup.
--
-- Requirements:
-- - 1.1: Database SHALL include user_profiles table for admin user information
-- - 1.2: System SHALL record failed attempts in auth_lockouts table  
-- - 1.3: System SHALL lock email account for 15 minutes after 5 failed attempts
--
-- @version 1.0.0
-- @created 2025-08-18
-- ===========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- ENUMS
-- ===========================================================================

-- User role enumeration
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- ===========================================================================
-- TABLES
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- user_profiles: Store user profile information and role assignments
-- ---------------------------------------------------------------------------
-- Requirement 1.1: Database SHALL include user_profiles table for admin user information
CREATE TABLE user_profiles (
    -- Primary identifier (matches Supabase auth.users.id)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User contact information
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar TEXT,
    
    -- Role-based access control
    role user_role NOT NULL DEFAULT 'user',
    
    -- Additional metadata for extensibility
    metadata JSONB DEFAULT '{}',
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- ---------------------------------------------------------------------------  
-- auth_lockouts: Track authentication failures and account lockouts
-- ---------------------------------------------------------------------------
-- Requirement 1.2: System SHALL record failed attempts in auth_lockouts table
-- Requirement 1.3: System SHALL lock email account for 15 minutes
CREATE TABLE auth_lockouts (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Email being tracked for lockout
    email VARCHAR(255) NOT NULL,
    
    -- Failed attempt tracking
    attempt_count INTEGER NOT NULL DEFAULT 1,
    
    -- Lockout expiration (NULL means not locked)
    locked_until TIMESTAMPTZ,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_attempt_count CHECK (attempt_count >= 0),
    CONSTRAINT valid_lockout_time CHECK (locked_until IS NULL OR locked_until > created_at)
);

-- ===========================================================================
-- INDEXES FOR PERFORMANCE
-- ===========================================================================

-- Primary lookup indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_auth_lockouts_email ON auth_lockouts(email);

-- Compound indexes for common queries
CREATE INDEX idx_user_profiles_role_created ON user_profiles(role, created_at DESC);
CREATE INDEX idx_auth_lockouts_email_locked ON auth_lockouts(email, locked_until);

-- Cleanup and maintenance indexes
CREATE INDEX idx_auth_lockouts_locked_until ON auth_lockouts(locked_until) 
    WHERE locked_until IS NOT NULL;
CREATE INDEX idx_user_profiles_updated ON user_profiles(updated_at);
CREATE INDEX idx_auth_lockouts_created ON auth_lockouts(created_at);

-- ===========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================================================

-- Enable RLS on both tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_lockouts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- user_profiles RLS Policies
-- ---------------------------------------------------------------------------

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);

-- Allow users to update their own profile (except role)
CREATE POLICY "Users can update own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    );

-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles" 
    ON user_profiles FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage profiles" 
    ON user_profiles FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ---------------------------------------------------------------------------
-- auth_lockouts RLS Policies
-- ---------------------------------------------------------------------------

-- Only admins can read lockout information
CREATE POLICY "Admins can view lockouts" 
    ON auth_lockouts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only service role can manage lockouts (for system operations)
CREATE POLICY "Service role can manage lockouts" 
    ON auth_lockouts FOR ALL 
    USING (current_setting('role') = 'service_role');

-- ===========================================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Auto-update timestamps
-- ---------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Apply to auth_lockouts
CREATE TRIGGER update_auth_lockouts_updated_at
    BEFORE UPDATE ON auth_lockouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create user profile on auth.users insert
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        'user'  -- Default role, admins must be manually promoted
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profiles
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- ===========================================================================
-- AUTHENTICATION LOCKOUT FUNCTIONS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Function: Record failed authentication attempt
-- ---------------------------------------------------------------------------
-- Requirement 1.2: System SHALL record failed attempts in auth_lockouts table
-- Requirement 1.3: System SHALL lock email account for 15 minutes

CREATE OR REPLACE FUNCTION record_auth_failure(p_email VARCHAR)
RETURNS JSON AS $$
DECLARE
    v_lockout_record RECORD;
    v_max_attempts CONSTANT INTEGER := 5;
    v_lockout_duration CONSTANT INTERVAL := '15 minutes';
    v_result JSON;
BEGIN
    -- Get or create lockout record for this email
    SELECT * INTO v_lockout_record 
    FROM auth_lockouts 
    WHERE email = p_email
    FOR UPDATE;
    
    IF v_lockout_record IS NULL THEN
        -- Create new lockout record
        INSERT INTO auth_lockouts (email, attempt_count, locked_until)
        VALUES (p_email, 1, NULL)
        RETURNING * INTO v_lockout_record;
        
        v_result := json_build_object(
            'locked', false,
            'attempts', 1,
            'max_attempts', v_max_attempts,
            'remaining_attempts', v_max_attempts - 1
        );
    ELSE
        -- Check if currently locked and lock has expired
        IF v_lockout_record.locked_until IS NOT NULL 
           AND v_lockout_record.locked_until <= NOW() THEN
            -- Reset attempts after lock expiry
            UPDATE auth_lockouts 
            SET attempt_count = 1, 
                locked_until = NULL,
                updated_at = NOW()
            WHERE id = v_lockout_record.id
            RETURNING * INTO v_lockout_record;
            
            v_result := json_build_object(
                'locked', false,
                'attempts', 1,
                'max_attempts', v_max_attempts,
                'remaining_attempts', v_max_attempts - 1
            );
        ELSE
            -- Increment attempt count
            UPDATE auth_lockouts 
            SET attempt_count = attempt_count + 1,
                locked_until = CASE 
                    WHEN attempt_count + 1 >= v_max_attempts 
                    THEN NOW() + v_lockout_duration
                    ELSE locked_until
                END,
                updated_at = NOW()
            WHERE id = v_lockout_record.id
            RETURNING * INTO v_lockout_record;
            
            v_result := json_build_object(
                'locked', v_lockout_record.locked_until IS NOT NULL,
                'attempts', v_lockout_record.attempt_count,
                'max_attempts', v_max_attempts,
                'remaining_attempts', GREATEST(0, v_max_attempts - v_lockout_record.attempt_count),
                'locked_until', v_lockout_record.locked_until
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Function: Check if email is currently locked
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_email_locked(p_email VARCHAR)
RETURNS JSON AS $$
DECLARE
    v_lockout_record RECORD;
    v_result JSON;
BEGIN
    SELECT * INTO v_lockout_record
    FROM auth_lockouts
    WHERE email = p_email;
    
    IF v_lockout_record IS NULL THEN
        v_result := json_build_object(
            'locked', false,
            'attempts', 0
        );
    ELSIF v_lockout_record.locked_until IS NULL THEN
        v_result := json_build_object(
            'locked', false,
            'attempts', v_lockout_record.attempt_count
        );
    ELSIF v_lockout_record.locked_until <= NOW() THEN
        -- Lock expired, clean up
        UPDATE auth_lockouts 
        SET locked_until = NULL, 
            attempt_count = 0,
            updated_at = NOW()
        WHERE id = v_lockout_record.id;
        
        v_result := json_build_object(
            'locked', false,
            'attempts', 0
        );
    ELSE
        v_result := json_build_object(
            'locked', true,
            'attempts', v_lockout_record.attempt_count,
            'locked_until', v_lockout_record.locked_until,
            'remaining_time', EXTRACT(EPOCH FROM (v_lockout_record.locked_until - NOW()))
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Function: Reset lockout for email (admin function)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reset_auth_lockout(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE auth_lockouts 
    SET attempt_count = 0,
        locked_until = NULL,
        updated_at = NOW()
    WHERE email = p_email;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================================================
-- CLEANUP AND MAINTENANCE
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Function: Clean up expired lockouts and old records
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cleanup_auth_lockouts()
RETURNS TABLE(cleaned_records INTEGER) AS $$
DECLARE
    v_cleaned_count INTEGER;
BEGIN
    -- Remove records older than 30 days or with expired locks
    DELETE FROM auth_lockouts 
    WHERE created_at < NOW() - INTERVAL '30 days'
       OR (locked_until IS NOT NULL AND locked_until < NOW() - INTERVAL '1 day');
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Scheduled cleanup (requires pg_cron extension)
-- ---------------------------------------------------------------------------
-- Note: This requires the pg_cron extension to be enabled
-- Run cleanup every 6 hours
-- SELECT cron.schedule('auth-lockout-cleanup', '0 */6 * * *', 'SELECT cleanup_auth_lockouts();');

-- ===========================================================================
-- INITIAL DATA AND SETUP
-- ===========================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON auth_lockouts TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION record_auth_failure(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION is_email_locked(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_auth_lockout(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_auth_lockouts() TO authenticated;

-- ===========================================================================
-- COMMENTS FOR DOCUMENTATION
-- ===========================================================================

COMMENT ON TABLE user_profiles IS 'User profile information and role assignments for admin authentication system';
COMMENT ON TABLE auth_lockouts IS 'Authentication failure tracking and account lockout management';

COMMENT ON COLUMN user_profiles.id IS 'Primary key matching auth.users.id';
COMMENT ON COLUMN user_profiles.email IS 'User email address (unique)';
COMMENT ON COLUMN user_profiles.role IS 'User role for RBAC (admin/user)';
COMMENT ON COLUMN user_profiles.metadata IS 'Additional user metadata in JSON format';

COMMENT ON COLUMN auth_lockouts.email IS 'Email address being tracked for lockout';
COMMENT ON COLUMN auth_lockouts.attempt_count IS 'Number of failed authentication attempts';
COMMENT ON COLUMN auth_lockouts.locked_until IS 'Timestamp when lockout expires (NULL if not locked)';

COMMENT ON FUNCTION record_auth_failure(VARCHAR) IS 'Records failed authentication attempt and applies lockout if needed';
COMMENT ON FUNCTION is_email_locked(VARCHAR) IS 'Checks if email address is currently locked due to failed attempts';
COMMENT ON FUNCTION reset_auth_lockout(VARCHAR) IS 'Resets lockout status for an email address (admin function)';
COMMENT ON FUNCTION cleanup_auth_lockouts() IS 'Cleans up expired and old lockout records';

-- ===========================================================================
-- MIGRATION COMPLETION
-- ===========================================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Admin Authentication System migration completed successfully';
    RAISE NOTICE 'Created tables: user_profiles, auth_lockouts';
    RAISE NOTICE 'Created functions: record_auth_failure, is_email_locked, reset_auth_lockout, cleanup_auth_lockouts';
    RAISE NOTICE 'Applied RLS policies and performance indexes';
END $$;