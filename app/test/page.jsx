'use client';
import { useEffect, useState } from 'react';

export default function TestPage() {
  const [state, setState] = useState({ loading: true, result: null });
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/test');
        const json = await r.json();
        setState({ loading: false, result: json });
      } catch (err) {
        setState({ loading: false, result: { ok: false, error: String(err) } });
      }
    })();
  }, []);
  if (state.loading) return <div style={{ padding: 16 }}>Running combined test…</div>;
  return (
    <div style={{ padding: 16 }}>
      <h2>/api/test result</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 12 }}>{JSON.stringify(state.result, null, 2)}</pre>
    </div>
  );
}
