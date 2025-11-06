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

async function checkData() {
  try {
    console.log('\n=== Checking Customers ===');
    const customers = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'customer'"
    );
    console.log('Total Customers:', customers.rows[0].total);

    const sampleCustomers = await pool.query(
      "SELECT id, full_name, email, phone FROM users WHERE role = 'customer' LIMIT 3"
    );
    console.log('Sample Customers:', sampleCustomers.rows);

    console.log('\n=== Checking Vehicles ===');
    const vehicles = await pool.query("SELECT COUNT(*) as total FROM vehicles");
    console.log('Total Vehicles:', vehicles.rows[0].total);

    console.log('\n=== Checking Services for Reports ===');
    const services = await pool.query("SELECT COUNT(*) as total FROM services");
    console.log('Total Services:', services.rows[0].total);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
  }
}

checkData();
