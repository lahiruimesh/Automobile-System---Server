import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migrations...\n');

    // Drop existing tables if they exist (in correct order due to foreign keys)
    console.log('🗑️  Cleaning up existing appointment tables...');
    await client.query(`
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS vehicles CASCADE;
      DROP TABLE IF EXISTS time_slots CASCADE;
    `);
    console.log('✅ Cleanup complete!\n');

    // Read and execute migration file
    console.log('📋 Step 1: Creating tables (appointments, time_slots, vehicles)...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'src/database/migrations/20251031-create-appointments.sql'),
      'utf8'
    );
    await client.query(migrationSQL);
    console.log('✅ Tables created successfully!\n');

    // Read and execute time slots seed
    console.log('📋 Step 2: Seeding time slots (30 days from October 31, 2025)...');
    const seedSlotsSQL = fs.readFileSync(
      path.join(__dirname, 'src/database/seeds/seed-time-slots.sql'),
      'utf8'
    );
    await client.query(seedSlotsSQL);
    console.log('✅ Time slots seeded successfully!\n');

    // Skip vehicle seeding - vehicles will be added by users through the UI
    console.log('ℹ️  Skipping vehicle seed - vehicles will be added by users\n');

    // Verify the setup
    console.log('🔍 Verifying setup...');
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM time_slots) as slot_count
    `);
    
    console.log(`\n📊 Database Statistics:`);
    console.log(`   • Time slots created: ${result.rows[0].slot_count}`);
    console.log(`   • Tables created: vehicles, time_slots, appointments`);
    
    console.log('\n✅ All migrations completed successfully!');
    console.log('\n🚀 Your appointment booking system is ready to use!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
