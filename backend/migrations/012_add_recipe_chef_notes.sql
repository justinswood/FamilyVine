-- Migration 012: Add chef_notes column to recipes and recipe_versions tables
-- Supports the "Chef's Tips" feature in the Heirloom Kitchen recipe edit redesign

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS chef_notes TEXT;
ALTER TABLE recipe_versions ADD COLUMN IF NOT EXISTS chef_notes TEXT;
