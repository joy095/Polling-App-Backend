/** @format */

import pg from "pg";
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

// Test the database connection
setTimeout(async () => {
  try {
    const client = await pool.connect();
    console.log("Database connection established successfully!");
    client.release();
  } catch (error) {
    console.error(
      "Failed to connect to the database:",
      error instanceof Error ? error.message : String(error)
    );
  }
}, 1000);

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS polls (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS options (
      id SERIAL PRIMARY KEY,
      poll_id INTEGER REFERENCES polls(id),
      text TEXT NOT NULL,
      votes INTEGER DEFAULT 0
    );
  `);
};

export default pool;
