-- Seed Sample Vehicles for Testing
-- Purpose: Add test vehicles for customers

-- Insert sample vehicles (assumes customer users exist with IDs 1-3)
INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color) VALUES
  -- Customer 1's vehicles
  (1, 'Toyota', 'Camry', 2020, '1HGBH41JXMN109186', 'ABC123', 'Silver'),
  (1, 'Honda', 'Civic', 2019, '2HGFA16589H301234', 'XYZ789', 'Blue'),
  
  -- Customer 2's vehicles
  (2, 'Ford', 'F-150', 2021, '1FTEW1E54MKE12345', 'DEF456', 'Black'),
  (2, 'Chevrolet', 'Silverado', 2022, '1GCPYCEK1MZ112345', 'GHI012', 'White'),
  
  -- Customer 3's vehicles
  (3, 'Tesla', 'Model 3', 2023, '5YJ3E1EA0KF123456', 'JKL345', 'Red'),
  (3, 'BMW', 'X5', 2021, 'WBAJW7C58JG112345', 'MNO678', 'Gray')
ON CONFLICT (vin) DO NOTHING;

-- Verify the seed
SELECT 
  COUNT(*) as total_vehicles,
  COUNT(DISTINCT customer_id) as unique_customers
FROM vehicles;
