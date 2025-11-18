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

async function checkAppointments() {
  try {
    console.log('\n=== Checking Services/Appointments ===');
    const result = await pool.query(
      "SELECT COUNT(*) as total FROM services"
    );
    console.log('Total Services/Appointments:', result.rows[0].total);

    const detailsResult = await pool.query(
      `SELECT id, title, service_type, status, scheduled_date, vehicle_number 
       FROM services 
       ORDER BY scheduled_date DESC 
       LIMIT 5`
    );
    console.log('\nSample Appointments:');
    console.log(detailsResult.rows);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
  }
}

checkAppointments();
