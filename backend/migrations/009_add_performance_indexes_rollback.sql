-- Rollback: Remove performance indexes
-- Date: 2026-01-27

DROP INDEX IF EXISTS idx_members_email;
DROP INDEX IF EXISTS idx_members_location;
DROP INDEX IF EXISTS idx_members_birth_place;
DROP INDEX IF EXISTS idx_members_first_name_lower;
DROP INDEX IF EXISTS idx_members_last_name_lower;
DROP INDEX IF EXISTS idx_members_is_alive;
DROP INDEX IF EXISTS idx_relationships_type;
DROP INDEX IF EXISTS idx_relationships_member1;
DROP INDEX IF EXISTS idx_relationships_member2;
DROP INDEX IF EXISTS idx_union_children_child;
DROP INDEX IF EXISTS idx_union_children_union;
DROP INDEX IF EXISTS idx_unions_partner1;
DROP INDEX IF EXISTS idx_unions_partner2;
DROP INDEX IF EXISTS idx_unions_partners;
DROP INDEX IF EXISTS idx_photos_album;
DROP INDEX IF EXISTS idx_photo_tags_photo;
DROP INDEX IF EXISTS idx_photo_tags_member;
DROP INDEX IF EXISTS idx_recipes_contributed_by;
DROP INDEX IF EXISTS idx_members_search;
