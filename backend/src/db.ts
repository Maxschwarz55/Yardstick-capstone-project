import { Pool } from 'pg';
import 'dotenv/config'; // ensure .env is loaded

const raw =
  process.env.YARDSTICK_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgres://yardstick:yardstick@localhost:5432/yardstick';

console.log('[DB] raw DATABASE_URL =', raw);

const u = new URL(raw);

// ✅ backend/src/db.ts
export const pool = new Pool({
  host: u.hostname,
  port: Number(u.port || 5432),
  user: decodeURIComponent(u.username),
  password: String(decodeURIComponent(u.password)),
  database: u.pathname.replace(/^\//, ''),
  ssl: u.hostname.includes('rds.amazonaws.com')
    ? { rejectUnauthorized: false }  // RDS (production)
    : undefined,                     // Local Docker DB
});


