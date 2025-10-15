"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [source, setSource] = useState("world");

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .in("source", ["world", "national", "regional"])
      .order("event_date", { ascending: true });
    if (error) {
      console.error("fetchEvents error:", error);
    } else {
      setEvents(data || []);
    }
  }

  async function addEvent(e) {
    e.preventDefault();
    const { error } = await supabase.from("events").insert([
      { name, event_date: date, source, description: "Added by Admin" },
    ]);
    if (error) {
      alert(" Add error: " + error.message);
    } else {
      setName("");
      setDate("");
      fetchEvents();
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2> Admin – Global Events</h2>
      <form onSubmit={addEvent} style={{ margin: "12px 0" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Event name"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="world">World</option>
          <option value="national">National</option>
          <option value="regional">Regional</option>
        </select>
        <button style={{ marginLeft: 8 }}>Add</button>
      </form>

      <h3> Existing Events</h3>
      <ul>
        {events.map((ev) => (
          <li key={ev.id}>
            {ev.event_date} – {ev.name} ({ev.source})
          </li>
        ))}
      </ul>
    </div>
  );
}

