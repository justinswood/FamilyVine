-- Migration 005: Add Recipes Schema
-- Description: Create tables for recipe management with photos, comments, and version history
-- Created: 2025-12-14

-- ============================================================================
-- Table 1: recipes (Core recipe data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,

    -- Basic information
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Recipe content
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,

    -- Cooking times (in minutes)
    prep_time INTEGER,
    cook_time INTEGER,
    total_time INTEGER,

    -- Servings
    servings VARCHAR(50),

    -- Categorization
    category VARCHAR(100),
    tags TEXT,  -- Comma-separated tags for simple display

    -- Attribution
    contributed_by INTEGER REFERENCES members(id) ON DELETE SET NULL,

    -- Metadata
    is_family_favorite BOOLEAN DEFAULT false,
    difficulty_level VARCHAR(20),

    -- Audit trail
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Version control
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

-- Indexes for recipes table
CREATE INDEX idx_recipes_contributed_by ON recipes(contributed_by);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_active ON recipes(is_active) WHERE is_active = true;
CREATE INDEX idx_recipes_favorite ON recipes(is_family_favorite) WHERE is_family_favorite = true;

-- Full-text search on title and description
CREATE INDEX idx_recipes_search ON recipes
    USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- Table 2: recipe_photos (Single photo per recipe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_photos (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- File information
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Image dimensions
    width INTEGER,
    height INTEGER,

    -- Caption
    caption TEXT,

    -- Audit trail
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one photo per recipe
    CONSTRAINT unique_recipe_photo UNIQUE (recipe_id)
);

CREATE INDEX idx_recipe_photos_recipe ON recipe_photos(recipe_id);

-- ============================================================================
-- Table 3: recipe_comments (Family notes and comments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_comments (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Comment content
    comment_text TEXT NOT NULL,

    -- Optional member attribution (for quotes like "Uncle Bob says: Add more garlic!")
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,

    -- Audit trail
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX idx_recipe_comments_created_at ON recipe_comments(created_at DESC);
CREATE INDEX idx_recipe_comments_active ON recipe_comments(is_deleted) WHERE is_deleted = false;

-- ============================================================================
-- Table 4: recipe_versions (History tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_versions (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Version number
    version_number INTEGER NOT NULL,

    -- Snapshot of recipe data at this version
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INTEGER,
    cook_time INTEGER,
    total_time INTEGER,
    servings VARCHAR(50),

    -- Change description
    change_description TEXT,

    -- Audit trail
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique version numbers per recipe
    CONSTRAINT unique_recipe_version UNIQUE (recipe_id, version_number)
);

CREATE INDEX idx_recipe_versions_recipe ON recipe_versions(recipe_id, version_number DESC);
CREATE INDEX idx_recipe_versions_created_at ON recipe_versions(created_at DESC);

-- ============================================================================
-- Table 5: recipe_tags (Many-to-many structured tags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_tags (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,

    -- Audit trail
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate tags on same recipe
    CONSTRAINT unique_recipe_tag UNIQUE (recipe_id, tag_name)
);

CREATE INDEX idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_tag ON recipe_tags(tag_name);

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration creates 5 tables for the recipe feature:
-- 1. recipes - Core recipe data
-- 2. recipe_photos - Single photo per recipe (UNIQUE constraint)
-- 3. recipe_comments - Family notes and comments
-- 4. recipe_versions - Version history for recipe evolution
-- 5. recipe_tags - Many-to-many structured tags
--
-- Total indexes created: 12
-- Foreign key constraints: 10
-- Unique constraints: 3
