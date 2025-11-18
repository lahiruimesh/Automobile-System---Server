-- Migration: Add completion_notes to appointments table
-- Date: 2025-11-07
-- Purpose: Allow employees to add notes when completing appointments

-- Add completion_notes column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

COMMENT ON COLUMN appointments.completion_notes IS 'Notes added by employee when marking appointment as completed';
