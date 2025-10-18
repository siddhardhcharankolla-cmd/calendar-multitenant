// src/utils/supabase/client.server.js
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Supabase env missing:", { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key ? "***present***" : undefined });
    throw new Error("Supabase environment variables not configured on server.");
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
