import pool from "../config/db.js";

export const up = async () => {
  try {
    console.log("Creating appointment_modifications table...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointment_modifications (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        old_slot_id INTEGER NOT NULL REFERENCES time_slots(id),
        new_slot_id INTEGER NOT NULL REFERENCES time_slots(id),
        reason TEXT,
        rejection_reason TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        CONSTRAINT different_slots CHECK (old_slot_id != new_slot_id)
      )
    `);

    console.log("✅ appointment_modifications table created successfully");
  } catch (error) {
    console.error("❌ Error creating appointment_modifications table:", error);
    throw error;
  }
};

export const down = async () => {
  try {
    await pool.query("DROP TABLE IF EXISTS appointment_modifications CASCADE");
    console.log("✅ appointment_modifications table dropped successfully");
  } catch (error) {
    console.error("❌ Error dropping appointment_modifications table:", error);
    throw error;
  }
};





const runMigrations = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL DEFAULT 'customer',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vehicles table (optional)
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER,
        license_plate VARCHAR(20) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database migrations completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

runMigrations()
  .then(() => {
    console.log('🎉 All migrations completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });