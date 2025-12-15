-- Rollback Migration 005: Remove Recipes Schema
-- Description: Drop all recipe-related tables
-- Created: 2025-12-14

-- Drop tables in reverse order (due to foreign key dependencies)
DROP TABLE IF EXISTS recipe_tags;
DROP TABLE IF EXISTS recipe_versions;
DROP TABLE IF EXISTS recipe_comments;
DROP TABLE IF EXISTS recipe_photos;
DROP TABLE IF EXISTS recipes;

-- Note: Indexes are automatically dropped when tables are dropped
