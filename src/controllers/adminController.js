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
