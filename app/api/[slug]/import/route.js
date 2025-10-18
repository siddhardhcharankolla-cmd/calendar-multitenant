import { NextResponse } from "next/server";

/**
 * Minimal POST route for importing an event server-side.
 * Currently echoes the payload and returns 201. Replace the TODO block
 * with Supabase server-side insertion using a service-role key if you want
 * the server to insert directly.
 */
export async function POST(req) {
  try {
    const body = await req.json();

    // TODO: Insert into Supabase here using service_role key (server only)
    // Example (server-only, not client): const supabase = createServerSupabaseClient({ env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY }})
    console.log("Server import endpoint received:", body);

    return NextResponse.json({ ok: true, received: body }, { status: 201 });
  } catch (err) {
    console.error("Server import error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}