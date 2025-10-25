import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Initial DB Connection Test FAILED on startup:', err.stack);
  } else {
    console.log('Database connection test successful on startup!');
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) console.error('Error executing initial test query', err.stack);
    });
  }
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

export { pool };