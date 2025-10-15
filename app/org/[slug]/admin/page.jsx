"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function OrgAdminPage() {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [globalEvents, setGlobalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const { data: orgData, error: orgErr } = await supabase
          .from("organizations")
          .select("*")
          .eq("slug", slug)
          .limit(1)
          .single();
        if (orgErr) throw orgErr;
        setOrg(orgData);

        // fetch global/world events (match whatever value your DB uses for global)
        const { data: gEvents, error: gErr } = await supabase
          .from("events")
          .select("*")
          .eq("source", "world")   // <--- use 'world' because your DB uses world
          .order("event_date", { ascending: true })
          .limit(200);
        if (gErr) throw gErr;
        setGlobalEvents(gEvents || []);
      } catch (e) {
        setMessage({ type: "error", text: e.message || JSON.stringify(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  async function importEvent(ev) {
    if (!org) {
      setMessage({ type: "error", text: "Organization not loaded" });
      return;
    }

    setImportingId(ev.id);
    setMessage(null);

    const toInsert = {
      name: ev.name ?? ev.title ?? "Untitled",
      title: ev.title ?? ev.name ?? null,
      description: ev.description ?? null,
      event_date: ev.event_date ?? null,
      source: "org",
      organization_id: org.id,
      country: ev.country ?? null,
      region: ev.region ?? null,
      industries: ev.industries ?? null
    };

    try {
      const { data: inserted, error: insertErr } = await supabase
        .from("events")
        .insert([toInsert])
        .select()
        .single();

      if (insertErr) throw insertErr;

      setMessage({
        type: "success",
        text: "Imported: " + (inserted?.name ?? inserted?.title ?? "event")
      });

      // optional: refresh list of global events after import (to reflect any change)
      // (we do not remove the global row; this simply re-fetches)
      const { data: gEvents, error: gErr } = await supabase
        .from("events")
        .select("*")
        .eq("source", "world")
        .order("event_date", { ascending: true })
        .limit(200);
      if (!gErr) setGlobalEvents(gEvents || []);
    } catch (e) {
      setMessage({ type: "error", text: e.message || JSON.stringify(e) });
    } finally {
      setImportingId(null);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading admin data</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h1>Org Admin - {org ? org.name : slug}</h1>

      {message && (
        <div style={{ margin: "8px 0", color: message.type === "error" ? "crimson" : "green" }}>
          {message.text}
        </div>
      )}

      <section style={{ marginTop: 12 }}>
        <h2>Global events</h2>
        {globalEvents.length === 0 && <div>No global events found.</div>}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {globalEvents.map((ev) => (
            <li key={ev.id} style={{ borderBottom: "1px solid #ddd", padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{ev.title ?? ev.name}</strong>
                  <div style={{ fontSize: 13 }}>
                    {ev.event_date ? ev.event_date : ""}
                  </div>
                  {ev.country && <div style={{ fontSize: 12 }}>Country: {ev.country}</div>}
                </div>

                <div>
                  <button
                    onClick={() => importEvent(ev)}
                    disabled={importingId === ev.id}
                    style={{ padding: "6px 10px" }}
                  >
                    {importingId === ev.id ? "Importing" : "Import into org"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <small>
          Test: create a global event in the Supabase UI, then import it here. The new row should have{' '}
          <code>source='org'</code> and <code>organization_id</code> set.
        </small>
      </section>
    </div>
  );
}
