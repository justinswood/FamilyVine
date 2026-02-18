-- ============================================================================
-- Migration 016: Add User Preferences Table
-- Purpose: Server-side storage for user settings (replaces localStorage-only)
-- Created: 2026-02-13
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- General Settings
    family_name VARCHAR(255),
    default_privacy VARCHAR(20) DEFAULT 'private',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',

    -- Privacy Settings
    show_private_info BOOLEAN DEFAULT false,
    require_login_for_viewing BOOLEAN DEFAULT false,
    allow_guest_access BOOLEAN DEFAULT false,

    -- Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    member_updates BOOLEAN DEFAULT true,
    relationship_changes BOOLEAN DEFAULT true,
    photo_uploads BOOLEAN DEFAULT false,

    -- Family Tree Preferences
    default_root_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    preferred_generation_depth INTEGER DEFAULT 4,
    show_unknown_parents BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- CREATE DEFAULT PREFERENCES FOR EXISTING USERS
-- ============================================================================

DO $$
DECLARE
    user_record RECORD;
    created_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id FROM users
    LOOP
        INSERT INTO user_preferences (user_id)
        VALUES (user_record.id)
        ON CONFLICT (user_id) DO NOTHING;
        created_count := created_count + 1;
    END LOOP;

    RAISE NOTICE '✓ Migration 016 completed: user_preferences table created, % default rows inserted', created_count;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_preferences IS 'User-specific settings and preferences, synced across devices';
COMMENT ON COLUMN user_preferences.default_root_member_id IS 'Preferred starting member for family tree view';
COMMENT ON COLUMN user_preferences.preferred_generation_depth IS 'Default generations to display (1-10)';

ANALYZE user_preferences;
