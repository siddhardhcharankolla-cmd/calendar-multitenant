'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // adjust path if your lib is at /lib

export default function TestPage() {
  const [out, setOut] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    (async () => {
      try {
        // Simple test: list first 5 rows from 'organizations' table
        const { data, error } = await supabase.from('organizations').select('*').limit(5);
        if (error) throw error;
        setOut({ loading: false, data, error: null });
      } catch (err) {
        setOut({ loading: false, data: null, error: err.message || JSON.stringify(err) });
      }
    })();
  }, []);

  if (out.loading) return <div style={{ padding: 20 }}>Running Supabase test…</div>;
  if (out.error) return <div style={{ padding: 20, color: 'crimson' }}>Error: {out.error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Supabase test output</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f3f3f3', padding: 12 }}>{JSON.stringify(out.data, null, 2)}</pre>
    </div>
  );
}
