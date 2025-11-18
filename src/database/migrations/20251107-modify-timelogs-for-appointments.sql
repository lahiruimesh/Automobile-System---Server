-- Migration: Modify time_logs foreign key constraints for appointment support
-- Date: 2025-11-07
-- Purpose: Allow time_logs to reference either services OR appointments

-- Step 1: Drop existing foreign key constraint
ALTER TABLE time_logs 
DROP CONSTRAINT IF EXISTS time_logs_service_id_fkey;

-- Step 2: Make service_id nullable (since appointment-based logs won't have a service)
-- (This is already done in the code, just ensuring it's applied)
ALTER TABLE time_logs 
ALTER COLUMN service_id DROP NOT NULL;

-- Step 3: Add comment to explain the dual usage
COMMENT ON COLUMN time_logs.service_id IS 
'References either services.id (when assignment_id IS NOT NULL) or appointments.id (when assignment_id IS NULL). Foreign key validation removed to support dual reference.';

COMMENT ON COLUMN time_logs.assignment_id IS 
'References employee_assignments.id for regular services. NULL for appointment-based time logs.';
