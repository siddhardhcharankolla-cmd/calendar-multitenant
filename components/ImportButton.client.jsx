// app/components/ImportButton.client.jsx
"use client";

import React, { useState } from "react";

/**
 * Robust instrumented ImportButton
 * - ensures button type="button" (prevents accidental form submit)
 * - logs the exact JSON string we send
 * - logs fetch result, headers and raw response text
 * - fallback using Blob if string body somehow gets dropped
 */
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

    // create the JSON string once and log it
    const jsonString = JSON.stringify(payloadObj);
    console.log("[ImportButton] about to POST to server:", {
      url: `/api/org/${slug}/import`,
      jsonString,
      payloadObj
    });

    try {
      // Preferred request
      let response = await fetch(`/api/org/${encodeURIComponent(slug)}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonString,
        // avoid cache-related behavior
        cache: "no-store"
      });

      // If for some reason server receives an empty body repeatedly, try alternate body method
      if (response.status === 400) {
        // read response text to see server-side reason
        const txt = await response.text();
        console.log("[ImportButton] initial response (status 400) text:", txt);

        // Try again using Blob (rare, but sometimes helps with certain environments)
        console.log("[ImportButton] retrying with Blob body fallback...");
        response = await fetch(`/api/org/${encodeURIComponent(slug)}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: new Blob([jsonString], { type: "application/json" }),
          cache: "no-store"
        });
      }

      // Read raw response
      const raw = await response.text();
      console.log("[ImportButton] fetch completed:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries ? response.headers.entries() : []),
        raw
      });

      // Attempt JSON parse (if any)
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.warn("[ImportButton] response JSON parse failed:", err.message);
      }

      if (!response.ok) {
        const errMsg = (parsed && parsed.error) || response.statusText || `HTTP ${response.status}`;
        setMsg({ type: "error", text: `Import failed: ${errMsg}` });
      } else if (parsed && parsed.ok === false) {
        setMsg({ type: "error", text: `Import failed: ${parsed.error ?? "unknown"}` });
      } else {
        setMsg({ type: "success", text: "Imported successfully" });
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
      {/* IMPORTANT: type="button" prevents accidental form submit which can cancel the fetch */}
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
        {loading ? "Importing..." : "Import example"}
      </button>

      {msg && (
        <div style={{ marginTop: 8, color: msg.type === "success" ? "green" : "crimson" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
