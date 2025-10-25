export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { query } from "../../../lib/db.js"; // Correct relative path
import bcrypt from "bcryptjs";
import { signToken } from "../../../lib/jwt.js"; // Correct relative path
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await query("SELECT * FROM Users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      console.log(`Login attempt failed: User ${email} not found.`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = result.rows[0];
    console.log("User found:", {id: user.id, email: user.email, role: user.role});

    // Use correct 'password_hash' column name (matching schema script)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log(`Login attempt failed: Password mismatch for user ${email}.`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log(`Login successful for user ${email}. Creating token...`);
    const payload = { id: user.id, email: user.email, role: user.role, organization_id: user.org_id };
    const token = signToken(payload);
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" });

    // Server-side redirect
    const redirectUrl = new URL("/dashboard", req.url);
    const response = NextResponse.redirect(redirectUrl, { status: 302 });
    response.cookies.set("session_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" });
    console.log(`Redirecting user ${email} to dashboard.`);
    return response;

  } catch (error) {
    // Check for ECONNREFUSED specifically
     if (error.code === 'ECONNREFUSED') {
         console.error("FATAL LOGIN ERROR: ECONNREFUSED. Check DATABASE_URL and DB status/SSL.");
         return NextResponse.json({ error: "Database connection refused." }, { status: 500 });
     }
    console.error("FATAL LOGIN ERROR (Other):", error);
    return NextResponse.json({ error: "Internal Server Error during login processing" }, { status: 500 });
  }
}