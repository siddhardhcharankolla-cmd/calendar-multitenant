// app/org/[slug]/admin/page.jsx
import React from "react";
import { redirect } from "next/navigation";

// Server-side helpers (adjust paths only if your files live elsewhere)
import { createClient } from "../../../../src/utils/supabase/client.server.js";
import { getUserAndProfile } from "../../../../src/utils/supabase/getUserAndProfile.server.js";

// Client component button
import ImportButton from "../../../components/ImportButton.client.jsx";

/**
 * Org Admin page (SERVER COMPONENT)
 * - Protects access (login required; role must be admin or org_admin)
 * - Lists global events with an Import button beside each row
 */
export default async function AdminPage({ params }) {
  // Next.js App Router: await params
  const { slug } = await params;

  // ---- Auth & role guard ---------------------------------------------------
  const { user, profile } = await getUserAndProfile();
  if (!user) {
    // Not signed in → go to login
    redirect("/login");
  }
  if (!["admin", "org_admin"].includes(profile?.role)) {
    // Not allowed
    return (
      <main style={{ padding: 24 }}>
        <h2>🚫 Not authorized</h2>
        <p>Your account doesn’t have access to this page.</p>
      </main>
    );
  }

  // ---- Data loading --------------------------------------------------------
  const supabase = createClient();

  // Ensure the organization exists
  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (orgErr || !orgRow) {
    return (
      <main style={{ padding: 24 }}>
        <h2>Organization not found</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{orgErr?.message ?? "Unknown error"}</pre>
      </main>
    );
  }

  // Global events: source in ('global','world')
  const { data: globalEvents, error: globalsErr } = await supabase
    .from("events")
    .select("*")
    .in("source", ["global", "world"])
    .order("event_date", { ascending: true })
    .limit(200);

  if (globalsErr) {
    // Show a friendly message but don’t crash the page
    console.error("[AdminPage] error loading global events:", globalsErr);
  }

  // ---- Render --------------------------------------------------------------
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0 }}>
        Org Admin — <span style={{ fontWeight: "normal" }}>{orgRow.name ?? slug}</span>
      </h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Signed in as <strong>{user.email}</strong> ({profile?.role})
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Global events</h2>

        {!globalEvents?.length ? (
          <div style={{ color: "#666" }}>No global events found.</div>
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
                    <span style={{ fontWeight: "normal" }}>{ev.event_date ?? "No date"}</span>
                  </h3>
                  {ev.description && (
                    <div style={{ marginTop: 6, color: "#444" }}>{ev.description}</div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                    {ev.country ?? "Global"}
                  </div>
                </div>

                <div style={{ marginLeft: 16, display: "flex", alignItems: "center" }}>
                  {/* Client component import button - pass slug + event */}
                  <ImportButton slug={slug} event={ev} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
