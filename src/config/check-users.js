import pool from './db.js';

async function checkUsers() {
  try {
    console.log('📋 Checking existing users...\n');
    
    const result = await pool.query(`
      SELECT id, full_name, email, role, is_active, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  No users found in database');
      console.log('\nYou need to create users first by signing up through the app.');
    } else {
      console.log(`Found ${result.rows.length} users:\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.is_active}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkUsers();
