export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { query } from "../../../lib/db.js"; // Adjusted path
import { verifyToken } from "../../../lib/jwt.js"; // Adjusted path
import { cookies } from "next/headers";

// Helper function moved inside
async function getAuthenticatedUser() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  const { valid, decoded } = verifyToken(token);
  return valid ? decoded : null;
}

// POST Handler - System Admin creates a global event
const createGlobalEventHandler = async (req) => {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'system_admin') { // Check for system_admin role
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, event_date, catalog, country, industry, description } = await req.json();
    if (!name || !event_date || !catalog) {
      return NextResponse.json({ error: "Name, event_date, and catalog are required" }, { status: 400 });
    }
    const result = await query(
      `INSERT INTO GlobalEvents (name, event_date, catalog, country, industry, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, event_date, catalog, country, industry, description]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/global-events Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

// GET Handler - Any logged-in user can view global events
const getGlobalEventsHandler = async () => {
   const user = await getAuthenticatedUser();
   if (!user) { // Must be logged in to view
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

  try {
    const result = await query("SELECT * FROM GlobalEvents ORDER BY event_date ASC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/global-events Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export const POST = createGlobalEventHandler;
export const GET = getGlobalEventsHandler;