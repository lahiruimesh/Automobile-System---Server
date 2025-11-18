-- Migration: Add assigned_employee_id to appointments table
-- Date: 2025-11-07
-- Purpose: Allow admin to assign specific employees to appointments

-- Add assigned_employee_id column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_employee 
ON appointments(assigned_employee_id);

-- Add comment
COMMENT ON COLUMN appointments.assigned_employee_id IS 'Employee assigned to this appointment by admin';
