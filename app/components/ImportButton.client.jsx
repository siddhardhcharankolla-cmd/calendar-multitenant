"use client";

import React, { useState } from "react";

export default function ImportButton({ slug, event }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleImport(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const payloadObj = {
      name: event?.name ?? event?.title ?? null,
      title: event?.title ?? event?.name ?? null,
      description: event?.description ?? null,
      event_date: event?.event_date ?? null,
      country: event?.country ?? "Global",
      source: "org"
    };

    const jsonString = JSON.stringify(payloadObj);
    console.log("[ImportButton] POSTing to", `/api/org/${slug}/import`, jsonString);

    try {
      let response = await fetch(`/api/org/${encodeURIComponent(slug)}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonString,
        cache: "no-store",
      });

      if (response.status === 400) {
        const txt = await response.text();
        console.log("[ImportButton] initial response (400):", txt);
        response = await fetch(`/api/org/${encodeURIComponent(slug)}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: new Blob([jsonString], { type: "application/json" }),
          cache: "no-store",
        });
      }

      const raw = await response.text();
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.warn("[ImportButton] parse response failed", err);
      }

      if (!response.ok) {
        const errMsg = (parsed && parsed.error) || response.statusText || `HTTP ${response.status}`;
        setMsg({ type: "error", text: `Import failed: ${errMsg}` });
      } else if (parsed && parsed.ok === false) {
        setMsg({ type: "error", text: `Import failed: ${parsed.error ?? "unknown"}` });
      } else {
        setMsg({ type: "success", text: "Imported successfully" });

        // dispatch global event so other pages can refresh
        try {
          window.dispatchEvent(new CustomEvent("org-event-imported", { detail: { id: parsed?.data?.id ?? null } }));
        } catch (err) {
          console.warn("Failed to dispatch org-event-imported", err);
        }
      }
    } catch (err) {
      console.error("[ImportButton] fetch exception:", err);
      setMsg({ type: "error", text: `Import failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-block", marginLeft: 12 }}>
      <button
        type="button"
        onClick={handleImport}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "2px solid #333",
          background: "#fff",
          cursor: loading ? "wait" : "pointer"
        }}
      >
        {loading ? "Importing..." : "Import into org"}
      </button>

      {msg && (
        <div style={{ marginTop: 8, color: msg.type === "success" ? "green" : "crimson" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

