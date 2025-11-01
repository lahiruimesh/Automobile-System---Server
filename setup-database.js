import pool from "./src/config/db.js";

async function setupDatabase() {
  try {
    // Create service_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        description TEXT,
        vehicle_info JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ service_requests table created successfully');
    
    // Test query
    const result = await pool.query('SELECT COUNT(*) FROM service_requests');
    console.log(`📊 Current requests count: ${result.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();