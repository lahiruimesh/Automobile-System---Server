-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  vehicle_info JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);