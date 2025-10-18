/**
 * tmp-sb-debug.js
 * Reads .env.local, creates supabase client with service role key,
 * prints counts grouped by source and up to 6 sample rows (with keys).
 */
const fs = require("fs");
function loadEnv(path) {
  try {
    const txt = fs.readFileSync(path, "utf8");
    txt.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) {
        let val = m[2].trim();
        // remove optional surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1,-1);
        }
        process.env[m[1]] = val;
      }
    });
  } catch(e) {
    // ignore
  }
}

loadEnv(".env.local");

const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or key in env. Current:", { SUPABASE_URL: url ? "***present***" : undefined, KEY: key ? "***present***" : undefined });
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  try {
    console.log("Connected to Supabase:", url);
  } catch(e){}

  // 1) counts grouped by source using RPC-friendly method
  try {
    const { data: counts, error: cErr } = await supabase
      .from("events")
      .select("source, count:count(*)", { count: "exact" })
      .group("source");
    if (cErr) {
      console.error("COUNT error:", cErr);
    } else {
      console.log("\n=== counts by source ===");
      console.log(JSON.stringify(counts, null, 2));
    }
  } catch(e) {
    console.error("COUNT exception:", e.message||e);
  }

  // 2) sample rows (up to 6)
  try {
    const { data, error } = await supabase.from("events").select("*").limit(6);
    if (error) {
      console.error("SELECT error:", error);
    } else {
      console.log("\n=== sample rows (up to 6) ===");
      data.forEach((r, i) => {
        console.log(`--- row ${i+1} ---`);
        console.log(JSON.stringify(r, null, 2));
        console.log("keys:", Object.keys(r).join(", "));
      });
    }
  } catch(e) {
    console.error("SELECT exception:", e.message||e);
  }

  // 3) check organization rows too (slugs vs id)
  try {
    const { data: orgs, error: orgErr } = await supabase.from("organizations").select("id, slug").limit(6);
    if (orgErr) {
      console.error("ORG SELECT error:", orgErr);
    } else {
      console.log("\n=== sample organizations (up to 6) ===");
      console.log(JSON.stringify(orgs, null, 2));
    }
  } catch(e) {
    console.error("ORG exception:", e.message||e);
  }

  process.exit(0);
})();
