export const dynamic = 'force-dynamic'; // Add this for cookie usage

import { NextResponse } from "next/server";
import { query } from "../../../lib/db.js";
import { verifyToken } from "../../../lib/jwt.js";
import { cookies } from "next/headers";

// We need to get the authenticated user to find their organization_id
async function getAuthenticatedUser() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  const { valid, decoded } = verifyToken(token);
  return valid ? decoded : null;
}

const createOrgEventHandler = async (req, context) => {
  const user = await getAuthenticatedUser();

  if (!user || user.role !== 'org_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organization_id = user.organization_id;
  if (!organization_id) {
      return NextResponse.json({ error: "User is not associated with an organization" }, { status: 403 });
  }
  
  try {
    const { title, description, start_date, end_date } = await req.json();

    if (!title || !start_date) {
      return NextResponse.json({ error: "Title and start_date are required" }, { status: 400 });
    }

    // --- THIS IS THE FIX ---
    // Inserts into your existing 'events' table
    const result = await query(
      `INSERT INTO events (organization_id, title, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [organization_id, title, description, start_date, end_date]
    );
    // --- END FIX ---

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Create Org Event Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

// We now only export POST, and we removed the old 'withAuth' wrapper
export const POST = createOrgEventHandler;