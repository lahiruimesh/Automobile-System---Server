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
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  console.log('Connection Details:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'NOT SET'}`);
  
  try {
    console.log('\n⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connection successful!\n');
    
    console.log('📊 Running test query...');
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ Query successful!\n');
    console.log('Database Info:');
    console.log(`   Current Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}\n`);
    
    console.log('📋 Checking tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`✅ Found ${tables.rows.length} tables:\n`);
    tables.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    client.release();
    console.log('\n🎉 Database is ready to use!\n');
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error Details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}\n`);
    
    if (error.message.includes('timeout')) {
      console.log('💡 Tips for timeout errors:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify Neon database is not suspended');
      console.log('   3. Check firewall/proxy settings\n');
    } else if (error.message.includes('password')) {
      console.log('💡 Tips for authentication errors:');
      console.log('   1. Verify DB_PASSWORD in .env file');
      console.log('   2. Check Neon dashboard for correct credentials');
      console.log('   3. Ensure user has proper permissions\n');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Tips for database not found:');
      console.log('   1. Verify DB_NAME in .env file');
      console.log('   2. Check database name in Neon dashboard\n');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();
