// app/api/dev/seed-user/route.js
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * - Requires server-side env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * - This endpoint is for local/dev seeding only.
 */

function getAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req) {
  try {
    const raw = await req.text();
    if (!raw || !raw.trim()) {
      return NextResponse.json({ ok: false, error: "Empty JSON body" }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json({ ok: false, error: "Invalid JSON: " + e.message }, { status: 400 });
    }

    const { email, password } = payload || {};
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email and password required" }, { status: 400 });
    }

    const admin = getAdmin();

    // Try to create the user. If the user already exists, we'll treat it as success.
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      // Supabase returns different messages/codes depending on version; accept “already exists”.
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists")) {
        return NextResponse.json({ ok: true, message: "User already exists", email }, { status: 200 });
      }
      // Unknown error
      return NextResponse.json({ ok: false, error: error.message || "createUser failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email, userId: data?.user?.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unhandled error in seed-user" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // tiny health-check
  try {
    getAdmin();
    return NextResponse.json({ ok: true, route: "seed-user" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
