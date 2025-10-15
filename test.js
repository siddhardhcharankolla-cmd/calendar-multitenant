// pages/test.js
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TestPage() {
  useEffect(() => {
    async function checkConnection() {
      console.log("Testing Supabase connection...");
      const { data, error } = await supabase.from("organizations").select("*");
      if (error) {
        console.error("❌ Connection failed:", error.message);
      } else {
        console.log("✅ Connection successful! Data received:", data);
      }
    }
    checkConnection();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center text-xl font-semibold">
      Open DevTools Console (F12) to view Supabase test output.
    </div>
  );
}
