// app/api/events/route.js
import { NextResponse } from "next/server";
import { createClient } from "../../../src/utils/supabase/client.server.js";

/**
 * EVENTS API ROUTE
 * Supports:
 *   GET    /api/events?select=*&organization_id=eq.{orgId}
 *   POST   /api/events  (JSON body with event fields)
 *   DELETE /api/events?id=eq.{uuid}
 */

export async function GET(req) {
  try {
    const supabase = createClient();
    const url = new URL(req.url);

    // Build dynamic filters (e.g. ?organization_id=eq.abc123)
    const params = Object.fromEntries(url.searchParams.entries());
    let query = supabase.from("events").select(params.select || "*");

    // parse filters like field=eq.value
    Object.entries(params).forEach(([key, val]) => {
      if (key === "select") return;
      const [op, raw] = val.split(".");
      const value = raw || val;
      switch (op) {
        case "eq":
          query = query.eq(key, value);
          break;
        case "in":
          // supports in.(a,b,c)
          const inside = val.match(/\((.*)\)/);
          if (inside) {
            const arr = inside[1].split(",").map((s) => s.trim());
            query = query.in(key, arr);
          }
          break;
        default:
          break;
      }
    });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/events] error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 400 }
    );
  }
}

/**
 * POST — add a new event
 * Expected JSON body:
 * {
 *   "name": "...",
 *   "title": "...",
 *   "description": "...",
 *   "event_date": "YYYY-MM-DD",
 *   "country": "Global",
 *   "organization_id": "...",
 *   "source": "org" | "global"
 * }
 */
export async function POST(req) {
  try {
    const supabase = createClient();
    const body = await req.json();

    if (!body || !body.name || !body.event_date) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: name or event_date" },
        { status: 400 }
      );
    }

    const insertData = {
      name: body.name,
      title: body.title ?? body.name,
      description: body.description ?? null,
      event_date: body.event_date,
      country: body.country ?? "Global",
      region: body.region ?? null,
      industry: body.industry ?? null,
      source: body.source ?? "org",
      organization_id: body.organization_id ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("events").insert(insertData).select().single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events] error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 400 }
    );
  }
}

/**
 * DELETE — remove an event
 * Usage: DELETE /api/events?id=eq.{uuid}
 */
export async function DELETE(req) {
  try {
    const supabase = createClient();
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id")?.replace("eq.", "");

    if (!idParam) {
      return NextResponse.json(
        { ok: false, error: "Missing id (expected ?id=eq.{uuid})" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("events").delete().eq("id", idParam);

    if (error) throw error;

    return NextResponse.json({ ok: true, message: "Event deleted" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/events] error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 400 }
    );
  }
}
