import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function checkEmployees() {
  try {
    console.log('\n=== Checking All Employees ===');
    const allEmployees = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee'"
    );
    console.log('Total Employees:', allEmployees.rows.length);
    console.log('All Employees:', allEmployees.rows);

    console.log('\n=== Checking Pending Employees (is_active = false) ===');
    const pendingEmployees = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee' AND is_active = false"
    );
    console.log('Pending Employees:', pendingEmployees.rows.length);
    console.log('Details:', pendingEmployees.rows);

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
  }
}

checkEmployees();
