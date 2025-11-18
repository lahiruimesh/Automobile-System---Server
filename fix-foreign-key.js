import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixEmployeeAssignmentsForeignKey() {
  try {
    console.log('🔧 Fixing employee_assignments foreign key constraint...');
    
    // 0. Clean up invalid records
    console.log('Cleaning up invalid records...');
    const cleanupResult = await pool.query(`
      DELETE FROM employee_assignments 
      WHERE service_id NOT IN (SELECT id FROM service_requests);
    `);
    console.log(`✅ Cleaned up ${cleanupResult.rowCount} invalid records`);
    
    // 1. Drop the existing foreign key constraint
    console.log('Dropping old constraint...');
    await pool.query(`
      ALTER TABLE employee_assignments 
      DROP CONSTRAINT IF EXISTS employee_assignments_service_id_fkey;
    `);
    console.log('✅ Old constraint dropped');
    
    // 2. Add new foreign key constraint pointing to service_requests table
    console.log('Adding new constraint to service_requests...');
    await pool.query(`
      ALTER TABLE employee_assignments 
      ADD CONSTRAINT employee_assignments_service_id_fkey 
      FOREIGN KEY (service_id) 
      REFERENCES service_requests(id) 
      ON DELETE CASCADE;
    `);
    console.log('✅ New constraint added');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await pool.end();
  }
}

fixEmployeeAssignmentsForeignKey();
