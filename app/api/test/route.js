import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_ env vars' }), { status: 500 });
  }

  const supabase = createClient(url, key);
  try {
    const { data, error } = await supabase.from('organizations').select('*').limit(3);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
  }
}
