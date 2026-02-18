-- Rollback Migration 017: Remove performance indexes v2
DROP INDEX IF EXISTS idx_photo_tags_photo_member;
DROP INDEX IF EXISTS idx_recipe_comments_recipe;
DROP INDEX IF EXISTS idx_recipe_tags_recipe;
DROP INDEX IF EXISTS idx_recipe_tags_recipe_name;
DROP INDEX IF EXISTS idx_story_members_story;
DROP INDEX IF EXISTS idx_story_photos_story;
DROP INDEX IF EXISTS idx_union_children_union_child;
