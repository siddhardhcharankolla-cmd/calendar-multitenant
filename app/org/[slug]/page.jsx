'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function OrgUserPage() {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const { data: orgData, error: orgErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .limit(1)
          .single();
        if (orgErr) throw orgErr;
        setOrg(orgData);

        const { data: evts, error: evtErr } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', orgData.id)
          ;
        if (evtErr) throw evtErr;
        setEvents(evts || []);
      } catch (e) {
        setMessage({ type: 'error', text: e.message || JSON.stringify(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <div style={{ padding: 16 }}>Loading events...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>{org ? `${org.name} - Events` : 'Organization events'}</h1>
      {message && <div style={{ color: message.type === 'error' ? 'crimson' : 'green' }}>{message.text}</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {events.map(ev => (
          <li key={ev.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{ev.title ?? ev.name}</strong>
                <div style={{ fontSize: 13 }}>
                  {ev.start_date}
                  {ev.end_date ? ` - ${ev.end_date}` : ''}
                </div>
                {ev.country && <div style={{ fontSize: 12 }}>Country: {ev.country}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12 }}>{ev.source}</div>
              </div>
            </div>
            {ev.description && <div style={{ marginTop: 6 }}>{ev.description}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}



