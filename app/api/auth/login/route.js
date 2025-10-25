export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { query, pool } from "../../../lib/db.js"; // Correct path assumed
import bcrypt from "bcryptjs";
import { signToken } from "../../../lib/jwt.js"; // Correct path assumed
import { cookies } from "next/headers";

export async function POST(req) {
  // Connection Test (Keep it for confirmation)
  console.log("LOGIN API: Attempting DB connection test...");
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()'); // Simple query
    console.log("LOGIN API: DB Connection test SUCCEEDED.");
  } catch (connectionError) {
    console.error("LOGIN API: DB Connection test FAILED!", connectionError.message);
    if (client) client.release();
    return NextResponse.json({ error: "Internal Server Error - DB Connection Failed" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
  // --- END CONNECTION TEST ---

  // --- Main Login Logic with Detailed Logging ---
  try {
    console.log("LOGIN API: Parsing request body...");
    const body = await req.json().catch((e) => {
        console.error("LOGIN API: Failed to parse JSON body:", e.message);
        return null; // Return null if parsing fails
     });

    if (!body) {
         return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, password } = body;
    console.log("LOGIN API: Received credentials for email:", email);

    if (!email || !password) {
      console.log("LOGIN API: Missing email or password.");
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    console.log("LOGIN API: Querying database for user:", email);
    const result = await query("SELECT * FROM Users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      console.log(`LOGIN API: User ${email} not found in database.`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = result.rows[0];
    console.log("LOGIN API: User found:", {id: user.id, email: user.email, role: user.role});
    // Log the hash retrieved (first few chars for security)
    console.log("LOGIN API: Stored password hash starts with:", user.password_hash ? user.password_hash.substring(0, 10) + "..." : "NULL");

    console.log("LOGIN API: Comparing provided password with stored hash...");
    // Ensure you are comparing against the correct column name 'password_hash'
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log("LOGIN API: Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log(`LOGIN API: Password mismatch for user ${email}.`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Password is valid
    console.log(`LOGIN API: Login successful for user ${email}. Creating token...`);
    const payload = { id: user.id, email: user.email, role: user.role, organization_id: user.org_id };
    const token = signToken(payload);
    console.log("LOGIN API: Token created. Setting cookie...");

    const cookieStore = await cookies();
    cookieStore.set("session_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" });
    console.log("LOGIN API: Cookie set. Sending redirect response...");

    // Server-side redirect
    const redirectUrl = new URL("/dashboard", req.url);
    const response = NextResponse.redirect(redirectUrl, { status: 302 });
    // Re-set cookie on redirect response for robustness
    response.cookies.set("session_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" });
    return response;

  } catch (error) {
    console.error("FATAL LOGIN LOGIC ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error during login processing" }, { status: 500 });
  }
}