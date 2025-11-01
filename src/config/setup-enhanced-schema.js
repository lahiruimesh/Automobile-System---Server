import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupEnhancedSchema() {
  const client = await pool.connect();
  
  try {
    console.log('📝 Setting up enhanced schema for all features...\n');
    
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'enhanced-schema.sql'),
      'utf8'
    );
    
    await client.query(schemaSQL);
    
    console.log('✅ Enhanced schema setup completed successfully!\n');
    console.log('📊 New tables created:');
    console.log('  ✓ employee_skills');
    console.log('  ✓ employee_certifications');
    console.log('  ✓ service_photos');
    console.log('  ✓ service_notes');
    console.log('  ✓ service_tasks');
    console.log('  ✓ parts_inventory');
    console.log('  ✓ parts_requests');
    console.log('  ✓ notifications');
    console.log('  ✓ employee_availability');
    console.log('\n📋 Sample parts inventory data inserted!');
    
  } catch (error) {
    console.error('❌ Error setting up schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupEnhancedSchema()
  .then(() => {
    console.log('\n✅ Setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });
