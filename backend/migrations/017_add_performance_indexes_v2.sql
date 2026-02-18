-- Migration 017: Additional performance indexes
-- Date: 2026-02-14
-- Description: Add missing indexes identified during performance review

-- Composite index for photo_tags JOIN pattern used in albums listing
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_member ON photo_tags(photo_id, member_id);

-- Recipe comments index for correlated count subquery
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe ON recipe_comments(recipe_id) WHERE is_deleted = false;

-- Recipe tags index for tag filtering
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_name ON recipe_tags(recipe_id, tag_name);

-- Story members/photos indexes for JOIN performance
CREATE INDEX IF NOT EXISTS idx_story_members_story ON story_members(story_id);
CREATE INDEX IF NOT EXISTS idx_story_photos_story ON story_photos(story_id);

-- Composite index for union_children tree traversal
CREATE INDEX IF NOT EXISTS idx_union_children_union_child ON union_children(union_id, child_id);
