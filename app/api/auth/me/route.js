export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/jwt.js"; // Adjust path if needed

export async function GET(req) {
  console.log("\n--- GET /api/auth/me ---"); // Log entry
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      console.log("/api/auth/me: No session token found in cookies.");
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }
    console.log("/api/auth/me: Session token found. Verifying...");

    const { valid, decoded } = verifyToken(token); // verifyToken should have its own logs now

    if (!valid || !decoded) {
      console.log("/api/auth/me: Token verification failed.");
       // Clear invalid token
       const response = NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
       response.cookies.set("session_token", "", { maxAge: 0, path: "/" });
       return response;
    }

    // Token is valid
    console.log("/api/auth/me: Token verified successfully. Returning user data:", decoded);
    return NextResponse.json(decoded); // Return user data

  } catch (error) {
    console.error("FATAL GET /api/auth/me Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}