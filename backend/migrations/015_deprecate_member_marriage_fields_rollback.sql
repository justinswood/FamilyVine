-- Rollback for Migration 015: Restore member-level marriage fields
-- This restores the columns but does NOT repopulate data.

ALTER TABLE members ADD COLUMN IF NOT EXISTS is_married BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS marriage_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS spouse_id INTEGER;

ALTER TABLE members ADD CONSTRAINT members_spouse_id_fkey
  FOREIGN KEY (spouse_id) REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_is_married ON members (is_married) WHERE is_married = true;
CREATE INDEX IF NOT EXISTS idx_members_spouse_id ON members (spouse_id);

-- Repopulate from unions table
UPDATE members m SET
  is_married = true,
  spouse_id = CASE WHEN u.partner1_id = m.id THEN u.partner2_id ELSE u.partner1_id END,
  marriage_date = u.union_date
FROM unions u
WHERE (u.partner1_id = m.id OR u.partner2_id = m.id)
  AND u.union_type = 'marriage'
  AND u.is_single_parent = false;
