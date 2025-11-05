import pool from "../config/db.js";

// Get pending employees
export const getPendingEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee' AND is_active = 'FALSE'"
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


// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, full_name, email, role,phone, address, date_of_birth, emergency_contact,emergency_name, is_active FROM users WHERE role = 'employee'");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching employees" });
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
        s.id AS service_id,
        s.title,
        s.service_type,
        s.description,
        s.status,
        s.estimated_hours,
        s.total_hours_logged,
        s.scheduled_date,
        s.completion_date,
        s.vehicle_number,
        s.vehicle_model,

        -- Customer details
        u.id AS customer_id,
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        u.email AS customer_email,

        -- Assigned employee details
        e.id AS employee_id,
        e.full_name AS employee_name

      FROM services s
      JOIN users u ON s.customer_id = u.id
      LEFT JOIN employee_assignments ea ON ea.service_id = s.id
      LEFT JOIN users e ON ea.employee_id = e.id
      ORDER BY s.scheduled_date DESC;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ message: "Error fetching appointments" });
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
