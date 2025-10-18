"use client";

import React, { useEffect, useState } from "react";

/**
 * OrgFilter client component
 * - receives initial values from server page via props
 * - always initializes state to strings (never undefined) so inputs stay controlled
 * - calls onChange callback when filters change (optional)
 */

export default function OrgFilter({
  initialStart = "",
  initialEnd = "",
  initialCountry = "",
  initialIndustry = "",
  initialShowGlobal = false,
  onChange = () => {}
}) {
  // Always initialize to string (server may provide undefined)
  const [start, setStart] = useState(initialStart ?? "");
  const [end, setEnd] = useState(initialEnd ?? "");
  const [country, setCountry] = useState(initialCountry ?? "");
  const [industry, setIndustry] = useState(initialIndustry ?? "");
  const [showGlobal, setShowGlobal] = useState(Boolean(initialShowGlobal));

  // If server later provides different initial props (hot-reload), keep state in sync once:
  useEffect(() => {
    setStart(initialStart ?? "");
    setEnd(initialEnd ?? "");
    setCountry(initialCountry ?? "");
    setIndustry(initialIndustry ?? "");
    setShowGlobal(Boolean(initialShowGlobal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStart, initialEnd, initialCountry, initialIndustry, initialShowGlobal]);

  // Emit changes to parent (if provided)
  useEffect(() => {
    onChange({ start, end, country, industry, showGlobal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, country, industry, showGlobal]);

  return (
    <div style={{ marginBottom: 18 }}>
      <form style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }} onSubmit={(e) => e.preventDefault()}>
        <label style={{ display: "block" }}>
          Start
          <input
            name="start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <label style={{ display: "block" }}>
          End
          <input
            name="end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <label style={{ display: "block" }}>
          Country
          <input
            name="country"
            type="text"
            value={country}
            placeholder="Global"
            onChange={(e) => setCountry(e.target.value)}
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <label style={{ display: "block" }}>
          Industry
          <input
            name="industry"
            type="text"
            value={industry}
            placeholder=""
            onChange={(e) => setIndustry(e.target.value)}
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            name="showGlobal"
            type="checkbox"
            checked={showGlobal}
            onChange={(e) => setShowGlobal(Boolean(e.target.checked))}
          />
          <span>Show global events</span>
        </label>
      </form>
    </div>
  );
}
