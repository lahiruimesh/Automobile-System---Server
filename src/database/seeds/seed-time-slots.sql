-- Seed Time Slots for Next 30 Days (9AM - 5PM, 1-hour increments)
-- Starting Date: 2025-10-31 (Friday)
-- Purpose: Generate available appointment slots

-- Function to generate time slots for a date range
DO $$
DECLARE
  start_date DATE := '2025-10-31';
  end_date DATE := start_date + INTERVAL '30 days';
  loop_date DATE;
  current_hour INTEGER;
  slot_start_time TIME;
  slot_end_time TIME;
BEGIN
  -- Loop through each date
  loop_date := start_date;
  
  WHILE loop_date <= end_date LOOP
    -- Generate slots from 9 AM to 5 PM (last slot starts at 4 PM)
    FOR current_hour IN 9..16 LOOP
      slot_start_time := (current_hour || ':00:00')::TIME;
      slot_end_time := ((current_hour + 1) || ':00:00')::TIME;
      
      -- Insert the time slot
      INSERT INTO time_slots (date, start_time, end_time, is_available)
      VALUES (loop_date, slot_start_time, slot_end_time, TRUE)
      ON CONFLICT (date, start_time) DO NOTHING;
    END LOOP;
    
    -- Move to next date
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
  
  RAISE NOTICE 'Generated time slots from % to %', start_date, end_date;
END $$;

-- Verify the seed
SELECT 
  COUNT(*) as total_slots,
  COUNT(*) FILTER (WHERE is_available = TRUE) as available_slots,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM time_slots;
