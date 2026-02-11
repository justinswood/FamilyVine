-- Migration 013: Add suffix field to members table
-- Supports Jr., Sr., III, IV, etc.

ALTER TABLE members ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
