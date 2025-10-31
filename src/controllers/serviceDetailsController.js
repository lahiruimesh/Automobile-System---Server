import pool from '../config/db.js';

// Get detailed service information
export const getServiceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    // Check if employee has access to this service
    const accessCheck = await pool.query(
      'SELECT id FROM employee_assignments WHERE service_id = $1 AND employee_id = $2',
      [id, employeeId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this service' });
    }

    // Get service details with customer info
    const serviceQuery = `
      SELECT 
        s.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        u.address as customer_address
      FROM services s
      LEFT JOIN users u ON s.customer_id = u.id
      WHERE s.id = $1
    `;

    // Get photos
    const photosQuery = `
      SELECT sp.*, u.full_name as uploaded_by_name
      FROM service_photos sp
      LEFT JOIN users u ON sp.employee_id = u.id
      WHERE sp.service_id = $1
      ORDER BY sp.uploaded_at DESC
    `;

    // Get notes
    const notesQuery = `
      SELECT sn.*, u.full_name as author_name
      FROM service_notes sn
      LEFT JOIN users u ON sn.employee_id = u.id
      WHERE sn.service_id = $1
      ORDER BY sn.created_at DESC
    `;

    // Get tasks
    const tasksQuery = `
      SELECT st.*, u.full_name as completed_by_name
      FROM service_tasks st
      LEFT JOIN users u ON st.completed_by = u.id
      WHERE st.service_id = $1
      ORDER BY st.display_order, st.id
    `;

    // Get parts requests
    const partsQuery = `
      SELECT 
        pr.*,
        pi.part_name,
        pi.part_number,
        pi.quantity_available,
        u1.full_name as requested_by_name,
        u2.full_name as approved_by_name
      FROM parts_requests pr
      LEFT JOIN parts_inventory pi ON pr.part_id = pi.id
      LEFT JOIN users u1 ON pr.employee_id = u1.id
      LEFT JOIN users u2 ON pr.approved_by = u2.id
      WHERE pr.service_id = $1
      ORDER BY pr.requested_at DESC
    `;

    // Get time logs
    const timeLogsQuery = `
      SELECT tl.*, u.full_name as employee_name
      FROM time_logs tl
      LEFT JOIN users u ON tl.employee_id = u.id
      WHERE tl.service_id = $1
      ORDER BY tl.log_date DESC, tl.start_time DESC
    `;

    const [service, photos, notes, tasks, parts, timeLogs] = await Promise.all([
      pool.query(serviceQuery, [id]),
      pool.query(photosQuery, [id]),
      pool.query(notesQuery, [id]),
      pool.query(tasksQuery, [id]),
      pool.query(partsQuery, [id]),
      pool.query(timeLogsQuery, [id])
    ]);

    if (service.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Calculate progress
    const totalTasks = tasks.rows.length;
    const completedTasks = tasks.rows.filter(t => t.is_completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      service: service.rows[0],
      photos: photos.rows,
      notes: notes.rows,
      tasks: tasks.rows,
      partsRequests: parts.rows,
      timeLogs: timeLogs.rows,
      progress: {
        total: totalTasks,
        completed: completedTasks,
        percentage: progress
      }
    });
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload service photo
export const uploadServicePhoto = async (req, res) => {
  try {
    const { service_id, photo_url, photo_type, description } = req.body;
    const employeeId = req.user.id;

    if (!service_id || !photo_url) {
      return res.status(400).json({ message: 'Service ID and photo URL are required' });
    }

    const result = await pool.query(
      `INSERT INTO service_photos (service_id, employee_id, photo_url, photo_type, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [service_id, employeeId, photo_url, photo_type, description]
    );

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete service photo
export const deleteServicePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const result = await pool.query(
      'DELETE FROM service_photos WHERE id = $1 AND employee_id = $2 RETURNING *',
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Photo not found or access denied' });
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add service note
export const addServiceNote = async (req, res) => {
  try {
    const { service_id, note_text, note_type, is_important } = req.body;
    const employeeId = req.user.id;

    if (!service_id || !note_text) {
      return res.status(400).json({ message: 'Service ID and note text are required' });
    }

    const result = await pool.query(
      `INSERT INTO service_notes (service_id, employee_id, note_text, note_type, is_important)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [service_id, employeeId, note_text, note_type, is_important]
    );

    res.status(201).json({
      message: 'Note added successfully',
      note: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update service note
export const updateServiceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note_text, is_important } = req.body;
    const employeeId = req.user.id;

    const result = await pool.query(
      `UPDATE service_notes 
       SET note_text = COALESCE($1, note_text),
           is_important = COALESCE($2, is_important),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND employee_id = $4
       RETURNING *`,
      [note_text, is_important, id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or access denied' });
    }

    res.json({
      message: 'Note updated successfully',
      note: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete service note
export const deleteServiceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const result = await pool.query(
      'DELETE FROM service_notes WHERE id = $1 AND employee_id = $2 RETURNING *',
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or access denied' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add service task
export const addServiceTask = async (req, res) => {
  try {
    const { service_id, task_name, description, display_order } = req.body;

    if (!service_id || !task_name) {
      return res.status(400).json({ message: 'Service ID and task name are required' });
    }

    const result = await pool.query(
      `INSERT INTO service_tasks (service_id, task_name, description, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [service_id, task_name, description, display_order]
    );

    res.status(201).json({
      message: 'Task added successfully',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle task completion
export const toggleTaskCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    // Get current status
    const current = await pool.query('SELECT is_completed FROM service_tasks WHERE id = $1', [id]);
    
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const newStatus = !current.rows[0].is_completed;

    const result = await pool.query(
      `UPDATE service_tasks 
       SET is_completed = $1,
           completed_by = $2,
           completed_at = $3
       WHERE id = $4
       RETURNING *`,
      [newStatus, newStatus ? employeeId : null, newStatus ? new Date() : null, id]
    );

    res.json({
      message: newStatus ? 'Task marked as completed' : 'Task marked as incomplete',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete service task
export const deleteServiceTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM service_tasks WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
