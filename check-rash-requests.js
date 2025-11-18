import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkRequests() {
  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      ['rash@gmail.com']
    );
    console.log('User info:', userResult.rows);

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      
      // Get service requests for this user
      const requestsResult = await pool.query(
        `SELECT sr.*, u.full_name as customer_name 
         FROM service_requests sr 
         LEFT JOIN users u ON sr.user_id::uuid = u.id 
         WHERE sr.user_id = $1 
         ORDER BY sr.created_at DESC`,
        [userId]
      );
      console.log('\nService requests for rash@gmail.com:', JSON.stringify(requestsResult.rows, null, 2));
      console.log('Total requests:', requestsResult.rows.length);
    } else {
      console.log('User not found!');
    }
    
    // Get ALL service requests to compare
    const allRequests = await pool.query(
      `SELECT sr.id, sr.service_type, sr.status, u.email, u.full_name 
       FROM service_requests sr 
       LEFT JOIN users u ON sr.user_id::uuid = u.id 
       ORDER BY sr.created_at DESC`
    );
    console.log('\nAll service requests in database:');
    allRequests.rows.forEach(req => {
      console.log(`- ID: ${req.id}, Type: ${req.service_type}, Customer: ${req.full_name} (${req.email}), Status: ${req.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkRequests();
