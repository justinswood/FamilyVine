-- Password Reset Functionality
-- Created: 2024-12-09
-- Purpose: Add password reset token management

-- ============================================================================
-- CREATE PASSWORD RESET TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),  -- IPv4 or IPv6
    user_agent TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for token lookup (most frequent operation)
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Index for unused tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used_at) WHERE used_at IS NULL;

-- ============================================================================
-- ADD EMAIL VERIFICATION FIELD TO USERS (if not exists)
-- ============================================================================

-- Add email_verified column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add email_verified_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP DEFAULT NULL;
    END IF;
END $$;

-- ============================================================================
-- FUNCTION TO CLEAN UP EXPIRED TOKENS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < CURRENT_TIMESTAMP
    AND used_at IS NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for user account recovery';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure random token for password reset (hashed)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration timestamp (typically 1 hour)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used (NULL if unused)';
COMMENT ON COLUMN password_reset_tokens.ip_address IS 'IP address that requested the reset';
COMMENT ON COLUMN password_reset_tokens.user_agent IS 'User agent string of the requester';

-- ============================================================================
-- ANALYZE
-- ============================================================================

ANALYZE password_reset_tokens;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

-- To cleanup expired tokens manually:
-- SELECT cleanup_expired_password_reset_tokens();
--
-- To view active reset tokens:
-- SELECT * FROM password_reset_tokens WHERE used_at IS NULL AND expires_at > CURRENT_TIMESTAMP;
--
-- To invalidate all tokens for a user:
-- UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
