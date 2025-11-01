-- Database Schema for Employee Time Logging & Service Management

-- Note: users table already exists with UUID primary key
-- We will create our tables to work with existing users table

-- Services/Projects Table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    customer_id UUID, -- UUID to match existing users table if users table exists
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100),
    service_type VARCHAR(50) NOT NULL, -- 'service' or 'project'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    estimated_hours DECIMAL(10,2),
    total_hours_logged DECIMAL(10,2) DEFAULT 0,
    scheduled_date TIMESTAMP,
    completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Assignments Table
CREATE TABLE IF NOT EXISTS employee_assignments (
    id SERIAL PRIMARY KEY,
    employee_id UUID, -- UUID to match existing users table
    service_id INTEGER, -- Integer to match services table
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(100), -- e.g., 'Mechanic', 'Technician', 'Inspector'
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, service_id)
);

-- Time Logs Table
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    employee_id UUID, -- UUID to match existing users table
    service_id INTEGER, -- Integer to match services table
    assignment_id INTEGER, -- Integer to match employee_assignments table
    log_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours_worked DECIMAL(10,2) NOT NULL,
    work_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, approved, rejected
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_customer ON services(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON employee_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_service ON employee_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_timelogs_employee ON time_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_timelogs_service ON time_logs(service_id);
CREATE INDEX IF NOT EXISTS idx_timelogs_date ON time_logs(log_date);

-- Trigger to update total_hours_logged in services table
CREATE OR REPLACE FUNCTION update_service_hours()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE services 
    SET total_hours_logged = (
        SELECT COALESCE(SUM(hours_worked), 0) 
        FROM time_logs 
        WHERE service_id = NEW.service_id AND status = 'approved'
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.service_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_service_hours
AFTER INSERT OR UPDATE ON time_logs
FOR EACH ROW
EXECUTE FUNCTION update_service_hours();

-- Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
    -- Add foreign key for services.customer_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'services_customer_id_fkey'
    ) THEN
        ALTER TABLE services 
        ADD CONSTRAINT services_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for employee_assignments.employee_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_assignments_employee_id_fkey'
    ) THEN
        ALTER TABLE employee_assignments 
        ADD CONSTRAINT employee_assignments_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for employee_assignments.service_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_assignments_service_id_fkey'
    ) THEN
        ALTER TABLE employee_assignments 
        ADD CONSTRAINT employee_assignments_service_id_fkey 
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for time_logs.employee_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_logs_employee_id_fkey'
    ) THEN
        ALTER TABLE time_logs 
        ADD CONSTRAINT time_logs_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for time_logs.service_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_logs_service_id_fkey'
    ) THEN
        ALTER TABLE time_logs 
        ADD CONSTRAINT time_logs_service_id_fkey 
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for time_logs.assignment_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_logs_assignment_id_fkey'
    ) THEN
        ALTER TABLE time_logs 
        ADD CONSTRAINT time_logs_assignment_id_fkey 
        FOREIGN KEY (assignment_id) REFERENCES employee_assignments(id) ON DELETE CASCADE;
    END IF;

    -- Add unique constraint for employee_assignments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_assignments_employee_id_service_id_key'
    ) THEN
        ALTER TABLE employee_assignments 
        ADD CONSTRAINT employee_assignments_employee_id_service_id_key 
        UNIQUE(employee_id, service_id);
    END IF;
END $$;

-- Sample data (optional - for testing)
-- Note: Sample data has been moved to test_data.sql
-- Do not insert data here as it needs proper UUID values from your users table
/*
INSERT INTO services (customer_id, vehicle_number, vehicle_model, service_type, title, description, status, priority, estimated_hours, scheduled_date)
VALUES 
    (1, 'ABC-1234', 'Toyota Camry 2020', 'service', 'Regular Maintenance', 'Oil change, filter replacement, tire rotation', 'in_progress', 'normal', 3.0, NOW() + INTERVAL '2 days'),
    (1, 'XYZ-5678', 'Honda Civic 2019', 'project', 'Engine Overhaul', 'Complete engine rebuild and performance tuning', 'pending', 'high', 40.0, NOW() + INTERVAL '5 days'),
    (2, 'LMN-9012', 'BMW X5 2021', 'service', 'Brake Service', 'Brake pad replacement and fluid check', 'pending', 'normal', 2.5, NOW() + INTERVAL '3 days')
ON CONFLICT DO NOTHING;
*/
