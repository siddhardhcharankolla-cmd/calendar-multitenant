import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { withAuth } from "../../../lib/auth";

const createOrganizationHandler = async (req) => {
  try {
    const { name, slug } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }
    const existingOrg = await query("SELECT id FROM Organizations WHERE slug = $1", [slug]);
    if (existingOrg.rows.length > 0) {
      return NextResponse.json({ error: "Organization with this slug already exists" }, { status: 409 });
    }
    const result = await query(
      "INSERT INTO Organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug",
      [name, slug]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Create Organization Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
export const POST = withAuth(createOrganizationHandler, ["System Admin"]);