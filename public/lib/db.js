import pg from "pg";

// This check is important for the running application
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set.");
  // In production, you might want the app to crash or handle this gracefully
  // For now, we log the error. The pool creation will likely fail anyway.
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // --- ADD THIS SSL CONFIGURATION for Render ---
  ssl: {
    rejectUnauthorized: false // Required for Render's internal connections
  }
  // --- END SSL CONFIGURATION ---
});

// Test connection on startup (optional but helpful)
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client for initial connection test:', err.stack)
  }
  console.log('Database connection test successful!');
  client.query('SELECT NOW()', (err, result) => {
    release()
    if (err) {
      return console.error('Error executing initial query', err.stack)
    }
    // console.log('Current DB time:', result.rows[0].now)
  })
})


export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}