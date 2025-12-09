-- Performance Optimization Indexes
-- Created: 2024-12-09
-- Purpose: Add indexes for frequently queried columns to improve query performance

-- ============================================================================
-- MEMBERS TABLE INDEXES
-- ============================================================================

-- Index for member searches by name (used in search, autocomplete)
CREATE INDEX IF NOT EXISTS idx_members_first_name ON members(first_name);
CREATE INDEX IF NOT EXISTS idx_members_last_name ON members(last_name);

-- Composite index for full name searches
CREATE INDEX IF NOT EXISTS idx_members_full_name ON members(first_name, last_name);

-- Index for searching by birth/death dates (used in timeline, calendar)
CREATE INDEX IF NOT EXISTS idx_members_birth_date ON members(birth_date);
CREATE INDEX IF NOT EXISTS idx_members_death_date ON members(death_date) WHERE death_date IS NOT NULL;

-- Index for living members filter
CREATE INDEX IF NOT EXISTS idx_members_is_alive ON members(is_alive);

-- Index for spouse relationships
CREATE INDEX IF NOT EXISTS idx_members_spouse_id ON members(spouse_id) WHERE spouse_id IS NOT NULL;

-- Index for married members
CREATE INDEX IF NOT EXISTS idx_members_is_married ON members(is_married) WHERE is_married = true;

-- Index for location-based queries (map page)
CREATE INDEX IF NOT EXISTS idx_members_location ON members(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_birth_place ON members(birth_place) WHERE birth_place IS NOT NULL;

-- Index for gender (used in relationship calculations)
CREATE INDEX IF NOT EXISTS idx_members_gender ON members(gender) WHERE gender IS NOT NULL;

-- ============================================================================
-- RELATIONSHIPS TABLE INDEXES
-- ============================================================================

-- Indexes for relationship queries (most frequently used)
CREATE INDEX IF NOT EXISTS idx_relationships_member1_id ON relationships(member1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_member2_id ON relationships(member2_id);

-- Composite index for finding relationships between specific members
CREATE INDEX IF NOT EXISTS idx_relationships_members ON relationships(member1_id, member2_id);

-- Index for relationship type filtering
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Composite index for member + type queries
CREATE INDEX IF NOT EXISTS idx_relationships_member1_type ON relationships(member1_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_member2_type ON relationships(member2_id, relationship_type);

-- Index for created_at (for ordering)
CREATE INDEX IF NOT EXISTS idx_relationships_created_at ON relationships(created_at DESC);

-- ============================================================================
-- UNIONS TABLE INDEXES
-- ============================================================================

-- Indexes for partner lookups (family tree generation)
CREATE INDEX IF NOT EXISTS idx_unions_partner1_id ON unions(partner1_id);
CREATE INDEX IF NOT EXISTS idx_unions_partner2_id ON unions(partner2_id);

-- Composite index for finding union between two partners
CREATE INDEX IF NOT EXISTS idx_unions_partners ON unions(partner1_id, partner2_id);

-- Index for union type (marriage, partnership, etc.)
CREATE INDEX IF NOT EXISTS idx_unions_union_type ON unions(union_type) WHERE union_type IS NOT NULL;

-- Index for marriage dates (timeline queries)
CREATE INDEX IF NOT EXISTS idx_unions_marriage_date ON unions(marriage_date) WHERE marriage_date IS NOT NULL;

-- ============================================================================
-- UNION_CHILDREN TABLE INDEXES
-- ============================================================================

-- Indexes for parent-child relationship lookups
CREATE INDEX IF NOT EXISTS idx_union_children_union_id ON union_children(union_id);
CREATE INDEX IF NOT EXISTS idx_union_children_child_id ON union_children(child_id);

-- Composite index for finding children of a specific union
CREATE INDEX IF NOT EXISTS idx_union_children_union_child ON union_children(union_id, child_id);

-- ============================================================================
-- PHOTOS TABLE INDEXES
-- ============================================================================

-- Index for album lookups
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);

-- Index for member-tagged photos
CREATE INDEX IF NOT EXISTS idx_photos_member_id ON photos(member_id) WHERE member_id IS NOT NULL;

-- Index for photo upload ordering
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at DESC);

-- Composite index for album + member queries
CREATE INDEX IF NOT EXISTS idx_photos_album_member ON photos(album_id, member_id);

-- ============================================================================
-- ALBUMS TABLE INDEXES
-- ============================================================================

-- Index for cover photo lookups
CREATE INDEX IF NOT EXISTS idx_albums_cover_photo_id ON albums(cover_photo_id) WHERE cover_photo_id IS NOT NULL;

-- Index for album ordering
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at DESC);

-- Index for title searches (if implementing search)
CREATE INDEX IF NOT EXISTS idx_albums_title ON albums(title);

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for login queries (username lookup)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index for email lookups (login, password reset)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for active users filter
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for last login tracking
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- ============================================================================
-- STORIES TABLE INDEXES (if exists)
-- ============================================================================

-- Index for story author lookups
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id) WHERE author_id IS NOT NULL;

-- Index for story ordering
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Index for published stories
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published) WHERE is_published = true;

-- ============================================================================
-- TEXT SEARCH INDEXES (Advanced)
-- ============================================================================

-- Full-text search index for member names (PostgreSQL specific)
-- Uncomment if you want to enable full-text search capabilities

-- CREATE INDEX IF NOT EXISTS idx_members_fulltext_name ON members
--   USING gin(to_tsvector('english', first_name || ' ' || COALESCE(middle_name, '') || ' ' || last_name));

-- CREATE INDEX IF NOT EXISTS idx_albums_fulltext_title ON albums
--   USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update table statistics for query planner
ANALYZE members;
ANALYZE relationships;
ANALYZE unions;
ANALYZE union_children;
ANALYZE photos;
ANALYZE albums;
ANALYZE users;
ANALYZE stories;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Performance Impact:
-- - These indexes will speed up SELECT queries significantly
-- - INSERT/UPDATE/DELETE operations may be slightly slower due to index maintenance
-- - Disk space usage will increase (estimate: 10-20% of table sizes)
--
-- Monitoring:
-- - Use EXPLAIN ANALYZE to verify indexes are being used
-- - Monitor query performance with pg_stat_statements extension
-- - Regularly run VACUUM ANALYZE to maintain index efficiency
--
-- Example query to check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
