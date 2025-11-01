import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  try {
    console.log('\n🔍 Checking existing database structure...\n');
    
    // Check if users table exists
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    // Check users table structure
    const usersColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    if (usersColumns.rows.length > 0) {
      console.log('\n👤 Users table structure:');
      usersColumns.rows.forEach(row => {
        console.log(`   • ${row.column_name}: ${row.data_type}`);
      });
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
}

checkDatabase();
