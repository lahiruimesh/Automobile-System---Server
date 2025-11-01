-- Enhanced Schema for All New Features
-- Run this to add new tables and columns

-- 1. Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(100);

-- 2. Employee Skills & Certifications
CREATE TABLE IF NOT EXISTS employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50), -- beginner, intermediate, expert
    years_of_experience INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_certifications (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Service Photos
CREATE TABLE IF NOT EXISTS service_photos (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES users(id),
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50), -- before, after, damage, progress, parts
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Service Notes & Comments
CREATE TABLE IF NOT EXISTS service_notes (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES users(id),
    note_type VARCHAR(50), -- internal, customer_request, team_communication
    note_text TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Service Task Checklist
CREATE TABLE IF NOT EXISTS service_tasks (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    display_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Parts & Inventory Requests
CREATE TABLE IF NOT EXISTS parts_inventory (
    id SERIAL PRIMARY KEY,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100) UNIQUE,
    description TEXT,
    quantity_available INT DEFAULT 0,
    unit_price DECIMAL(10, 2),
    minimum_stock_level INT DEFAULT 5,
    supplier_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts_requests (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES users(id),
    part_id INTEGER REFERENCES parts_inventory(id),
    quantity_requested INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, ordered, received, rejected
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id)
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- assignment, status_change, approval, reminder
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    related_time_log_id INTEGER REFERENCES time_logs(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- 8. Employee Availability Calendar
CREATE TABLE IF NOT EXISTS employee_availability (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    reason TEXT, -- vacation, sick_leave, training, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_certifications_employee ON employee_certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_service_photos_service ON service_photos(service_id);
CREATE INDEX IF NOT EXISTS idx_service_notes_service ON service_notes(service_id);
CREATE INDEX IF NOT EXISTS idx_service_tasks_service ON service_tasks(service_id);
CREATE INDEX IF NOT EXISTS idx_parts_requests_service ON parts_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_employee_availability_employee ON employee_availability(employee_id);

-- Add some sample parts inventory
INSERT INTO parts_inventory (part_name, part_number, description, quantity_available, unit_price, supplier_name)
VALUES 
    ('Engine Oil Filter', 'OF-001', 'Standard oil filter for most vehicles', 50, 8.99, 'Auto Parts Co'),
    ('Brake Pad Set - Front', 'BP-F-001', 'Front brake pads (set of 4)', 30, 45.99, 'Brake Masters'),
    ('Air Filter', 'AF-001', 'Engine air filter', 40, 12.99, 'Auto Parts Co'),
    ('Spark Plug Set', 'SP-001', 'Spark plugs (set of 4)', 25, 24.99, 'Engine Pro'),
    ('Windshield Wiper Blades', 'WW-001', 'Premium wiper blades (pair)', 60, 18.99, 'Auto Parts Co'),
    ('Transmission Fluid', 'TF-001', 'Automatic transmission fluid (1L)', 35, 15.99, 'Fluid Masters'),
    ('Brake Fluid', 'BF-001', 'DOT 4 brake fluid (500ml)', 45, 9.99, 'Brake Masters'),
    ('Coolant', 'CL-001', 'Engine coolant (1L)', 40, 11.99, 'Fluid Masters'),
    ('Battery', 'BAT-001', '12V Car Battery', 15, 89.99, 'Power Plus'),
    ('Oxygen Sensor', 'OS-001', 'Universal oxygen sensor', 20, 65.99, 'Engine Pro')
ON CONFLICT (part_number) DO NOTHING;

-- Trigger to update service progress based on completed tasks
CREATE OR REPLACE FUNCTION update_service_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INT;
    completed_tasks INT;
    progress_percentage DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_tasks FROM service_tasks WHERE service_id = NEW.service_id;
    SELECT COUNT(*) INTO completed_tasks FROM service_tasks WHERE service_id = NEW.service_id AND is_completed = TRUE;
    
    IF total_tasks > 0 THEN
        progress_percentage := (completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100;
        -- Note: You may want to add a progress column to services table
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_progress
AFTER UPDATE OF is_completed ON service_tasks
FOR EACH ROW
EXECUTE FUNCTION update_service_progress();
