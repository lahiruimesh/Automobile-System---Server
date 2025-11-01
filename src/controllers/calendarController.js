import pool from '../config/db.js';

// Get my availability calendar
export const getMyAvailability = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;

    let query = `
      SELECT * FROM employee_availability
      WHERE employee_id = $1
    `;

    const params = [employeeId];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
      params.push(month, year);
    }

    query += ` ORDER BY date`;

    const result = await pool.query(query, params);

    res.json({
      availability: result.rows
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set availability
export const setAvailability = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { date, start_time, end_time, is_available, reason } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const result = await pool.query(
      `INSERT INTO employee_availability (employee_id, date, start_time, end_time, is_available, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, date) 
       DO UPDATE SET 
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         is_available = EXCLUDED.is_available,
         reason = EXCLUDED.reason
       RETURNING *`,
      [employeeId, date, start_time, end_time, is_available, reason]
    );

    res.json({
      message: 'Availability updated successfully',
      availability: result.rows[0]
    });
  } catch (error) {
    console.error('Error setting availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get scheduled services (calendar view)
export const getScheduledServices = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;

    let query = `
      SELECT 
        s.id,
        s.title,
        s.service_type,
        s.status,
        s.priority,
        s.scheduled_date,
        s.estimated_hours,
        s.vehicle_number,
        s.vehicle_model,
        u.full_name as customer_name
      FROM employee_assignments ea
      JOIN services s ON ea.service_id = s.id
      LEFT JOIN users u ON s.customer_id = u.id
      WHERE ea.employee_id = $1
        AND ea.is_active = TRUE
        AND s.scheduled_date IS NOT NULL
    `;

    const params = [employeeId];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM s.scheduled_date) = $2 
                 AND EXTRACT(YEAR FROM s.scheduled_date) = $3`;
      params.push(month, year);
    }

    query += ` ORDER BY s.scheduled_date`;

    const result = await pool.query(query, params);

    res.json({
      services: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching scheduled services:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete availability
export const deleteAvailability = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { date } = req.params;

    const result = await pool.query(
      'DELETE FROM employee_availability WHERE employee_id = $1 AND date = $2 RETURNING *',
      [employeeId, date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Availability record not found' });
    }

    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
