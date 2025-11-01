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
