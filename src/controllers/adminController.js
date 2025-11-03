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