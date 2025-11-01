-- Test Data for Employee Module
-- Run this after running schema.sql

-- Note: You need to have users already created through the signup endpoint
-- For this test data, we assume:
-- - User ID 1 is a customer
-- - User ID 2 is an employee (approved)
-- - User ID 3 is another customer

-- Sample Services/Projects
INSERT INTO services (customer_id, vehicle_number, vehicle_model, service_type, title, description, status, priority, estimated_hours, scheduled_date)
VALUES 
    -- Regular Services
    (1, 'CAR-1234', 'Toyota Camry 2020', 'service', 'Regular Oil Change', 'Engine oil replacement, oil filter change, and basic inspection', 'in_progress', 'normal', 2.0, CURRENT_DATE + INTERVAL '2 days'),
    (1, 'CAR-1234', 'Toyota Camry 2020', 'service', 'Brake Inspection', 'Complete brake system inspection and pad replacement if needed', 'pending', 'high', 3.5, CURRENT_DATE + INTERVAL '5 days'),
    (3, 'VAN-5678', 'Honda CR-V 2019', 'service', 'Tire Rotation & Alignment', 'Rotate all four tires and wheel alignment', 'pending', 'normal', 1.5, CURRENT_DATE + INTERVAL '3 days'),
    
    -- Project/Modifications
    (1, 'CAR-1234', 'Toyota Camry 2020', 'project', 'Performance Tuning', 'Engine performance optimization and ECU remapping', 'in_progress', 'high', 15.0, CURRENT_DATE + INTERVAL '7 days'),
    (3, 'VAN-5678', 'Honda CR-V 2019', 'project', 'Custom Exhaust System', 'Install high-performance exhaust system', 'pending', 'normal', 12.0, CURRENT_DATE + INTERVAL '10 days'),
    (1, 'SUV-9012', 'BMW X5 2021', 'service', 'Annual Service', 'Complete annual maintenance package', 'pending', 'urgent', 8.0, CURRENT_DATE + INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Employee Assignments
-- Assign services to employee (user_id = 2)
INSERT INTO employee_assignments (employee_id, service_id, role, notes, is_active)
VALUES 
    (2, 1, 'Senior Mechanic', 'Lead mechanic for this service', true),
    (2, 2, 'Brake Specialist', 'Brake system expert', true),
    (2, 4, 'Performance Technician', 'Specialized in performance tuning', true),
    (2, 6, 'Service Manager', 'Managing the annual service', true)
ON CONFLICT (employee_id, service_id) DO NOTHING;

-- Sample Time Logs (for testing)
-- These are time logs for the employee (user_id = 2)

-- Time logs for Service ID 1 (Oil Change) - Multiple days
INSERT INTO time_logs (employee_id, service_id, assignment_id, log_date, start_time, end_time, hours_worked, work_description, status, notes)
VALUES 
    -- Today
    (2, 1, 1, CURRENT_DATE, '09:00:00', '10:30:00', 1.5, 'Drained old engine oil, replaced oil filter, filled new synthetic oil', 'approved', 'Service completed successfully'),
    
    -- Yesterday
    (2, 1, 1, CURRENT_DATE - INTERVAL '1 day', '14:00:00', '14:45:00', 0.75, 'Vehicle inspection and diagnostic check before oil change', 'approved', NULL),
    
    -- 2 days ago
    (2, 4, 3, CURRENT_DATE - INTERVAL '2 days', '09:00:00', '12:30:00', 3.5, 'Initial performance diagnostics and baseline testing', 'approved', 'Found several areas for improvement'),
    (2, 4, 3, CURRENT_DATE - INTERVAL '2 days', '13:30:00', '17:00:00', 3.5, 'Started ECU mapping and parameter adjustments', 'approved', NULL),
    
    -- 3 days ago
    (2, 1, 1, CURRENT_DATE - INTERVAL '3 days', '10:00:00', '11:00:00', 1.0, 'Prepared workspace and gathered necessary tools and oil', 'submitted', 'Waiting for approval'),
    
    -- 4 days ago
    (2, 4, 3, CURRENT_DATE - INTERVAL '4 days', '09:30:00', '12:00:00', 2.5, 'Dyno testing and performance measurement', 'approved', 'Baseline performance recorded'),
    
    -- 5 days ago
    (2, 6, 4, CURRENT_DATE - INTERVAL '5 days', '08:00:00', '10:00:00', 2.0, 'Initial vehicle inspection and service planning', 'submitted', 'Created detailed service checklist'),
    
    -- This week - Monday
    (2, 4, 3, DATE_TRUNC('week', CURRENT_DATE), '09:00:00', '13:00:00', 4.0, 'Advanced ECU tuning and test runs', 'approved', 'Performance improved by 15%'),
    
    -- This week - Tuesday  
    (2, 4, 3, DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day', '09:00:00', '12:00:00', 3.0, 'Fine-tuning parameters and optimization', 'approved', NULL),
    
    -- This week - Wednesday
    (2, 1, 1, DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '2 days', '14:00:00', '16:30:00', 2.5, 'Final quality check and test drive', 'submitted', NULL)
ON CONFLICT DO NOTHING;

-- Check created data
SELECT 'Services Created:' as info, COUNT(*) as count FROM services;
SELECT 'Assignments Created:' as info, COUNT(*) as count FROM employee_assignments;
SELECT 'Time Logs Created:' as info, COUNT(*) as count FROM time_logs;

-- Display summary
SELECT 
    s.id,
    s.title,
    s.vehicle_number,
    s.status,
    s.estimated_hours,
    s.total_hours_logged,
    (SELECT COUNT(*) FROM employee_assignments WHERE service_id = s.id) as assigned_employees,
    (SELECT COUNT(*) FROM time_logs WHERE service_id = s.id) as time_entries
FROM services s
ORDER BY s.id;

-- Display employee workload
SELECT 
    ea.employee_id,
    COUNT(DISTINCT ea.service_id) as active_assignments,
    SUM(s.estimated_hours) as total_estimated_hours,
    (SELECT COALESCE(SUM(hours_worked), 0) FROM time_logs WHERE employee_id = ea.employee_id) as total_logged_hours
FROM employee_assignments ea
JOIN services s ON ea.service_id = s.id
WHERE ea.is_active = true
GROUP BY ea.employee_id;
