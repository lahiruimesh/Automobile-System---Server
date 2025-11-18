import pool from './src/config/db.js';

async function checkAssignments() {
  try {
    // Check employees
    const employees = await pool.query(
      "SELECT id, email, full_name, role FROM users WHERE role = 'employee'"
    );
    console.log('\n👥 Employees:');
    console.table(employees.rows);

    // Check assigned appointments
    const appointments = await pool.query(
      `SELECT id, status, service_type, assigned_employee_id 
       FROM appointments 
       WHERE assigned_employee_id IS NOT NULL`
    );
    console.log('\n📅 Assigned Appointments:');
    console.table(appointments.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAssignments();
