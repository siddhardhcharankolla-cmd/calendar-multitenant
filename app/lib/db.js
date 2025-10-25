import pg from "pg";

// Check if the environment variable is set (important for Render)
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set.");
  // You might want the app to crash here in production if DB is essential
}

const pool = new pg.Pool({
  // Use the environment variable provided by Render
  connectionString: process.env.DATABASE_URL,
  // Add SSL configuration required for Render PostgreSQL
  ssl: {
    rejectUnauthorized: false // Necessary for Render's internal connections
  }
});

// Optional: Test connection on application startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Initial DB Connection Test FAILED on startup:', err.stack);
  } else {
    console.log('Database connection test successful on startup!');
    client.query('SELECT NOW()', (err, result) => { // Run a simple query
      release(); // Release the client
      if (err) {
        console.error('Error executing initial test query', err.stack);
      }
    });
  }
});

// Main query function
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// Export the pool instance if needed elsewhere (like connection test in login)
export { pool };