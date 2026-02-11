-- Rollback Migration: Remove world_events table
-- Description: Drops the world_events table and its indexes

DROP INDEX IF EXISTS idx_world_events_date;
DROP TABLE IF EXISTS world_events;
