// ===========================================================================
// src/db.js — database connection + schema setup
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   - Creates ONE shared "pool" of PostgreSQL connections (the app borrows
//     a connection, uses it, returns it — cheaper than opening a new one
//     for every request).
//   - Creates the `messages` table on startup so the app bootstraps itself.
//
// 🧠 IMPORTANT (why it makes the pipeline work):
//   Every DB setting comes from ENVIRONMENT VARIABLES, never hardcoded. That
//   one decision lets the SAME code run on:
//     your laptop  (env = localhost)   →  CI runner  (env = localhost + service)
//     → and in Docker (env = the service name "db").
// ===========================================================================
import pg from "pg";

const config = {
  host: process.env.DB_HOST,        // in Docker: 'db' (the compose service name)
  port: process.env.DB_PORT,        // usually 5432
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,                          // up to 10 open connections at once
  idleTimeoutMillis: 30000,         // close idle connections after 30s
};

export const pool = new pg.Pool(config);   // the shared connection pool

// Create the table on startup so the app is self-bootstrapping
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,               -- auto-number: 1, 2, 3...
      name VARCHAR(100) NOT NULL,          -- who posted (required)
      message TEXT NOT NULL,               -- the message (required)
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- posted time
    )
  `);
  console.log('✅ Database ready (table "messages" verified)');
}