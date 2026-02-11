-- Migration 008: Add Single Parent Union Support
-- This migration adds support for single-parent unions that don't require
-- a second partner and can be hidden from the tree visualization

-- Add columns to unions table
ALTER TABLE unions
  ADD COLUMN IF NOT EXISTS is_single_parent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_visible_on_tree BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN unions.is_single_parent IS 'True if this union represents a single parent (no actual partnership)';
COMMENT ON COLUMN unions.is_visible_on_tree IS 'False if this union node should be hidden in tree visualization (typically for single-parent unions)';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_unions_single_parent ON unions(is_single_parent);
CREATE INDEX IF NOT EXISTS idx_unions_visible ON unions(is_visible_on_tree);

-- Remove the CHECK constraint that requires partner1_id < partner2_id
-- This allows single-parent unions where partner1_id = partner2_id
ALTER TABLE unions DROP CONSTRAINT IF EXISTS unions_ordered_partners;

-- Update the unique constraint to allow duplicate partners for single-parent unions
-- Only enforce uniqueness for non-single-parent unions
ALTER TABLE unions DROP CONSTRAINT IF EXISTS unions_unique_partners;

-- Add a new conditional unique constraint
-- For non-single-parent unions, ensure partners are unique
CREATE UNIQUE INDEX IF NOT EXISTS unions_unique_non_single_parent
  ON unions(partner1_id, partner2_id)
  WHERE is_single_parent = false;

-- Migration complete
-- Note: To create a single-parent union, set both partner1_id and partner2_id
-- to the same member ID, and set is_single_parent = true, is_visible_on_tree = false
