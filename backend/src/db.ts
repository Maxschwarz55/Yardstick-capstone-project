// backend/src/db.ts
import { Pool } from 'pg';
import 'dotenv/config'; // make sure .env is loaded

// Log DB info
console.log('[DB] Connecting to PostgreSQL at', process.env.DB_HOST, 'database:', process.env.DB_DB);

export const pool = new Pool({
  host: process.env.DB_HOST,                     // e.g., RDS endpoint or localhost
  port: Number(process.env.DB_PORT || 5432),    // default PostgreSQL port
  user: process.env.DB_USER,                     // DB username
  password: process.env.DB_PWD,                 // DB password
  database: process.env.DB_DB,                   // DB name
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com')
    ? { rejectUnauthorized: false }             // RDS requires SSL
    : undefined,                                // Local DB can skip SSL
});

// test connection on startup
pool.connect()
  .then(client => {
    console.log('[DB] PostgreSQL connection successful');
    client.release();
  })
  .catch(err => {
    console.error('[DB] PostgreSQL connection error:', err);
  });
