import pg from "pg";

// Check if the environment variable is set
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set.");
  // In production, the application might crash here or handle this error.
  // We log it and let the Pool creation attempt proceed, which will likely fail.
}

// Create the connection pool instance
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL configuration required for Render PostgreSQL
  ssl: {
    rejectUnauthorized: false // Necessary for Render's internal connections
  }
});

// Optional: Test connection on application startup (logs to Render console)
pool.connect((err, client, release) => {
  if (err) {
    // Log detailed error if initial connection fails
    console.error('Initial DB Connection Test FAILED:', err.stack);
    // You might want to exit the process here in a real app if DB is critical
    // process.exit(1);
  } else {
    console.log('Database connection test successful on startup!');
    // Optional: Run a simple query to confirm
    client.query('SELECT NOW()', (err, result) => {
      release(); // Release the client back to the pool
      if (err) {
        console.error('Error executing initial test query', err.stack);
      } else {
        // console.log('Current DB time:', result.rows[0].now); // Can log time if needed
      }
    });
  }
});

// Main query function used by API routes
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    // Ensure the client is always released back to the pool
    client.release();
  }
}

// Export the pool instance for direct connection tests (e.g., in login API)
export { pool };