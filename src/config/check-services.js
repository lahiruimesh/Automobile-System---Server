import pool from './db.js';

async function checkServices() {
  try {
    console.log('📋 Checking services table structure...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'services'
      ORDER BY ordinal_position
    `);
    
    console.log('Services table columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkServices();
