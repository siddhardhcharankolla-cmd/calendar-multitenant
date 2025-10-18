// src/utils/supabase/client.js
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  // This runs in the browser; just a console warn to help debugging.
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnon, {
    auth: {
      flowType: "pkce",                  // robust for redirects
      autoRefreshToken: true,
      detectSessionInUrl: true,          // picks up magic link tokens from URL hash
      persistSession: true,
    },
  });
}
