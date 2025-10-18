import { NextResponse } from "next/server";
import { createClient } from "../../../../../src/utils/supabase/client.server.js";

// POST /api/org/[slug]/import
export async function POST(req, { params }) {
  try {
    // params may be a promise in Next.js app router
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Missing org slug" }, { status: 400 });
    }

    // Read raw text first so we can give better errors and log what came in
    const raw = await req.text();
    console.log("[import route] raw request body (first 2000 chars):", JSON.stringify(raw).slice(0, 2000));

    if (!raw || raw.trim() === "") {
      return NextResponse.json({ ok: false, error: "Empty request body" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (parseErr) {
      console.error("[import route] JSON parse error:", parseErr.message, "raw-start:", raw.slice(0, 2000));
      return NextResponse.json({ ok: false, error: "Invalid JSON body: " + parseErr.message }, { status: 400 });
    }

    // create server supabase client
    const supabase = createClient();

    // look up org UUID from slug
    const { data: orgRows, error: orgErr } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (orgErr || !orgRows) {
      console.error("[import route] org lookup failed:", orgErr && orgErr.message, "orgRows:", orgRows);
      return NextResponse.json({ ok: false, error: orgErr?.message ?? "Org not found" }, { status: 400 });
    }

    const orgId = orgRows.id;

    const toInsert = {
      name: body?.name ?? null,
      title: body?.title ?? null,
      description: body?.description ?? null,
      event_date: body?.event_date ?? null,
      country: body?.country ?? "Global",
      industry: body?.industry ?? null,
      source: "org",
      organization_id: orgId,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("events").insert([toInsert]).select().single();

    if (error) {
      console.error("[import route] supabase insert error:", error);
      return NextResponse.json({ ok: false, error: String(error.message ?? error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    console.error("[import route] Unhandled server error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
