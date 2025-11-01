import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function testConnection() {
  console.log('🔄 Testing database connection...\n');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}\n`);
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to database!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`⏰ Database time: ${result.rows[0].current_time}`);
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Database connection test passed!');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    await pool.end();
    return false;
  }
}

testConnection();
