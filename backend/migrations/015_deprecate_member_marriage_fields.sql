-- Migration 015: Deprecate member-level marriage fields
--
-- Marriage data is now derived from the unions table (single source of truth).
-- The members.is_married, members.marriage_date, and members.spouse_id columns
-- are no longer written to by the application. Read queries now JOIN with unions
-- to derive this information.
--
-- This migration drops the redundant columns and their indexes.
-- Run the rollback script first if you need to restore them.

-- Drop indexes first
DROP INDEX IF EXISTS idx_members_is_married;
DROP INDEX IF EXISTS idx_members_spouse_id;

-- Drop the foreign key constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_spouse_id_fkey;

-- Drop the redundant columns
ALTER TABLE members DROP COLUMN IF EXISTS is_married;
ALTER TABLE members DROP COLUMN IF EXISTS marriage_date;
ALTER TABLE members DROP COLUMN IF EXISTS spouse_id;
