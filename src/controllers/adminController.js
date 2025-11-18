import pool from "../config/db.js";

// Get pending employees
export const getPendingEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee' AND is_active = false"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching employees" });
  }
};

// Approve employee
export const approveEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("UPDATE users SET is_active = true WHERE id = $1", [id]);
    res.json({ message: "Employee approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error approving employee" });
  }
};

// Request appointment modification (Customer)
export const requestAppointmentModification = async (req, res) => {
  const { appointmentId } = req.params;
  const { newSlotId, reason } = req.body;
  const customerId = req.user.id;

  try {
    // Verify appointment belongs to customer and is confirmed
    const appointmentCheck = await pool.query(
      "SELECT * FROM appointments WHERE id = $1 AND customer_id = $2 AND status = 'confirmed'",
      [appointmentId, customerId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ 
        message: "Appointment not found or cannot be modified" 
      });
    }

    // Verify new slot is available
    const slotCheck = await pool.query(
      "SELECT * FROM time_slots WHERE id = $1 AND is_available = true",
      [newSlotId]
    );

    if (slotCheck.rows.length === 0) {
      return res.status(400).json({ 
        message: "Selected time slot is not available" 
      });
    }

    // Create modification request
    const result = await pool.query(
      `INSERT INTO appointment_modifications 
       (appointment_id, customer_id, old_slot_id, new_slot_id, reason, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING *`,
      [
        appointmentId,
        customerId,
        appointmentCheck.rows[0].slot_id,
        newSlotId,
        reason
      ]
    );

    res.status(201).json({
      message: "Modification request submitted successfully",
      modification: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting modification request" });
  }
};

// Get modification requests (Employee/Admin)
export const getModificationRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        am.*,
        a.vehicle_id,
        u.full_name as customer_name,
        u.email as customer_email,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        old_slot.date as old_date,
        old_slot.start_time as old_start_time,
        old_slot.end_time as old_end_time,
        new_slot.date as new_date,
        new_slot.start_time as new_start_time,
        new_slot.end_time as new_end_time
       FROM appointment_modifications am
       JOIN appointments a ON am.appointment_id = a.id
       JOIN users u ON am.customer_id = u.id
       JOIN vehicles v ON a.vehicle_id = v.id
       JOIN time_slots old_slot ON am.old_slot_id = old_slot.id
       JOIN time_slots new_slot ON am.new_slot_id = new_slot.id
       WHERE am.status = 'pending'
       ORDER BY am.created_at DESC`
    );

    res.json({ modifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching modification requests" });
  }
};

// Approve modification request (Employee/Admin)
export const approveModificationRequest = async (req, res) => {
  const { modificationId } = req.params;

  try {
    // Get modification details
    const modResult = await pool.query(
      "SELECT * FROM appointment_modifications WHERE id = $1 AND status = 'pending'",
      [modificationId]
    );

    if (modResult.rows.length === 0) {
      return res.status(404).json({ 
        message: "Modification request not found or already processed" 
      });
    }

    const modification = modResult.rows[0];

    // Start transaction
    await pool.query("BEGIN");

    // Update old slot to available
    await pool.query(
      "UPDATE time_slots SET is_available = true WHERE id = $1",
      [modification.old_slot_id]
    );

    // Update new slot to unavailable
    await pool.query(
      "UPDATE time_slots SET is_available = false WHERE id = $1",
      [modification.new_slot_id]
    );

    // Update appointment with new slot
    await pool.query(
      "UPDATE appointments SET slot_id = $1 WHERE id = $2",
      [modification.new_slot_id, modification.appointment_id]
    );

    // Update modification status
    await pool.query(
      "UPDATE appointment_modifications SET status = 'approved', processed_at = NOW() WHERE id = $1",
      [modificationId]
    );

    await pool.query("COMMIT");

    res.json({ message: "Modification request approved successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Error approving modification request" });
  }
};

// Reject modification request (Employee/Admin)
export const rejectModificationRequest = async (req, res) => {
  const { modificationId } = req.params;
  const { rejectionReason } = req.body;

  try {
    const result = await pool.query(
      `UPDATE appointment_modifications 
       SET status = 'rejected', 
           rejection_reason = $1, 
           processed_at = NOW() 
       WHERE id = $2 AND status = 'pending' 
       RETURNING *`,
      [rejectionReason, modificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: "Modification request not found or already processed" 
      });
    }

    res.json({ 
      message: "Modification request rejected", 
      modification: result.rows[0] 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error rejecting modification request" });
  }
};

// Get customer's modification requests
export const getMyModificationRequests = async (req, res) => {
  const customerId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        am.*,
        v.make as vehicle_make,
        v.model as vehicle_model,
        old_slot.date as old_date,
        old_slot.start_time as old_start_time,
        old_slot.end_time as old_end_time,
        new_slot.date as new_date,
        new_slot.start_time as new_start_time,
        new_slot.end_time as new_end_time
       FROM appointment_modifications am
       JOIN appointments a ON am.appointment_id = a.id
       JOIN vehicles v ON a.vehicle_id = v.id
       JOIN time_slots old_slot ON am.old_slot_id = old_slot.id
       JOIN time_slots new_slot ON am.new_slot_id = new_slot.id
       WHERE am.customer_id = $1
       ORDER BY am.created_at DESC`,
      [customerId]
    );

    res.json({ modifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching modification requests" });
  }
};

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, full_name, email, role, phone, address, date_of_birth, emergency_contact, emergency_name, is_active FROM users WHERE role = 'employee'");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching employees" 
    });
  }
};

// get total employees count
export const getTotalEmployeesCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'employee'");
    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching total employees count" });
  }
};

// get total customers count
export const getTotalCustomersCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'customer'");
    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching total customers count" });
  }
};

// get total appointments count
export const getTotalAppointmentsCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM service_requests");
    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching total appointments count" });
  }
};

// get total completed services count
export const getTotalCompletedServicesCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM service_requests WHERE status = 'completed'");
    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching total completed services count" });
  }
};

//add new employee
export const addNewEmployee = async (req, res) => {
  const { full_name, email, password, role, phone, address, date_of_birth, emergency_contact, emergency_name } = req.body;
  try {
    const result = await pool.query("INSERT INTO users (full_name, email, password, role, phone, address, date_of_birth, emergency_contact, emergency_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id", [full_name, email, password, role, phone, address, date_of_birth, emergency_contact, emergency_name]);
    res.json({ message: "Employee added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding new employee" });
  }
};

// update employee
export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, phone, address, date_of_birth, emergency_contact, emergency_name } = req.body;
  try {
    const result = await pool.query("UPDATE users SET full_name = $1, email = $2, role = $3, phone = $4, address = $5, date_of_birth = $6, emergency_contact = $7, emergency_name = $8 WHERE id = $9", [full_name, email, role, phone, address, date_of_birth, emergency_contact, emergency_name, id]);
    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating employee" });
  }
};

// delete employee
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting employee" });
  }
};

//get customer details
export const getAllCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, address, created_at AS registered_date 
       FROM users 
       WHERE role = 'customer'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Error fetching customers" });
  }
};

//get vehicle for customer id
export const getCustomerVehicles = async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await pool.query(
      `SELECT id, license_plate, make, model, year, color
       FROM vehicles
       WHERE customer_id = $1
       ORDER BY year DESC`,
      [customerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customer vehicles:", err);
    res.status(500).json({ message: "Error fetching customer vehicles" });
  }
};

//get service details of customers
export const getCustomerServiceHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `SELECT id, created_at, service_type, description, status
       FROM service_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [customerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching service history:", err);
    res.status(500).json({ message: "Error fetching service history" });
  }
};

// Get all appointment details with customer and employee info
export const getAllAppointments = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.status,
        a.service_type,
        a.notes,
        a.booked_at,
        a.confirmed_at,
        a.completed_at,
        
        -- Customer details
        u.id AS customer_id,
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        u.email AS customer_email,
        
        -- Vehicle details
        v.make AS vehicle_make,
        v.model AS vehicle_model,
        v.year AS vehicle_year,
        v.license_plate,
        
        -- Time slot details
        ts.date AS appointment_date,
        ts.start_time,
        ts.end_time,
        
        -- Assigned employee details
        emp.id AS assigned_employee_id,
        emp.full_name AS assigned_employee_name
        
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN time_slots ts ON a.slot_id = ts.id
      LEFT JOIN users emp ON a.assigned_employee_id = emp.id
      ORDER BY ts.date DESC, ts.start_time DESC;
    `;

    const result = await pool.query(query);
    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching appointments" 
    });
  }
};


//get monthly appointment count - group by month
export const getMonthlyAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(booked_at, 'Mon') AS month,
        COUNT(*) AS count
      FROM appointments
      WHERE booked_at >= NOW() - INTERVAL '12 months'
      GROUP BY month, EXTRACT(MONTH FROM booked_at)
      ORDER BY EXTRACT(MONTH FROM booked_at);
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching monthly appointments:", error);
    res.status(500).json({ message: "Error fetching monthly appointments" });
  }
};

//get weekly appointment count - group by date
export const getWeeklyAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(booked_at, 'Dy') AS day,
        COUNT(*) AS count
      FROM appointments
      WHERE booked_at>= NOW() - INTERVAL '7 days'
      GROUP BY day, EXTRACT(DOW FROM booked_at)
      ORDER BY EXTRACT(DOW FROM booked_at);
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching weekly appointments:", error);
    res.status(500).json({ message: "Error fetching weekly appointments" });
  }
};


// Get service status summary 
export const getServiceStatusSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        status,
        COUNT(*) AS count
      FROM services
      GROUP BY status;
    `);

    // Format result nicely
    const summary = {
      total: 0,
      completed: 0,
      in_progress: 0,
      cancelled: 0,
    };

    result.rows.forEach(row => {
      const status = row.status.toLowerCase();
      summary.total += parseInt(row.count, 10);
      if (status.includes("completed")) summary.completed = parseInt(row.count, 10);
      else if (status.includes("in_progress")) summary.in_progress = parseInt(row.count, 10);
      else if (status.includes("cancel")) summary.cancelled = parseInt(row.count, 10);
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching service summary:", error);
    res.status(500).json({ message: "Error fetching service status summary" });
  }
};

// GET all employee report data
export const getEmployeeReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id AS employee_id,
        u.full_name AS name,
        u.phone,
        u.email,
        u.address,
        TO_CHAR(u.date_of_birth, 'YYYY-MM-DD') AS dob,
        TO_CHAR(u.created_at, 'YYYY-MM-DD') AS date_joined,
        COALESCE(COUNT(DISTINCT ea.service_id), 0) AS total_assigned_appointments,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0) AS total_completed_appointments
      FROM users u
      LEFT JOIN employee_assignments ea ON ea.employee_id = u.id
      LEFT JOIN services s ON s.id = ea.service_id
      WHERE u.role = 'employee'
      GROUP BY u.id, u.full_name, u.phone, u.email, u.address, u.date_of_birth, u.created_at
      ORDER BY u.created_at DESC;
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching employee report:", error);
    res.status(500).json({ message: "Error fetching employee report" });
  }
};



// GET all customer report data
export const getCustomerReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.full_name AS name,
        u.phone,
        u.email,
        u.address,
        TO_CHAR(u.created_at, 'YYYY-MM-DD') AS joinedDate,
        COUNT(a.id) AS totalAppointments
      FROM users u
      LEFT JOIN appointments a ON u.id = a.customer_id
      GROUP BY u.id, u.full_name, u.phone, u.email, u.address, u.created_at
      ORDER BY u.created_at DESC;
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching customer report:", error);
    res.status(500).json({ message: "Error fetching customer report" });
  }
};


//  GET appointment summary with joined user details
export const getAppointmentReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id AS service_id,
        s.title,
        s.description,
        s.service_type,
        s.vehicle_number,
        s.vehicle_model,
        s.estimated_hours,
        TO_CHAR(s.scheduled_date, 'YYYY-MM-DD') AS scheduled_date,
        s.status,
        c.full_name AS customer
      FROM services s
      LEFT JOIN users c ON s.customer_id = c.id
      ORDER BY s.scheduled_date DESC;
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching appointment report:", error);
    res.status(500).json({ message: "Error fetching appointment report" });
  }
};

// Assign employee to service
export const assignEmployeeToService = async (req, res) => {
  const { serviceId } = req.params;
  const { employeeId } = req.body;

  try {
    console.log("🔧 Assigning employee:", { serviceId, employeeId });

    // Check if service request exists
    const serviceCheck = await pool.query(
      "SELECT * FROM service_requests WHERE id = $1",
      [serviceId]
    );

    if (serviceCheck.rows.length === 0) {
      console.log("❌ Service request not found:", serviceId);
      return res.status(404).json({ 
        success: false,
        message: "Service request not found" 
      });
    }

    console.log("✅ Service request found:", serviceCheck.rows[0]);

    // Check if employee exists and is active
    const employeeCheck = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'employee' AND is_active = true",
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      console.log("❌ Employee not found or inactive:", employeeId);
      return res.status(404).json({ 
        success: false,
        message: "Employee not found or inactive" 
      });
    }

    console.log("✅ Employee found:", employeeCheck.rows[0].full_name);

    // Check if assignment already exists
    const existingAssignment = await pool.query(
      "SELECT * FROM employee_assignments WHERE service_id = $1",
      [serviceId]
    );

    if (existingAssignment.rows.length > 0) {
      // Update existing assignment
      await pool.query(
        "UPDATE employee_assignments SET employee_id = $1, assigned_date = NOW() WHERE service_id = $2",
        [employeeId, serviceId]
      );
      console.log("✅ Updated existing assignment");
    } else {
      // Create new assignment
      await pool.query(
        "INSERT INTO employee_assignments (service_id, employee_id, assigned_date) VALUES ($1, $2, NOW())",
        [serviceId, employeeId]
      );
      console.log("✅ Created new assignment");
    }

    // Update service request status to 'in-progress' if it's 'pending'
    await pool.query(
      "UPDATE service_requests SET status = CASE WHEN status = 'pending' THEN 'in-progress' ELSE status END WHERE id = $1",
      [serviceId]
    );
    console.log("✅ Updated service request status");

    res.json({ 
      success: true,
      message: "Employee assigned successfully",
      serviceId,
      employeeId
    });
  } catch (err) {
    console.error("Error assigning employee:", err);
    res.status(500).json({ message: "Error assigning employee" });
  }
};
