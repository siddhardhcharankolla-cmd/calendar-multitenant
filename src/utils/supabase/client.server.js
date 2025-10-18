import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Supabase env missing:", { SUPABASE_URL, SERVICE_ROLE_KEY: SERVICE_ROLE_KEY ? "***present***" : undefined });
    throw new Error("Supabase environment variables not configured on server.");
  }
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
