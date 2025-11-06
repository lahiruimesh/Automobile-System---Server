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

async function checkAdmin() {
  try {
    console.log('\n=== Checking Admin User ===');
    const result = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users WHERE email = 'lahiruimesh111@gmail.com'"
    );
    
    if (result.rows.length > 0) {
      console.log('Admin User Found:');
      console.log(result.rows[0]);
      
      if (!result.rows[0].is_active) {
        console.log('\n⚠️  PROBLEM: Admin is_active is FALSE!');
        console.log('Fixing...');
        
        await pool.query(
          "UPDATE users SET is_active = true WHERE email = 'lahiruimesh111@gmail.com'"
        );
        
        console.log('✅ Admin account activated!');
        
        const check = await pool.query(
          "SELECT id, full_name, email, role, is_active FROM users WHERE email = 'lahiruimesh111@gmail.com'"
        );
        console.log('Updated Admin:', check.rows[0]);
      } else {
        console.log('✅ Admin account is active');
      }
    } else {
      console.log('❌ Admin user not found');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
  }
}

checkAdmin();
