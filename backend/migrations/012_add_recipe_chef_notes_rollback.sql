-- Rollback Migration 012: Remove chef_notes column from recipes and recipe_versions tables

ALTER TABLE recipes DROP COLUMN IF EXISTS chef_notes;
ALTER TABLE recipe_versions DROP COLUMN IF EXISTS chef_notes;
