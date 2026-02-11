-- Rollback Migration 013: Remove suffix field from members table

ALTER TABLE members DROP COLUMN IF EXISTS suffix;
