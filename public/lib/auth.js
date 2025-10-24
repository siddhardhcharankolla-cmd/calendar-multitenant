import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { NextResponse } from "next/server";

// This function gets the authenticated user from the request cookie
export async function getAuthUser() {
  const token = cookies().get("session_token")?.value;
  if (!token) {
    return null;
  }

  const { valid, decoded } = verifyToken(token);
  if (!valid) {
    return null;
  }
  return decoded; // { id, email, role, organization_id }
}

// This is a high-order function to protect API routes
export function withAuth(handler, requiredRoles = []) {
  return async (req, context) => {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pass the authenticated user to the actual handler
    return handler(req, context, user);
  };
}