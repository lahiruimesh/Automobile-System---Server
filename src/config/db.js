import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Create a PostgreSQL connection pool (Neon-compatible)
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout if connection can't be established
  allowExitOnIdle: false, // Keep pool alive
});

// Test connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log("✅ Connected to PostgreSQL (Neon)");
      client.release();
      return;
    } catch (err) {
      console.error("❌ DB connection error:", err.message);
      retries--;
      if (retries > 0) {
        console.log(`🔄 Retrying connection in ${delay / 1000} seconds... (${retries} retries left)`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error("🚫 Failed to connect to PostgreSQL after multiple attempts.");
      }
    }
  }
};

// Handle pool errors
pool.on("error", (err) => {
  console.error("⚠️ Unexpected error on idle PostgreSQL client:", err.message);
});

// Try initial connection
connectWithRetry();
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL (Neon)");
    client.release();
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    console.error("💡 Check your .env file and ensure database is accessible");
  }
};

testConnection();

export default pool;