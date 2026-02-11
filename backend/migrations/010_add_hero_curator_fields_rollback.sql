-- Rollback migration 010: Remove curator fields from photos table

ALTER TABLE photos DROP COLUMN IF EXISTS hero_blurb;
ALTER TABLE photos DROP COLUMN IF EXISTS hero_location_override;
ALTER TABLE photos DROP COLUMN IF EXISTS hero_tagged_ids;
