import pool from '../config/db.js';

// Get available parts
export const getAvailableParts = async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT * FROM parts_inventory
      WHERE quantity_available > 0
    `;

    const params = [];
    
    if (search) {
      query += ` AND (part_name ILIKE $1 OR part_number ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY part_name`;

    const result = await pool.query(query, params);

    res.json({
      parts: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create parts request
export const createPartsRequest = async (req, res) => {
  try {
    const { service_id, part_id, quantity_requested, priority, notes } = req.body;
    const employeeId = req.user.id;

    if (!service_id || !part_id || !quantity_requested) {
      return res.status(400).json({ message: 'Service ID, part ID, and quantity are required' });
    }

    // Check if part has enough quantity
    const partCheck = await pool.query(
      'SELECT part_name, quantity_available FROM parts_inventory WHERE id = $1',
      [part_id]
    );

    if (partCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Part not found' });
    }

    const result = await pool.query(
      `INSERT INTO parts_requests (service_id, employee_id, part_id, quantity_requested, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [service_id, employeeId, part_id, quantity_requested, priority, notes]
    );

    // Create notification for admin
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_service_id, priority)
       SELECT id, 'parts_request', 
              'New Parts Request',
              $1,
              $2,
              $3
       FROM users WHERE role = 'admin'`,
      [
        `${partCheck.rows[0].part_name} (Qty: ${quantity_requested}) requested for service #${service_id}`,
        service_id,
        priority
      ]
    );

    res.status(201).json({
      message: 'Parts request created successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating parts request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get my parts requests
export const getMyPartsRequests = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        pr.*,
        pi.part_name,
        pi.part_number,
        pi.quantity_available,
        pi.unit_price,
        s.title as service_title,
        u.full_name as approved_by_name
      FROM parts_requests pr
      LEFT JOIN parts_inventory pi ON pr.part_id = pi.id
      LEFT JOIN services s ON pr.service_id = s.id
      LEFT JOIN users u ON pr.approved_by = u.id
      WHERE pr.employee_id = $1
    `;

    const params = [employeeId];

    if (status) {
      query += ` AND pr.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY pr.requested_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      requests: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching parts requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get parts requests for a service
export const getServicePartsRequests = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const result = await pool.query(
      `SELECT 
        pr.*,
        pi.part_name,
        pi.part_number,
        pi.quantity_available,
        pi.unit_price,
        u1.full_name as requested_by_name,
        u2.full_name as approved_by_name
      FROM parts_requests pr
      LEFT JOIN parts_inventory pi ON pr.part_id = pi.id
      LEFT JOIN users u1 ON pr.employee_id = u1.id
      LEFT JOIN users u2 ON pr.approved_by = u2.id
      WHERE pr.service_id = $1
      ORDER BY pr.requested_at DESC`,
      [serviceId]
    );

    res.json({
      requests: result.rows
    });
  } catch (error) {
    console.error('Error fetching service parts requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
