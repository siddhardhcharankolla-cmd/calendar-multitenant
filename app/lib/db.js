import pg from "pg";

// We are bypassing the broken .env.local file system entirely.
// The connection string is now directly in the code.
const DATABASE_URL = "postgres://postgres:StrongNewPassword!234@localhost:5432/calendar_db";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}