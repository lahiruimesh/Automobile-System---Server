import pool from "../config/db.js";

// ==================== EMPLOYEE ASSIGNMENTS ====================

// Get all assignments for logged-in employee
export const getMyAssignments = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT 
        ea.id as assignment_id,
        ea.role as assignment_role,
        ea.assigned_date,
        ea.notes as assignment_notes,
        ea.is_active,
        s.id as service_id,
        s.vehicle_number,
        s.vehicle_model,
        s.service_type,
        s.title,
        s.description,
        s.status,
        s.priority,
        s.estimated_hours,
        s.total_hours_logged,
        s.scheduled_date,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone
       FROM employee_assignments ea
       JOIN services s ON ea.service_id = s.id
       JOIN users u ON s.customer_id = u.id
       WHERE ea.employee_id = $1 AND ea.is_active = true
       ORDER BY s.priority DESC, s.scheduled_date ASC`,
      [employeeId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      assignments: result.rows,
    });
  } catch (err) {
    console.error("Get assignments error:", err);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

// Get single assignment details
export const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT 
        ea.id as assignment_id,
        ea.role as assignment_role,
        ea.assigned_date,
        ea.notes as assignment_notes,
        ea.is_active,
        s.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone
       FROM employee_assignments ea
       JOIN services s ON ea.service_id = s.id
       JOIN users u ON s.customer_id = u.id
       WHERE ea.id = $1 AND ea.employee_id = $2`,
      [assignmentId, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({
      success: true,
      assignment: result.rows[0],
    });
  } catch (err) {
    console.error("Get assignment error:", err);
    res.status(500).json({ message: "Failed to fetch assignment" });
  }
};

// ==================== TIME LOGS ====================

// Create a new time log entry
export const createTimeLog = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const {
      service_id,
      assignment_id,
      log_date,
      start_time,
      end_time,
      work_description,
      notes,
    } = req.body;

    // Validate employee has this assignment
    const assignmentCheck = await pool.query(
      `SELECT id FROM employee_assignments 
       WHERE id = $1 AND employee_id = $2 AND is_active = true`,
      [assignment_id, employeeId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: "Invalid assignment" });
    }

    // Calculate hours worked
    const startDateTime = new Date(`${log_date}T${start_time}`);
    const endDateTime = new Date(`${log_date}T${end_time}`);
    const hoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);

    if (hoursWorked <= 0) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    const result = await pool.query(
      `INSERT INTO time_logs 
       (employee_id, service_id, assignment_id, log_date, start_time, end_time, hours_worked, work_description, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        employeeId,
        service_id,
        assignment_id,
        log_date,
        start_time,
        end_time,
        hoursWorked.toFixed(2),
        work_description,
        notes,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Time log created successfully",
      timeLog: result.rows[0],
    });
  } catch (err) {
    console.error("Create time log error:", err);
    res.status(500).json({ message: "Failed to create time log" });
  }
};

// Get all time logs for logged-in employee
export const getMyTimeLogs = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { service_id, start_date, end_date, status } = req.query;

    let query = `
      SELECT 
        tl.*,
        s.title as service_title,
        s.vehicle_number,
        s.service_type,
        ea.role as assignment_role
      FROM time_logs tl
      JOIN services s ON tl.service_id = s.id
      JOIN employee_assignments ea ON tl.assignment_id = ea.id
      WHERE tl.employee_id = $1
    `;

    const params = [employeeId];
    let paramCount = 1;

    if (service_id) {
      paramCount++;
      query += ` AND tl.service_id = $${paramCount}`;
      params.push(service_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND tl.log_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND tl.log_date <= $${paramCount}`;
      params.push(end_date);
    }

    if (status) {
      paramCount++;
      query += ` AND tl.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY tl.log_date DESC, tl.created_at DESC`;

    const result = await pool.query(query, params);

    // Calculate total hours
    const totalHours = result.rows.reduce(
      (sum, log) => sum + parseFloat(log.hours_worked),
      0
    );

    res.json({
      success: true,
      count: result.rows.length,
      totalHours: totalHours.toFixed(2),
      timeLogs: result.rows,
    });
  } catch (err) {
    console.error("Get time logs error:", err);
    res.status(500).json({ message: "Failed to fetch time logs" });
  }
};

// Update a time log
export const updateTimeLog = async (req, res) => {
  try {
    const { timeLogId } = req.params;
    const employeeId = req.user.id;
    const { log_date, start_time, end_time, work_description, notes } =
      req.body;

    // Check ownership
    const ownerCheck = await pool.query(
      `SELECT * FROM time_logs WHERE id = $1 AND employee_id = $2`,
      [timeLogId, employeeId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Prevent editing approved logs
    if (ownerCheck.rows[0].status === "approved") {
      return res
        .status(400)
        .json({ message: "Cannot edit approved time logs" });
    }

    // Calculate new hours
    const startDateTime = new Date(`${log_date}T${start_time}`);
    const endDateTime = new Date(`${log_date}T${end_time}`);
    const hoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);

    if (hoursWorked <= 0) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    const result = await pool.query(
      `UPDATE time_logs 
       SET log_date = $1, start_time = $2, end_time = $3, 
           hours_worked = $4, work_description = $5, notes = $6, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND employee_id = $8
       RETURNING *`,
      [
        log_date,
        start_time,
        end_time,
        hoursWorked.toFixed(2),
        work_description,
        notes,
        timeLogId,
        employeeId,
      ]
    );

    res.json({
      success: true,
      message: "Time log updated successfully",
      timeLog: result.rows[0],
    });
  } catch (err) {
    console.error("Update time log error:", err);
    res.status(500).json({ message: "Failed to update time log" });
  }
};

// Delete a time log
export const deleteTimeLog = async (req, res) => {
  try {
    const { timeLogId } = req.params;
    const employeeId = req.user.id;

    // Check ownership and status
    const ownerCheck = await pool.query(
      `SELECT * FROM time_logs WHERE id = $1 AND employee_id = $2`,
      [timeLogId, employeeId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (ownerCheck.rows[0].status === "approved") {
      return res
        .status(400)
        .json({ message: "Cannot delete approved time logs" });
    }

    await pool.query(`DELETE FROM time_logs WHERE id = $1`, [timeLogId]);

    res.json({
      success: true,
      message: "Time log deleted successfully",
    });
  } catch (err) {
    console.error("Delete time log error:", err);
    res.status(500).json({ message: "Failed to delete time log" });
  }
};

// ==================== REPORTS & ANALYTICS ====================

// Get weekly time report
export const getWeeklyReport = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { week_start } = req.query; // Format: YYYY-MM-DD

    const weekStart = week_start || new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `SELECT 
        DATE(log_date) as date,
        SUM(hours_worked) as total_hours,
        COUNT(*) as entry_count,
        json_agg(json_build_object(
          'id', id,
          'service_id', service_id,
          'hours_worked', hours_worked,
          'work_description', work_description,
          'status', status
        )) as entries
       FROM time_logs
       WHERE employee_id = $1 
         AND log_date >= $2::date 
         AND log_date < $2::date + INTERVAL '7 days'
       GROUP BY DATE(log_date)
       ORDER BY date ASC`,
      [employeeId, weekStart]
    );

    const totalWeekHours = result.rows.reduce(
      (sum, day) => sum + parseFloat(day.total_hours),
      0
    );

    res.json({
      success: true,
      weekStart,
      totalWeekHours: totalWeekHours.toFixed(2),
      dailyBreakdown: result.rows,
    });
  } catch (err) {
    console.error("Get weekly report error:", err);
    res.status(500).json({ message: "Failed to fetch weekly report" });
  }
};

// Get monthly time report
export const getMonthlyReport = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { year, month } = req.query;

    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month || currentDate.getMonth() + 1;

    const result = await pool.query(
      `SELECT 
        s.title as service_title,
        s.vehicle_number,
        s.service_type,
        SUM(tl.hours_worked) as total_hours,
        COUNT(tl.id) as entry_count,
        MIN(tl.log_date) as first_entry,
        MAX(tl.log_date) as last_entry
       FROM time_logs tl
       JOIN services s ON tl.service_id = s.id
       WHERE tl.employee_id = $1 
         AND EXTRACT(YEAR FROM tl.log_date) = $2
         AND EXTRACT(MONTH FROM tl.log_date) = $3
       GROUP BY s.id, s.title, s.vehicle_number, s.service_type
       ORDER BY total_hours DESC`,
      [employeeId, reportYear, reportMonth]
    );

    const totalMonthHours = result.rows.reduce(
      (sum, service) => sum + parseFloat(service.total_hours),
      0
    );

    res.json({
      success: true,
      year: reportYear,
      month: reportMonth,
      totalMonthHours: totalMonthHours.toFixed(2),
      serviceBreakdown: result.rows,
    });
  } catch (err) {
    console.error("Get monthly report error:", err);
    res.status(500).json({ message: "Failed to fetch monthly report" });
  }
};

// Get service/project statistics
export const getServiceStats = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { service_id } = req.params;

    // Verify employee is assigned to this service
    const assignmentCheck = await pool.query(
      `SELECT * FROM employee_assignments 
       WHERE service_id = $1 AND employee_id = $2`,
      [service_id, employeeId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: "Not assigned to this service" });
    }

    const result = await pool.query(
      `SELECT 
        s.*,
        u.full_name as customer_name,
        COUNT(tl.id) as total_entries,
        SUM(tl.hours_worked) as hours_logged_by_me,
        s.total_hours_logged as total_hours_all_employees
       FROM services s
       JOIN users u ON s.customer_id = u.id
       LEFT JOIN time_logs tl ON s.id = tl.service_id AND tl.employee_id = $2
       WHERE s.id = $1
       GROUP BY s.id, u.full_name`,
      [service_id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Get recent time logs for this service
    const recentLogs = await pool.query(
      `SELECT * FROM time_logs 
       WHERE service_id = $1 AND employee_id = $2
       ORDER BY log_date DESC, created_at DESC
       LIMIT 10`,
      [service_id, employeeId]
    );

    res.json({
      success: true,
      service: result.rows[0],
      recentLogs: recentLogs.rows,
    });
  } catch (err) {
    console.error("Get service stats error:", err);
    res.status(500).json({ message: "Failed to fetch service statistics" });
  }
};

// Update service status (employee can update status)
export const updateServiceStatus = async (req, res) => {
  try {
    const { service_id } = req.params;
    const { status } = req.body; // pending, in_progress, completed
    const employeeId = req.user.id;

    // Verify employee is assigned
    const assignmentCheck = await pool.query(
      `SELECT * FROM employee_assignments 
       WHERE service_id = $1 AND employee_id = $2 AND is_active = true`,
      [service_id, employeeId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: "Not assigned to this service" });
    }

    const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE services 
       SET status = $1, 
           completion_date = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completion_date END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, service_id]
    );

    res.json({
      success: true,
      message: "Service status updated successfully",
      service: result.rows[0],
    });
  } catch (err) {
    console.error("Update service status error:", err);
    res.status(500).json({ message: "Failed to update service status" });
  }
};
