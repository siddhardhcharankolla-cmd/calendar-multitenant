export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { query } from "../../../lib/db.js";
import bcrypt from "bcryptjs";
export async function POST(req) {
  try {
    const { email, password, role, organization_id = null } = await req.json();
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const existingUser = await query("SELECT * FROM Users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO Users (email, password_hash, role, organization_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, organization_id`,
      [email, password_hash, role, organization_id]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}