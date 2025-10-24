export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../lib/db.js";
import { signToken } from "../../../lib/jwt.js";
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

    // --- FINAL FIX: Set Cookie AND Redirect ---
    const redirectUrl = new URL("/dashboard", req.url);
    const response = NextResponse.redirect(redirectUrl, { status: 302 }); // Send 302 redirect

    // Set the cookie directly on the redirect response
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response; // Return the response that redirects the browser
    // --- END FINAL FIX ---

  } catch (error) {
    console.error("FATAL LOGIN ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}