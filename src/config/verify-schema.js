import pool from './db.js';

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n');

    // Check if employee_skills table exists
    const skillsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'employee_skills'
      );
    `);
    console.log('✓ employee_skills table exists:', skillsTableCheck.rows[0].exists);

    // Check if employee_certifications table exists
    const certsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'employee_certifications'
      );
    `);
    console.log('✓ employee_certifications table exists:', certsTableCheck.rows[0].exists);

    // Check if profile columns exist in users table
    const profileColumnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('profile_picture', 'bio', 'date_of_birth', 'address', 'emergency_contact', 'emergency_name');
    `);
    console.log('✓ Profile columns in users table:', profileColumnsCheck.rows.map(r => r.column_name));

    // Check if service_photos table exists
    const photosTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_photos'
      );
    `);
    console.log('✓ service_photos table exists:', photosTableCheck.rows[0].exists);

    // Check if service_notes table exists
    const notesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_notes'
      );
    `);
    console.log('✓ service_notes table exists:', notesTableCheck.rows[0].exists);

    // Check if service_tasks table exists
    const tasksTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_tasks'
      );
    `);
    console.log('✓ service_tasks table exists:', tasksTableCheck.rows[0].exists);

    // Check if notifications table exists
    const notificationsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);
    console.log('✓ notifications table exists:', notificationsTableCheck.rows[0].exists);

    // Check if employee_availability table exists
    const availabilityTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'employee_availability'
      );
    `);
    console.log('✓ employee_availability table exists:', availabilityTableCheck.rows[0].exists);

    console.log('\n✅ Schema verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying schema:', error.message);
    process.exit(1);
  }
}

verifySchema();
