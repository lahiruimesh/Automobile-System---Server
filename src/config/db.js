import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool settings for Neon
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
  allowExitOnIdle: false, // Keep the pool alive
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process
});

// Test connection on startup
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL (Neon)");
    client.release();
  })
  .catch(err => {
    console.error("❌ DB connection error:", err.message);
    console.error("💡 Check your .env file and ensure database is accessible");
  });

export default pool;
