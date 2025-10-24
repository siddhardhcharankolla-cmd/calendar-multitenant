export const dynamic = 'force-dynamic'; // Required because we use cookies

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/jwt.js"; // Correct path

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    const { valid, decoded } = verifyToken(token);

    if (!valid || !decoded) {
      // If token is invalid or expired, clear the cookie
       cookieStore.set("session_token", "", { maxAge: 0, path: "/" });
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // Return the decoded user information
    return NextResponse.json(decoded); // { id, email, role, organization_id, iat, exp }

  } catch (error) {
    console.error("GET /api/auth/me Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}