-- Migration 010: Add curator fields to photos table for hero image narratives
-- These fields allow users to add stories, location overrides, and tagged members to hero images

ALTER TABLE photos ADD COLUMN IF NOT EXISTS hero_blurb TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS hero_location_override VARCHAR(255);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS hero_tagged_ids INTEGER[];
