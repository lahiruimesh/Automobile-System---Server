import pool from './db.js';

async function checkTables() {
  try {
    console.log('📋 Checking all tables structure...\n');
    
    const tables = ['services', 'employee_assignments', 'time_logs'];
    
    for (const table of tables) {
      console.log(`\n${table.toUpperCase()}:`);
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      result.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
