import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  }
});

async function setupDatabase() {
  console.log('\n🚀 Starting database setup...\n');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database successfully!\n');
    
    // Read and execute schema.sql
    console.log('📝 Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⚙️  Creating tables, indexes, and triggers...');
    await pool.query(schema);
    console.log('✅ Schema created successfully!\n');
    
    // Read and execute test_data.sql
    console.log('📝 Reading test_data.sql...');
    const testDataPath = path.join(__dirname, 'src', 'config', 'test_data.sql');
    const testData = fs.readFileSync(testDataPath, 'utf8');
    
    console.log('📊 Loading test data...');
    await pool.query(testData);
    console.log('✅ Test data loaded successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('services', 'employee_assignments', 'time_logs')
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables created:');
    if (tableCheck.rows.length === 0) {
      console.log('   ⚠️  No tables found! Something went wrong.');
    } else {
      tableCheck.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }
    
    // Count records
    console.log('\n📊 Data summary:');
    
    const serviceCount = await pool.query('SELECT COUNT(*) FROM services');
    console.log(`   • Services: ${serviceCount.rows[0].count} records`);
    
    const assignmentCount = await pool.query('SELECT COUNT(*) FROM employee_assignments');
    console.log(`   • Employee Assignments: ${assignmentCount.rows[0].count} records`);
    
    const timeLogCount = await pool.query('SELECT COUNT(*) FROM time_logs');
    console.log(`   • Time Logs: ${timeLogCount.rows[0].count} records`);
    
    console.log('\n🎉 Database setup completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Start backend server: npm start');
    console.log('   2. Start frontend app: npm start (in Client folder)');
    console.log('   3. Login as employee and test features\n');
    
  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('already exists')) {
      console.log('💡 Tables already exist. You can:');
      console.log('   1. Drop existing tables and re-run this script');
      console.log('   2. Or manually run the SQL files in order\n');
    } else if (error.message.includes('connection')) {
      console.log('💡 Connection error. Check:');
      console.log('   1. .env file has correct database credentials');
      console.log('   2. Database server is running');
      console.log('   3. Network connection is stable\n');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase();
