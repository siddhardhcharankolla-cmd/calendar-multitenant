"use client";
import { useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function TestPage() {
  useEffect(() => {
    async function check() {
      console.log("Testing Supabase connection...");
      const { data, error } = await supabase.from("organizations").select("*");
      if (error) console.error("Connection failed:", error);
      else console.log("Connection OK, organizations:", data);
    }
    check();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      Open DevTools Console to see Supabase test output (visit <code>/test</code>).
    </div>
  );
}
