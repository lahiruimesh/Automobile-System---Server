import pool from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add completion_notes column...');
    
    const migrationPath = path.join(__dirname, 'src/database/migrations/20251107-add-completion-notes.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 Added completion_notes column to appointments table');
    
    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name = 'completion_notes'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification passed: completion_notes column exists');
      console.log(`   Type: ${result.rows[0].data_type}`);
    } else {
      console.log('⚠️  Warning: Could not verify column addition');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
