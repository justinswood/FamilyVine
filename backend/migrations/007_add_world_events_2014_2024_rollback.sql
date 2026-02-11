-- Rollback Migration: Remove world events 2014-2024
-- Description: Removes world events added in 007_add_world_events_2014_2024.sql

DELETE FROM world_events WHERE event_date >= '2014-01-01' AND event_date <= '2024-12-31';
