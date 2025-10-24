export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { query, pool } from "../../../lib/db.js"; // Import pool directly
import bcrypt from "bcryptjs";
import { signToken } from "../../../lib/jwt.js";
import { cookies } from "next/headers";

export async function POST(req) {
  // --- DETAILED CONNECTION TEST ---
  console.log("LOGIN API: Attempting DB connection test...");
  let client;
  try {
    // Try to get a client from the pool
    client = await pool.connect();
    console.log("LOGIN API: DB Connection test SUCCEEDED.");
    // Run a simple query just to be sure
    await client.query('SELECT NOW()');
    console.log("LOGIN API: Simple query SUCCEEDED.");
  } catch (connectionError) {
    console.error("LOGIN API: DB Connection test FAILED!");
    console.error("LOGIN API: Connection Error Code:", connectionError.code);
    console.error("LOGIN API: Connection Error Message:", connectionError.message);
    // Log the DATABASE_URL being used (sensitive, but necessary for debugging)
    console.error("LOGIN API: Using DATABASE_URL (check if correct):", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30)+"..." : "Not Set!");
    if (client) {
      client.release(); // Release client if connection acquired but query failed
    }
    // Return 500 immediately if connection fails
    return NextResponse.json({ error: "Internal Server Error - DB Connection Failed" }, { status: 500 });
  } finally {
     // Ensure client is always released if acquired
    if (client) {
      client.release();
      console.log("LOGIN API: DB Client released.");
    }
  }
  // --- END CONNECTION TEST ---


  // --- Original Login Logic (runs only if connection test passes) ---
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await query("SELECT * FROM Users WHERE email = $1", [email]); // Use the query function now
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.org_id
    };

    const token = signToken(payload);
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" });

    return NextResponse.json({ message: "Login successful" });

  } catch (error) {
    // This catches errors *after* the connection test
    console.error("FATAL LOGIN LOGIC ERROR:", error);
    // Check specifically if it's ECONNREFUSED again, though it shouldn't be if test passed
     if (error.code === 'ECONNREFUSED') {
         console.error("LOGIN API: ECONNREFUSED occurred during login logic (unexpected!). Check DATABASE_URL.");
     }
    return NextResponse.json({ error: "Internal Server Error during login processing" }, { status: 500 });
  }
}

// Ensure db.js exports 'pool'
// Add this line to app/lib/db.js if it's not already exporting pool:
// export { pool }; // Add this alongside the export async function query(...)