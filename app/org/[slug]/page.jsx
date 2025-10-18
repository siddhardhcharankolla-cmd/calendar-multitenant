// app/org/[slug]/page.jsx
import React from "react";

// server helper (this path is correct for app/org/[slug]/page.jsx)
// if your utils folder ever moves, adjust the relative path accordingly:
import { createClient } from "../../../src/utils/supabase/client.server.js";

// client filter bar (already in app/components)
import OrgFilter from "../../components/OrgFilter.client.jsx";

/**
 * Org Users page (SERVER COMPONENT)
 * - awaits params & searchParams (Next.js App Router rule)
 * - loads org by slug
 * - loads org events with filters (date range, country, industry)
 * - optionally shows global events (showGlobal=1)
 */
export default async function OrgPage({ params, searchParams }) {
  // ✅ App Router dynamic params & search params must be awaited
  const { slug } = await params;
  const sp = await searchParams;

  // read filters from query
  const {
    start = "",
    end = "",
    country = "",
    industry = "",
    showGlobal = "",
  } = sp || {};

  // create server supabase client
  const supabase = createClient();

  // 1) find org by slug
  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (orgErr || !orgRow) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Organization not found</h1>
        {orgErr?.message && (
          <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
            {orgErr.message}
          </pre>
        )}
      </main>
    );
  }

  // 2) build org events query with filters
  let orgQuery = supabase
    .from("events")
    .select("*")
    .eq("organization_id", orgRow.id);

  if (start) orgQuery = orgQuery.gte("event_date", start);
  if (end) orgQuery = orgQuery.lte("event_date", end);
  if (country) orgQuery = orgQuery.eq("country", country);
  if (industry) orgQuery = orgQuery.eq("industry", industry);

  const { data: orgEvents = [], error: orgEventsErr } = await orgQuery
    .order("event_date", { ascending: true })
    .limit(200);

  // 3) optionally fetch global events too (showGlobal=1)
  let globalEvents = [];
  let globalsErr = null;
  if (String(showGlobal).toLowerCase() === "1") {
    try {
      let gq = supabase
        .from("events")
        .select("*")
        .in("source", ["global", "world"]);

      if (start) gq = gq.gte("event_date", start);
      if (end) gq = gq.lte("event_date", end);
      if (country) gq = gq.eq("country", country);
      if (industry) gq = gq.eq("industry", industry);

      const { data, error } = await gq
        .order("event_date", { ascending: true })
        .limit(200);

      if (error) globalsErr = error;
      else globalEvents = data ?? [];
    } catch (e) {
      globalsErr = e;
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>
          {orgRow.name ? `Events — ${orgRow.name}` : `Events — ${slug}`}
        </h1>
        <div style={{ color: "#666", marginTop: 6 }}>
          Filter by date, country, industry — optionally include global events.
        </div>
      </header>

      {/* Filter bar (client component) */}
      <section style={{ margin: "16px 0 24px" }}>
        <OrgFilter
          slug={slug}
          start={start}
          end={end}
          country={country}
          industry={industry}
          showGlobal={String(showGlobal)}
        />
      </section>

      {/* ORG EVENTS */}
      <section style={{ marginTop: 10 }}>
        <h2 style={{ margin: "0 0 12px" }}>Organization events</h2>

        {orgEventsErr ? (
          <div style={{ color: "crimson" }}>
            Failed to load org events: {orgEventsErr.message || String(orgEventsErr)}
          </div>
        ) : !orgEvents.length ? (
          <div style={{ color: "#666" }}>No organization events match your filters.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {orgEvents.map((ev) => (
              <li
                key={ev.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div style={{ maxWidth: "75%" }}>
                  <h3 style={{ margin: 0 }}>
                    {ev.name ?? ev.title ?? "Untitled"} —{" "}
                    <span style={{ fontWeight: "normal" }}>
                      {ev.event_date ?? "No date"}
                    </span>
                  </h3>
                  {ev.description && (
                    <div style={{ marginTop: 6, color: "#444" }}>
                      {ev.description}
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                    {ev.country ?? "Global"}
                    {ev.industry ? ` • ${ev.industry}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* GLOBAL EVENTS (optional) */}
      {String(showGlobal).toLowerCase() === "1" && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ margin: "0 0 12px" }}>Global events</h2>

          {globalsErr ? (
            <div style={{ color: "crimson" }}>
              Failed to load global events: {globalsErr.message || String(globalsErr)}
            </div>
          ) : !globalEvents.length ? (
            <div style={{ color: "#666" }}>
              No global events match your filters (or none available).
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {globalEvents.map((ev) => (
                <li
                  key={ev.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div style={{ maxWidth: "75%" }}>
                    <h3 style={{ margin: 0 }}>
                      {ev.name ?? ev.title ?? "Untitled"} —{" "}
                      <span style={{ fontWeight: "normal" }}>
                        {ev.event_date ?? "No date"}
                      </span>
                    </h3>
                    {ev.description && (
                      <div style={{ marginTop: 6, color: "#444" }}>
                        {ev.description}
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                      {ev.country ?? "Global"}
                      {ev.industry ? ` • ${ev.industry}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
