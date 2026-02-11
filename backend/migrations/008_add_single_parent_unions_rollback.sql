-- Rollback Migration 008: Remove Single Parent Union Support

-- Drop indexes
DROP INDEX IF EXISTS idx_unions_single_parent;
DROP INDEX IF EXISTS idx_unions_visible;
DROP INDEX IF EXISTS unions_unique_non_single_parent;

-- Remove columns
ALTER TABLE unions
  DROP COLUMN IF EXISTS is_single_parent,
  DROP COLUMN IF EXISTS is_visible_on_tree;

-- Restore original constraints
ALTER TABLE unions
  ADD CONSTRAINT unions_ordered_partners CHECK (partner1_id < partner2_id);

ALTER TABLE unions
  ADD CONSTRAINT unions_unique_partners UNIQUE (partner1_id, partner2_id);

-- Rollback complete
