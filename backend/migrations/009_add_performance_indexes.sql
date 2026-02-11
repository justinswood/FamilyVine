-- Migration: Add performance indexes
-- Date: 2026-01-27
-- Description: Add indexes on frequently queried columns to improve query performance

-- Members table indexes
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_location ON members(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_birth_place ON members(birth_place) WHERE birth_place IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_first_name_lower ON members(LOWER(first_name));
CREATE INDEX IF NOT EXISTS idx_members_last_name_lower ON members(LOWER(last_name));
CREATE INDEX IF NOT EXISTS idx_members_is_alive ON members(is_alive);

-- Relationships table indexes
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_member1 ON relationships(member1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_member2 ON relationships(member2_id);

-- Union children table indexes (critical for tree traversal)
CREATE INDEX IF NOT EXISTS idx_union_children_child ON union_children(child_id);
CREATE INDEX IF NOT EXISTS idx_union_children_union ON union_children(union_id);

-- Unions table indexes
CREATE INDEX IF NOT EXISTS idx_unions_partner1 ON unions(partner1_id);
CREATE INDEX IF NOT EXISTS idx_unions_partner2 ON unions(partner2_id);
CREATE INDEX IF NOT EXISTS idx_unions_partners ON unions(partner1_id, partner2_id);

-- Photos/Albums indexes
CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_member ON photo_tags(member_id);

-- Recipes indexes (stories.author_name is varchar, not FK)
CREATE INDEX IF NOT EXISTS idx_recipes_contributed_by ON recipes(contributed_by) WHERE contributed_by IS NOT NULL;

-- Composite index for member search
CREATE INDEX IF NOT EXISTS idx_members_search ON members(first_name, last_name);

COMMENT ON INDEX idx_members_email IS 'Speeds up email lookups for authentication';
COMMENT ON INDEX idx_union_children_child IS 'Critical for tree traversal - finding parent unions';
COMMENT ON INDEX idx_unions_partners IS 'Speeds up union lookups by partner pair';
